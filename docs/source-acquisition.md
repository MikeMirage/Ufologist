# Source Acquisition Status

Generated from `data/sources/raw` on 2026-06-22.

## Current raw acquisition

| Source | Status | Pages | Downloads | Size | Notes |
|---|---:|---:|---:|---:|---|
| UK MoD | acquired | 2 | 26 | 1.3 MB | Official GOV.UK index and PDFs. Downloads include duplicated second-run files; dedupe before import. |
| Spain Defensa | partial | 72 | 0 | 2.5 MB | Index and many consultation pages acquired. PDF/document links are hidden behind the BVD viewer/actions; needs a dedicated extractor. |
| Brazil Arquivo Nacional | partial | 40 | 29 | 28.8 MB | Official pages and PDFs acquired, but many downloads are general archive reports, not necessarily UFO case files. Needs filtering against SIAN/fundo OVNI metadata. |
| Chile SEFAA | acquired | 45 | 54 | 35.9 MB | Case pages and many official case PDFs acquired. Good next importer target. |
| Argentina CIAE | acquired | 1 | 13 | 93.6 MB | Official annual reports and related PDFs acquired. Good next importer target. |
| Canada LAC | partial | 19 | 0 | 0.7 MB | Research guide and related pages acquired. The digitized document corpus needs a catalog/search acquisition step. |
| NARA UAP | acquired partial | 11 | 5 | 182.6 MB | UAP topic/RG pages plus bulk ZIP/PDF downloads acquired. Manifest reconstructed after interrupted crawl. |
| AARO | blocked | 0 | 0 | 0 MB | Official site returns HTTP 403 to direct crawler/curl from local environment. Browser access works; acquire manually/browser-side or through NARA mirrors. |
| New Zealand NZDF | partial | 1 | 0 | <0.1 MB | National Library record page acquired. Direct downloadable volumes not exposed in the simple page crawl. |
| Danish UFO Files | acquired | 1 | 7 | 133.9 MB | Internet Archive metadata/text/PDF/JP2 assets acquired. Needs OCR/text extraction and licensing review. |
| AFU Sweden | partial | 31 | 30 | 47.0 MB | AFU pages and document downloads acquired. Broad archive; use as documentary corpus, not first map dataset. |

## Raw folder

All acquired material lives under:

```text
data/sources/raw/<source_id>/
  pages/
  downloads/
  manifest.json
```

The consolidated disk summary is:

```text
data/sources/raw/disk-summary.json
```

## Acquisition commands

Acquire or refresh all configured sources:

```bash
node tools/acquire_sources.js
```

Acquire a subset:

```bash
node tools/acquire_sources.js --only=uk_mod,chile_sefaa,argentina_ciae
```

Regenerate disk summary:

```bash
node tools/summarize_acquisition.js
```

## Importer priority

1. **Chile SEFAA**: many direct case PDFs; likely fast to extract dates, case numbers, conclusions and locations.
2. **Argentina CIAE**: annual reports are large but structured enough for table extraction.
3. **UK MoD**: PDFs are small and official; best target for date/time/place/description table extraction.
4. **NARA UAP**: bulk files need inventory and dedupe first.
5. **Spain Defensa**: build a BVD-specific viewer/document extractor.
6. **Canada LAC**: build a search/catalog harvester before document OCR.
7. **Denmark / AFU**: document corpus for OCR and historical enrichment.
8. **AARO**: blocked by HTTP 403 in direct crawler; use browser-driven capture or NARA/official linked documents.

## Normalized extraction

Initial normalized JSONL files now live under:

```text
data/sources/normalized/chile_sefaa.jsonl
data/sources/normalized/uk_mod.jsonl
data/sources/normalized/argentina_ciae.jsonl
data/sources/normalized/denmark_files.jsonl
data/sources/normalized/nara_uap.jsonl
data/sources/normalized/sweden_afu.jsonl
data/sources/normalized/brazil_an.jsonl
data/sources/normalized/canada_lac.jsonl
data/sources/normalized/spain_defensa.jsonl
data/sources/normalized/new_zealand_nzdf.jsonl
data/sources/normalized/aaro.jsonl
data/sources/normalized/acquired_cases.jsonl
data/sources/normalized/acquired_documents.jsonl
data/sources/normalized/acquired_index.json
data/sources/normalized/normalization-summary.json
```

Generate them with:

```bash
node tools/normalize_acquired_sources.js
```

Current extraction status:

| Source | Normalized records | Confidence | Notes |
|---|---:|---|---|
| Chile SEFAA | 53 cases | high | One PDF per case, case number/date/place/region/classification extracted. |
| UK MoD | 2,704 case rows | medium/review | Table rows extracted from annual PDFs. Date/time/description usually reliable; place/county needs validation. |
| Argentina CIAE | 428 case/report records | medium/review | Annual report records plus case index entries with dates/places/pages. Full per-case body extraction is still pending. |
| Spain Defensa | 40 case stubs + 72 documents/pages | medium/review | 40 official BVD expediente titles promoted to `case_catalog_stub` with date/location when present; document/PDF viewer extraction still pending. |
| NARA UAP | 574 incident candidates + 627 documents/inventory rows | medium/review | FAA/SkyWatch `237UAP*.pdf` incident reports parsed from ZIP text. Includes 4 ZIP inventories and 612 ZIP member records. |
| Denmark UFO Files | 4 corpus/inventory rows | medium/review | Full text, PDF and page image ZIP indexed. Danish case chunking pending. |
| AFU Sweden | 61 document rows | medium/review | PDFs, spreadsheets and pages indexed as archive corpus, not case feed. |
| Brazil Arquivo Nacional | 69 document rows | medium/review | PDFs/pages indexed, but marked `needs_filtering`; many downloads are general archive reports. |
| Canada LAC | 19 page rows | medium/review | Includes 6 UFO research-guide pages; catalog/result harvesting still pending. |
| New Zealand NZDF | 1 page row | low/review | Archive page acquired; direct volumes not extracted. |
| AARO | 1 status row | blocked | Direct crawler access blocked by HTTP 403; needs browser/session/manual capture. |

Combined outputs:

| File | Rows | Meaning |
|---|---:|---|
| `acquired_cases.jsonl` | 3,799 | Encounter/report candidates extracted from Chile, UK, Argentina, NARA SkyWatch and Spain BVD stubs. |
| `acquired_documents.jsonl` | 854 | Corpus documents, source pages, ZIP members, guides and acquisition-status rows. Not encounters. |
| `acquired_index.json` | 1 | Machine-readable manifest with output files, totals and field coverage. |

Current case field coverage:

| Field | Rows populated |
|---|---:|
| `event_date` | 3,743 |
| `event_time` | 3,021 |
| `location_name` | 2,647 |
| `shape_reported` | 2,327 |
| `classification_value` | 458 |

Current case rows by source:

| Source | Case rows |
|---|---:|
| UK MoD | 2,704 |
| NARA UAP | 574 |
| Argentina CIAE | 428 |
| Chile SEFAA | 53 |
| Spain Defensa | 40 |

Current case row types:

| Type | Rows |
|---|---:|
| `case_record` | 2,757 |
| `skywatch_incident` | 574 |
| `case_index` | 417 |
| `case_catalog_stub` | 40 |
| `annual_report` | 11 |

`shape_reported` only uses established NUFORC shape labels when the wording clearly matches one of those labels. It is a candidate mapping and should stay reviewable.

## Important distinction

`candidate` in the app catalog means "not normalized into map-ready cases yet", even if raw files have been acquired. `active` should remain reserved for sources already consumed by the UI/map, currently NUFORC and GEIPAN.
