#!/usr/bin/env python3
"""Deterministic tests for the Monitor ingestion contract (no network)."""
from datetime import datetime, timezone
from pathlib import Path
import sys
import tempfile
import json
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import update_monitor_feeds as monitor

NOW = datetime(2026, 10, 30, 15, tzinfo=timezone.utc)
SOURCE = dict(id='test', name='Test source', kind='media')


def rss(entries):
    return ('<rss version="2.0"><channel>' + entries + '</channel></rss>').encode()


class MonitorFeedTests(unittest.TestCase):
    def test_rss_metadata_is_safe_bounded_and_deduplicated(self):
        item = '''<item><title><![CDATA[UAP &amp; documents]]></title>
        <link>https://example.org/story?utm_source=rss&amp;v=1#fragment</link>
        <pubDate>Fri, 30 Oct 2026 12:00:00 GMT</pubDate>
        <description><![CDATA[<p>UFO document <b>metadata</b>.</p><script>steal()</script>''' + ('word ' * 100) + ''']]></description></item>'''
        items, stats = monitor.parse_feed(rss(item + item), SOURCE, NOW)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['title'], 'UAP & documents')
        self.assertEqual(items[0]['url'], 'https://example.org/story?v=1')
        self.assertNotIn('steal', items[0]['summary'])
        self.assertNotIn('<', items[0]['summary'])
        self.assertLessEqual(len(items[0]['summary']), 280)
        self.assertIsNone(items[0]['location'])
        self.assertIsNone(items[0]['observedAt'])
        self.assertEqual(items[0]['caseIds'], [])
        self.assertEqual(items[0]['editorialStatus'], 'unreviewed')
        self.assertEqual(stats['fetchedItemCount'], 2)
        self.assertEqual(items[0]['publishedAt'], '2026-10-30T12:00:00Z')

    def test_atom_uses_alternate_url_and_keeps_origin_time(self):
        atom = b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry>
        <id>tag:example,2026:item-2</id><title>UAP research update</title>
        <link rel="self" href="https://example.org/api/item"/>
        <link rel="alternate" href="https://example.org/story"/>
        <published>2026-10-29T15:30:00-04:00</published>
        <summary type="html">Research &amp; evidence</summary></entry></feed>'''
        items, _ = monitor.parse_feed(atom, SOURCE, NOW)
        self.assertEqual(items[0]['url'], 'https://example.org/story')
        self.assertEqual(items[0]['publishedAt'], '2026-10-29T19:30:00Z')
        self.assertEqual(items[0]['ingestedAt'], '2026-10-30T15:00:00Z')

    def test_future_unknown_dates_and_unsafe_links_do_not_publish(self):
        items_xml = ''
        for url, date in [('javascript:alert(1)', 'Fri, 30 Oct 2026 12:00:00 GMT'),
                          ('https://example.org/future', 'Fri, 30 Oct 2026 16:00:00 GMT'),
                          ('https://example.org/unknown', 'not-a-date'),
                          ('https://example.org/no-zone', '2026-10-30T12:00:00')]:
            items_xml += f'<item><title>UFO report</title><link>{url}</link><pubDate>{date}</pubDate></item>'
        items, _ = monitor.parse_feed(rss(items_xml), SOURCE, NOW)
        self.assertEqual(items, [])

    def test_relevance_does_not_match_incidental_substrings(self):
        self.assertEqual(monitor.classify('UAP research', '', 'nasa'), 'uap')
        self.assertEqual(monitor.classify('OVNIs en el archivo', '', 'test'), 'uap')
        self.assertEqual(monitor.classify('November night sky', '', 'nasa'), 'sky-context')
        self.assertEqual(monitor.classify('New rocket launch', '', 'nasa'), 'sky-context')
        self.assertIsNone(monitor.classify('Guapote fish discovery', '', 'test'))
        self.assertIsNone(monitor.classify('Budget announcement', '', 'nasa'))

    def test_sky_context_is_observation_related_not_general_science(self):
        excluded = [
            ('Map Showing Potential Origins of Martian Meteorite Teghaza 001', 'A global map of Mars'),
            ('Slice of Martian Meteorite Teghaza 001', 'A mineralogy laboratory analysis'),
            ('Scientists Looked at Van Gogh and Made an Astronomical Discovery', 'Stellar data in a painting'),
            ('Scientists Build a Sensor for a Signature of Life', 'Tests molecules in meteorites and soil'),
            ('A New Object Beyond Pluto', 'New dwarf planet in the solar system'),
        ]
        for title, description in excluded:
            self.assertIsNone(monitor.classify(title, description, 'test'), title)
        for title in ('Meteor shower tonight', 'Spacecraft reaches orbit', 'Rocket launch visible tonight',
                      'Satellite flaring explained', 'Aurora forecast', 'Re-entry over the Pacific'):
            self.assertEqual(monitor.classify(title, '', 'test'), 'sky-context', title)
        self.assertEqual(monitor.classify('APOD: Haunting the Cepheus Flare', '', 'nasa'), 'sky-context')
        self.assertEqual(monitor.classify('Immaculate Constellation FOIA appeal', '', 'black-vault'), 'uap')

    def test_apod_navigation_is_omitted_without_fabricating_a_summary(self):
        source = dict(SOURCE, id='nasa', kind='institution')
        item = '''<item><title>APOD: Haunting the Cepheus Flare</title>
        <link>https://science.nasa.gov/image-article/apod-2026-october-30/</link>
        <pubDate>Fri, 30 Oct 2026 04:05:00 GMT</pubDate>
        <description>APOD Science APOD Today's APOD Archive Submissions Index Search Calendar
        RSS Education About Discuss APOD Astronomy Picture of the Day Discover the cosmos!</description></item>'''
        result, _ = monitor.parse_feed(rss(item), source, NOW)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['title'], 'APOD: Haunting the Cepheus Flare')
        self.assertEqual(result[0]['summary'], '')
        self.assertEqual(result[0]['publishedAt'], '2026-10-30T04:05:00Z')
        self.assertEqual(result[0]['url'], 'https://science.nasa.gov/image-article/apod-2026-october-30/')
        self.assertEqual(result[0]['category'], 'sky-context')
        useful = "Today's APOD shows a dark nebula against a field of stars."
        self.assertEqual(monitor.publication_summary(result[0]['title'], useful, 'nasa'), useful)

    def test_html_errors_and_xml_entities_are_rejected(self):
        for content in (b'<html><body>Access denied</body></html>',
                        b'<!DOCTYPE rss [<!ENTITY x "UAP">]><rss/>',
                        b'<rss><channel>broken'):
            with self.assertRaises((ValueError, monitor.ET.ParseError)):
                monitor.parse_feed(content, SOURCE, NOW)

    def test_failed_source_keeps_last_good_data_and_success_time(self):
        existing = dict(id='old', sourceId='nasa', title='UFO research',
                        url='https://www.nasa.gov/old/', publishedAt='2026-10-01T10:00:00Z',
                        ingestedAt='2026-10-02T10:00:00Z')
        previous = dict(lastSuccessfulAt='2026-10-02T10:00:00Z',
                        sources=[dict(id='nasa', lastSuccessAt='2026-10-02T10:00:00Z',
                                      lastPublishedAt='2026-10-01T10:00:00Z')], items=[existing])
        def fail(_):
            raise OSError('Source unavailable')
        result = monitor.build_snapshot(previous, fail, NOW)
        self.assertEqual(result['items'], [existing])
        self.assertEqual(result['lastSuccessfulAt'], previous['lastSuccessfulAt'])
        nasa = next(s for s in result['sources'] if s['id'] == 'nasa')
        self.assertEqual(nasa['status'], 'error')
        self.assertEqual(nasa['lastSuccessAt'], previous['lastSuccessfulAt'])
        self.assertEqual(nasa['checkedAt'], '2026-10-30T15:00:00Z')
        self.assertTrue(all(s['checkedAt'] is None for s in result['sources'] if s['status'] == 'manual'))

    def test_refresh_preserves_first_ingestion_and_no_news_is_success(self):
        xml = rss('''<item><title>UFO research</title><link>https://www.nasa.gov/research/</link>
        <pubDate>Thu, 29 Oct 2026 12:00:00 GMT</pubDate></item>''')
        first = monitor.build_snapshot({}, lambda _: xml, datetime(2026, 10, 29, 15, tzinfo=timezone.utc))
        second = monitor.build_snapshot(first, lambda _: xml, NOW)
        self.assertEqual(first['items'][0]['ingestedAt'], second['items'][0]['ingestedAt'])
        self.assertEqual(second['sources'][0]['status'], 'ok')
        empty = monitor.build_snapshot(second, lambda _: rss(''), NOW)
        self.assertEqual(empty['sources'][0]['status'], 'ok')
        self.assertTrue(empty['items'])

    def test_successful_refresh_removes_excluded_context_from_history(self):
        previous = {'items': [dict(id='old', sourceId='nasa',
                    title='Slice of Martian Meteorite', summary='A laboratory analysis',
                    url='https://www.nasa.gov/mars/', publishedAt='2026-10-29T10:00:00Z',
                    ingestedAt='2026-10-29T12:00:00Z', category='sky-context')]}
        updated = monitor.build_snapshot(previous, lambda _: rss(''), NOW)
        self.assertEqual(updated['items'], [])

    def test_safe_url_rejects_credentials_and_malformed_ports(self):
        for url in ('file:///tmp/test', 'https://user:pass@example.org/',
                    'https://example.org:invalid/', 'https://example.org/ bad', '//example.org/'):
            self.assertIsNone(monitor.safe_url(url))
        self.assertEqual(monitor.safe_url('https://example.org/item?a=1&utm_source=test'), 'https://example.org/item?a=1')

    def test_refresh_writes_a_complete_snapshot_without_temporary_files(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'feed.json'
            result = monitor.refresh_snapshot(path, lambda _: rss(''), NOW)
            self.assertEqual(json.loads(path.read_text()), result)
            self.assertEqual([p.name for p in path.parent.iterdir()], ['feed.json'])


if __name__ == '__main__':
    unittest.main()
