# Monitor: real source metadata

The Monitor consumes `data/monitor-feed.json`, generated from real RSS responses.
It does not call third-party feeds in each visitor's browser. No article page,
article image, testimony, precise location or account data is fetched by this pipeline.

Run a refresh and its deterministic tests:

```sh
python3 tools/test_monitor_feeds.py
python3 tools/update_monitor_feeds.py
```

The production workflow runs on pushes to `main`, manual dispatch and at minutes
17 and 47 of every hour. It tests the product, refreshes the real feeds, commits
only `data/monitor-feed.json`, and deploys the refreshed static site through
GitHub Pages in the same run. GitHub Pages uses the GitHub Actions publishing
source. This avoids relying on a bot commit to trigger a second deployment.

The public frontend polls the published snapshot once per minute while visible.
Its reload button reads that snapshot; visitors do not request origin feeds.
GitHub schedules can be delayed or disabled after repository inactivity. Check
the workflow run and each source's timestamps to establish actual freshness.
The local preview server separately supports explicit same-origin origin refresh.

## Source selection

| Source | Endpoint | Meaning |
| --- | --- | --- |
| NASA | `https://www.nasa.gov/feed/` | General publication feed, filtered for UAP and sky/space context. |
| The Debrief | `https://thedebrief.org/feed/` | Journalistic coverage. Does not verify every assertion. |
| The Black Vault | `https://www.theblackvault.com/documentarchive/feed/` | Archive publications, filtered for relevant topics. |
| GEIPAN | `https://cnes-geipan.fr/rss.xml` | Institutional news; can remain unchanged for long periods. |

NARA, AARO and NUFORC are linked sources with `status: manual`; no automatic
integration is claimed for them. Their access/licensing needs to be resolved
before enabling new connectors. The presence of an RSS endpoint is not a license
to redistribute complete articles or images. This pipeline retains only titles,
links, dates and short plain-text descriptions (at most 280 characters).

## Contract and freshness

- `generatedAt` is the last refresh attempt, not proof that every source worked.
- `lastSuccessfulAt` is the last time at least one configured feed was read.
- Each source separately records `checkedAt`, `lastSuccessAt`, `lastPublishedAt`,
  `status`, a short error, and retained item count.
- `publishedAt` is an origin publication/update timestamp. `ingestedAt` is the
  first detection by this pipeline and stays stable across repeated refreshes.
- `observedAt`, `location` and `caseIds` remain empty. No location or sighting
  time is inferred from a publisher's headquarters or publication date.
- `editorialStatus: unreviewed` means automatic ingestion, not a verdict about
  truth or evidence quality. `category` distinguishes UAP from sky context.
- Feeds with no new matching publications are successful, not broken.
- On an error, the last good source items and success timestamp survive. The
  error is visible; the pipeline never changes old publication dates to now.
- A completely failed run still writes diagnostic state, then returns failure
  for CI monitoring. The workflow commits that state before marking failure.

Parsing handles RSS and Atom, removes HTML/script content, rejects unsafe URLs,
future or timezone-free publication dates, invalid XML and external XML
declarations. Feeds are capped at 3 MB, have bounded timeouts, and cannot redirect
to another source domain. Access restrictions are not bypassed. URL tracking
parameters and fragments are removed before stable IDs and deduplication.

History is limited to 80 relevant items per source. Rules intentionally exclude
unrelated science/general-news items. They can miss relevant content; editorial
review and connector maintenance remain required. The Monitor is a publication
monitor, not a real-time feed of independently verified sightings.

Sky context is limited to skywatching/night-sky material, NASA APOD, meteors,
auroras, eclipses, satellites/Starlink, rocket launches, reentries and spacecraft
reaching orbit. Generic astronomy/solar-system/meteorite keywords alone do not
admit planetary photojournal imagery, astrobiology or cultural astronomy stories.
The alleged “Immaculate Constellation” subject is classified as UAP coverage,
without treating its underlying allegations as established facts. After a
successful source refresh, retained sky-context history is reclassified under
the current rules; a failed source still retains its last valid history.

## References

- [NASA RSS guidance](https://www.nasa.gov/rss-feeds/)
- [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [NUFORC terms](https://nuforc.org/terms/)
- [GEIPAN conditions](https://cnes-geipan.fr/fr/mentions_legales)
- [NARA Catalog API](https://www.archives.gov/research/catalog/help/api)
