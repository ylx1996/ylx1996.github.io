"""Fetch and validate Google Scholar statistics before publishing them."""

from datetime import datetime, timezone
import json
import os
from pathlib import Path

from scholarly import scholarly


def prepare_author(author, scholar_id):
    if author.get('scholar_id') != scholar_id:
        raise ValueError('Google Scholar returned a different author')
    citedby = author.get('citedby')
    if type(citedby) is not int or citedby < 0:
        raise ValueError('Missing or invalid total citation count')
    publications = {}
    for publication in author.get('publications', []):
        paper_id = publication.get('author_pub_id', '')
        if not paper_id.startswith(scholar_id + ':'):
            raise ValueError('Publication does not belong to the configured author')
        publications[paper_id] = publication
    result = dict(author)
    result['publications'] = publications
    result['updated'] = datetime.now(timezone.utc).isoformat()
    return result


def main():
    scholar_id = os.environ.get('GOOGLE_SCHOLAR_ID', '').strip()
    if not scholar_id:
        raise ValueError('GOOGLE_SCHOLAR_ID must be configured')
    author = scholarly.search_author_id(scholar_id)
    scholarly.fill(author, sections=['basics', 'indices', 'counts', 'publications'])
    author = prepare_author(author, scholar_id)
    # Write only after the entire fetch and identity validation succeed.
    output = Path(__file__).resolve().parent / 'results'
    output.mkdir(exist_ok=True)
    badge = {'schemaVersion': 1, 'label': 'citations', 'message': str(author['citedby'])}
    for filename, data in [('gs_data.json', author), ('gs_data_shieldsio.json', badge)]:
        (output / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Updated Scholar {scholar_id}: {author['citedby']} citations, {len(author['publications'])} publications")


if __name__ == '__main__':
    main()
