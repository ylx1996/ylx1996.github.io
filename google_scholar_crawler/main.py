"""Read the public Scholar profile with bounded requests; never publish partial data."""
import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import parse_qs, urlparse


class Element:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children).strip()

    def all(self, predicate):
        for c in self.children:
            if isinstance(c, Element):
                if predicate(c):
                    yield c
                yield from c.all(predicate)

    def find(self, predicate):
        return next(self.all(predicate), None)

    def has_class(self, name):
        return name in self.attrs.get('class', '').split()


class Document(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Element()
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Element(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, text):
        self.stack[-1].children.append(text)


def parse_profile(html, scholar_id):
    root = Document(html).root
    canonical = root.find(lambda n: n.tag == 'link' and n.attrs.get('rel') == 'canonical')
    if not canonical or parse_qs(urlparse(canonical.attrs.get('href', '')).query).get('user') != [scholar_id]:
        raise ValueError('Profile identity cannot be verified; refusing to replace statistics.')
    name = root.find(lambda n: n.attrs.get('id') == 'gsc_prf_in')
    table = root.find(lambda n: n.attrs.get('id') == 'gsc_rsb_st')
    counts = list(table.all(lambda n: n.has_class('gsc_rsb_std'))) if table else []
    if not name or not counts or not re.fullmatch(r'[\d,]+', counts[0].text()):
        raise ValueError('Missing citation table (possibly a blocked or changed Scholar page).')
    publications = {}
    for row in root.all(lambda n: n.has_class('gsc_a_tr')):
        title = row.find(lambda n: n.has_class('gsc_a_at'))
        citations = row.find(lambda n: n.has_class('gsc_a_ac'))
        year = row.find(lambda n: n.has_class('gsc_a_y'))
        if not title:
            continue
        paper_id = parse_qs(urlparse(title.attrs.get('href', '')).query).get('citation_for_view', [''])[0]
        if not paper_id.startswith(scholar_id + ':'):
            raise ValueError('Publication belongs to a different Scholar profile.')
        count = citations.text().replace(',', '').replace('*', '').strip() if citations else ''
        if count and not count.isdigit():
            raise ValueError('Unrecognized paper citation count.')
        publications[paper_id] = {'bib': {'title': title.text(), 'pub_year': year.text() if year else ''}, 'num_citations': int(count or 0)}
    if not publications:
        raise ValueError('Publication list missing; refusing to publish an incomplete response.')
    return {'scholar_id': scholar_id, 'name': name.text(), 'citedby': int(counts[0].text().replace(',', '')),
            'publications': publications, 'source_url': 'https://scholar.google.com/citations?user=' + scholar_id,
            'updated': datetime.now(timezone.utc).isoformat()}


def fetch_profile(scholar_id):
    # One profile request is enough for the total count. No publication-detail crawl,
    # proxy rotation, browser installation, or unbounded retries.
    url = 'https://scholar.google.com/citations?user=' + scholar_id + '&hl=en&pagesize=100'
    result = subprocess.run(['curl', '--fail', '--location', '--max-time', '30', '--silent', '--show-error',
                             '--user-agent', 'Mozilla/5.0', url], capture_output=True, check=True)
    return decode_html(result.stdout)


def decode_html(raw):
    declared = re.search(rb'charset=["\']?([A-Za-z0-9_-]+)', raw[:1024], re.I)
    return raw.decode(declared.group(1).decode('ascii') if declared else 'utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / '_data/scholar.json')
    parser.add_argument('--html', type=Path, help='Validate a saved profile for offline checking; never refresh its timestamp.')
    args = parser.parse_args()
    scholar_id = os.environ.get('GOOGLE_SCHOLAR_ID', 'NQ0z_lgAAAAJ').strip()
    if not re.fullmatch(r'[\w-]+', scholar_id):
        raise ValueError('Invalid Scholar ID.')
    if args.html:
        data = parse_profile(decode_html(args.html.read_bytes()), scholar_id)
        print(json.dumps({'scholar_id': data['scholar_id'], 'citedby': data['citedby'], 'papers': len(data['publications'])}))
        return
    data = parse_profile(fetch_profile(scholar_id), scholar_id)
    # All parsing and identity checks finish before any output is changed.
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, args.output)
    print('Validated Scholar {}: {} citations, {} publications; {}'.format(scholar_id, data['citedby'], len(data['publications']), data['updated']))


if __name__ == '__main__':
    main()
