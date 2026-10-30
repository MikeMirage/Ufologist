#!/usr/bin/env python3
"""Build the public Monitor snapshot from explicitly selected RSS/Atom sources.

Only attributed publication metadata is retained. No article pages are fetched,
and no sighting time, geographic location or case relationship is inferred.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'data' / 'monitor-feed.json'
MAX_BYTES = 3_000_000
TIMEOUT = 20
MAX_RETAINED_PER_SOURCE = 80
USER_AGENT = 'UFOlogistMonitor/1.0 (+https://github.com/MikeMirage/Ufologist)'

SOURCES = [
    dict(id='nasa', name='NASA', url='https://www.nasa.gov/',
         feedUrl='https://www.nasa.gov/feed/', kind='institution',
         description='Ciencia y contexto del cielo. RSS general, filtrado por relevancia UAP o aeroespacial.'),
    dict(id='debrief', name='The Debrief', url='https://thedebrief.org/',
         feedUrl='https://thedebrief.org/feed/', kind='media',
         description='Cobertura periodística de UAP, ciencia y tecnología. Publicación no equivale a verificación.'),
    dict(id='black-vault', name='The Black Vault', url='https://www.theblackvault.com/documentarchive/',
         feedUrl='https://www.theblackvault.com/documentarchive/feed/', kind='archive',
         description='Publicaciones documentales y archivos. Se filtran temas ajenos al fenómeno UAP.'),
    dict(id='geipan', name='GEIPAN · CNES', url='https://cnes-geipan.fr/',
         feedUrl='https://cnes-geipan.fr/rss.xml', kind='institution',
         description='Actualidad institucional de baja frecuencia; el RSS no es un flujo de avistamientos.'),
    dict(id='nara', name='NARA', url='https://www.archives.gov/research/topics/uaps/rg-615',
         feedUrl=None, kind='archive',
         description='Colección oficial UAP RG 615. Consulta documental enlazada; conector API pendiente.'),
    dict(id='aaro', name='AARO', url='https://www.aaro.mil/', feedUrl=None, kind='institution',
         description='Informes y resoluciones oficiales. Fuente enlazada; acceso automático no validado.'),
    dict(id='nuforc', name='NUFORC', url='https://nuforc.org/', feedUrl=None, kind='archive',
         description='Fuente de testimonios enlazada. Integración sujeta a acceso y permiso de reutilización.'),
]


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        date = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
    except (ValueError, TypeError):
        try:
            date = parsedate_to_datetime(value.strip())
        except (ValueError, TypeError, OverflowError):
            return None
    # An absent offset is not enough to fabricate a precise publication instant.
    if date.tzinfo is None:
        return None
    return date.astimezone(timezone.utc)


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag.lower() in ('script', 'style'):
            self.hidden += 1
        elif tag.lower() in ('p', 'div', 'br', 'li', 'h1', 'h2', 'h3'):
            self.parts.append(' ')

    def handle_endtag(self, tag):
        if tag.lower() in ('script', 'style') and self.hidden:
            self.hidden -= 1
        self.parts.append(' ')

    def handle_data(self, text):
        if not self.hidden:
            self.parts.append(text)


def clean_text(value: str, limit: int = 280) -> str:
    parser = PlainText()
    parser.feed(value or '')
    text = re.sub(r'\s+', ' ', ''.join(parser.parts)).strip()
    # Do not retain ASCII control characters in JSON/DOM content.
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    if len(text) <= limit:
        return text
    return text[:limit - 1].rsplit(' ', 1)[0].rstrip() + '…'


def safe_url(value: str | None) -> str | None:
    try:
        parts = urlsplit((value or '').strip())
        if parts.scheme.lower() not in ('https', 'http') or not parts.hostname:
            return None
        if parts.username or parts.password or re.search(r'[\s\x00-\x1f\\]', value or ''):
            return None
        # Accessing .port validates malformed ports, even when no port is rewritten.
        _ = parts.port
        query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
                 if not k.lower().startswith('utm_') and k.lower() not in ('fbclid', 'gclid')]
        return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path or '/', urlencode(query), ''))
    except (ValueError, TypeError):
        return None


UAP_TERMS = re.compile(
    r'\b(?:uaps?|ufos?|ovnis?|geipan|nuforc)\b|unidentified\s+(?:aerial|anomalous|flying)'
    r'|ph[eé]nom[eè]nes?\s+a[eé]rospatiaux\s+non\s+identifi[eé]s?'
    r'|fen[oó]menos?\s+(?:a[eé]reos?|an[oó]malos?)\s+no\s+identificados?'
    r'|flying\s+saucers?|immaculate\s+constellation', re.I)
SKY_TERMS = re.compile(
    r'\b(?:skywatching|meteors?|satellites?|auroras?|eclipses?|starlink|bolides?|fireballs?)\b'
    r'|night\s+sky|rocket\s+launch|lunar\s+eclipse|re-?entr(?:y|ies)'
    r'|(?:spacecraft|spaceflight).{0,80}\b(?:orbit|launch|reentry|re-entry)\b', re.I)


def classify(title: str, description: str, source_id: str) -> str | None:
    content = title + ' ' + description
    if UAP_TERMS.search(content) or source_id == 'geipan':
        return 'uap'
    # APOD is an explicitly selected sky-context source feature. Do not admit
    # unrelated astrophysics, planetary imagery or astrobiology by broad words
    # such as "astronomy", "meteorite" or "solar system" in general RSS text.
    if source_id == 'nasa' and re.match(r'^APOD\s*:', title, re.I):
        return 'sky-context'
    if SKY_TERMS.search(content):
        return 'sky-context'
    return None


def publication_summary(title: str, description: str, source_id: str) -> str:
    """Omit APOD navigation instead of presenting it as an editorial summary."""
    if source_id == 'nasa' and re.match(r'^APOD\s*:', title, re.I):
        navigation = (
            r'today[\u2019\u0027]s\s+apod', r'archive\s+submissions',
            r'index\s+search\s+calendar', r'rss\s+education', r'about\s+discuss',
        )
        if sum(bool(re.search(pattern, description, re.I)) for pattern in navigation) >= 2:
            return ''
    return clean_text(description, 280)


def local_name(tag: str) -> str:
    return tag.rsplit('}', 1)[-1].lower()


def child_text(node, names) -> str:
    for child in node:
        if local_name(child.tag) in names:
            return ''.join(child.itertext()).strip()
    return ''


def parse_feed(data: bytes, source: dict, now: datetime) -> tuple[list[dict], dict]:
    if len(data) > MAX_BYTES:
        raise ValueError('El feed excede el límite de tamaño')
    # ElementTree must never process external declarations or entity expansions.
    if re.search(br'<!\s*(?:DOCTYPE|ENTITY)', data, re.I):
        raise ValueError('Declaraciones XML externas no permitidas')
    root = ET.fromstring(data)
    if local_name(root.tag) not in ('rss', 'feed', 'rdf'):
        raise ValueError('La respuesta no es RSS ni Atom')
    entries = [el for el in root.iter() if local_name(el.tag) in ('item', 'entry')]
    accepted, dates = [], []
    for entry in entries:
        title = clean_text(child_text(entry, {'title'}), 240)
        description = clean_text(child_text(entry, {'description', 'summary', 'content', 'encoded'}), 4000)
        published = parse_date(child_text(entry, {'pubdate', 'published', 'date'}))
        # Atom commonly supplies updated only; it is an origin update, not observation time.
        if not published:
            published = parse_date(child_text(entry, {'updated'}))
        link = None
        for el in entry:
            if local_name(el.tag) == 'link':
                if el.attrib.get('rel', 'alternate') in ('alternate', ''):
                    link = safe_url(el.attrib.get('href') or el.text)
                    if link:
                        break
        if not link:
            link = safe_url(child_text(entry, {'guid', 'id'}))
        if not title or not link or not published or published > now:
            continue
        dates.append(published)
        category = classify(title, description, source['id'])
        if not category:
            continue
        stable = hashlib.sha256(link.encode()).hexdigest()[:20]
        accepted.append(dict(
            id=f"{source['id']}-{stable}", sourceId=source['id'], title=title,
            url=link, publishedAt=iso(published), ingestedAt=iso(now),
            summary=publication_summary(title, description, source['id']), category=category,
            kind='article' if source['kind'] == 'media' else 'update',
            editorialStatus='unreviewed', observedAt=None, location=None, caseIds=[]))
    return deduplicate(accepted), dict(
        fetchedItemCount=len(entries), lastPublishedAt=iso(max(dates)) if dates else None)


def deduplicate(items: list[dict]) -> list[dict]:
    result = {}
    for item in items:
        url = safe_url(item.get('url'))
        if url:
            result.setdefault(url, item)
    return sorted(result.values(), key=lambda item: (item.get('publishedAt') or '', item['id']), reverse=True)


class SourceRedirects(HTTPRedirectHandler):
    def __init__(self, allowed_host: str):
        self.allowed_host = allowed_host.removeprefix('www.').lower()

    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        parsed = urlsplit(new_url)
        if parsed.scheme not in ('https', 'http') or (parsed.hostname or '').removeprefix('www.').lower() != self.allowed_host:
            raise ValueError('Redirección fuera del dominio de la fuente')
        return super().redirect_request(request, file_pointer, code, message, headers, new_url)


def fetch_feed(source: dict) -> bytes:
    request = Request(source['feedUrl'], headers={
        'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9'})
    opener = build_opener(SourceRedirects(urlsplit(source['feedUrl']).hostname))
    last_error = None
    for attempt in range(2):
        try:
            with opener.open(request, timeout=TIMEOUT) as response:
                data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise ValueError('El feed excede el límite de tamaño')
                return data
        except HTTPError as error:
            last_error = error
            # Access restrictions must not trigger repeated requests or alternate identities.
            if error.code < 500:
                raise
        except (URLError, TimeoutError, OSError) as error:
            last_error = error
        if attempt == 0:
            time.sleep(1)
    raise last_error


def build_snapshot(previous: dict | None = None, fetcher=fetch_feed,
                   now: datetime | None = None) -> dict:
    previous = previous or {}
    now = now or datetime.now(timezone.utc)
    previous_sources = {s['id']: s for s in previous.get('sources', [])}
    previous_items = previous.get('items', [])
    sources, all_items = [], []
    successful = False
    for config in SOURCES:
        old = previous_sources.get(config['id'], {})
        status = dict(config, status='manual', checkedAt=None,
                      lastSuccessAt=old.get('lastSuccessAt'), lastPublishedAt=old.get('lastPublishedAt'),
                      itemCount=0, error=None)
        if not config['feedUrl']:
            sources.append(status)
            continue
        status['checkedAt'] = iso(now)
        retained = [i for i in previous_items if i.get('sourceId') == config['id']]
        try:
            fresh, stats = parse_feed(fetcher(config), config, now)
            previous_by_id = {i['id']: i for i in retained}
            for item in fresh:
                old_item = previous_by_id.get(item['id'])
                if old_item:
                    item['ingestedAt'] = old_item.get('ingestedAt') or item['ingestedAt']
            # Reapply the narrower context policy to history after a successful
            # refresh, so excluded general-science items do not remain forever.
            # UAP history is preserved; absence of keywords in a truncated
            # summary must not erase an earlier valid topical match.
            filtered_history = []
            for item in retained:
                category = classify(item.get('title', ''), item.get('summary', ''), config['id'])
                if item.get('category') == 'uap' or category:
                    filtered_history.append(dict(item,
                        category='uap' if item.get('category') == 'uap' else category,
                        summary=publication_summary(item.get('title', ''), item.get('summary', ''), config['id'])))
            # Keep a bounded history when a feed rotates its finite window.
            retained = deduplicate(fresh + filtered_history)[:MAX_RETAINED_PER_SOURCE]
            status.update(stats, status='ok', lastSuccessAt=iso(now))
            successful = True
        except (ET.ParseError, ValueError, HTTPError, URLError, TimeoutError, OSError) as error:
            # URLError.__str__ uses angle brackets; treating it as HTML hides
            # the diagnostic. Store bounded plain text and let the UI escape it.
            reason = str(getattr(error, 'reason', error)).replace('<', '').replace('>', '')
            reason = re.sub(r'[\x00-\x1f\x7f]', ' ', reason)
            status.update(status='error', error=(type(error).__name__ + ': ' + reason)[:180])
        status['itemCount'] = len(retained)
        all_items.extend(retained)
        sources.append(status)
    all_items = deduplicate(all_items)
    return dict(schemaVersion=1, generatedAt=iso(now),
                lastSuccessfulAt=iso(now) if successful else previous.get('lastSuccessfulAt'),
                sources=sources, items=all_items)


def refresh_snapshot(output: Path = OUTPUT, fetcher=fetch_feed,
                     now: datetime | None = None) -> dict:
    """Refresh and atomically persist; suitable for the local development server."""
    output = Path(output)
    previous = {}
    if output.exists():
        try:
            previous = json.loads(output.read_text())
        except (ValueError, OSError):
            print('No se pudo leer el snapshot previo; se creará uno nuevo.', file=sys.stderr)
    snapshot = build_snapshot(previous, fetcher=fetcher, now=now)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=output.parent,
                                     prefix=output.name + '.', suffix='.tmp', delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
    try:
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)
    return snapshot


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    snapshot = refresh_snapshot(args.output)
    for source in snapshot['sources']:
        print(f"{source['id']}: {source['status']} · {source['itemCount']} publicaciones · {source.get('error') or ''}")
    print(f"Snapshot: {len(snapshot['items'])} publicaciones · {args.output}")
    # A fully failed run must surface in CI even though the last good snapshot survives.
    if not any(source['status'] == 'ok' for source in snapshot['sources']):
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
