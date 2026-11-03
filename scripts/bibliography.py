"""Validate and format the site's self-contained BibTeX bibliography (stdlib only)."""
import argparse
import json
from pathlib import Path
import re

FIELD_ORDER = ['author', 'title', 'booktitle', 'journal', 'volume', 'number', 'pages', 'year', 'organization', 'publisher', 'doi', 'url']


def parse(text, strict=True):
    entries, position = [], 0
    def skip():
        nonlocal position
        while position < len(text):
            if text[position].isspace():
                position += 1
            elif text[position] == '%':
                end = text.find('\n', position)
                position = end if end >= 0 else len(text)
            else:
                break
    while True:
        skip()
        if position == len(text):
            break
        header = re.match(r'@(inproceedings|article|misc)\s*\{\s*([\w:.-]+)\s*,', text[position:], re.I)
        if not header:
            raise ValueError('Unsupported entry or invalid syntax near character {}'.format(position))
        entry = {'type': header.group(1).lower(), 'key': header.group(2), 'fields': {}}
        position += header.end()
        while True:
            skip()
            if position >= len(text):
                raise ValueError('Unclosed entry ' + entry['key'])
            if text[position] == '}':
                position += 1
                break
            field = re.match(r'([A-Za-z][\w-]*)\s*=\s*', text[position:])
            if not field:
                raise ValueError('Invalid field in ' + entry['key'])
            name = field.group(1).lower()
            if name in entry['fields']:
                raise ValueError('Duplicate field ' + name)
            position += field.end()
            if position >= len(text):
                raise ValueError('Missing field value')
            opening = text[position]
            if opening in '{"':
                closing = '}' if opening == '{' else '"'
                position += 1
                start, depth = position, 1
                while position < len(text):
                    ch = text[position]
                    if ch == '\\':
                        position += 2
                        continue
                    if opening == '{' and ch == '{':
                        depth += 1
                    if ch == closing:
                        depth -= 1
                        if depth == 0:
                            break
                    position += 1
                if depth:
                    raise ValueError('Unbalanced field braces in ' + entry['key'])
                value = text[start:position]
                position += 1
            else:
                literal = re.match(r'\d+', text[position:])
                if not literal:
                    raise ValueError('Use braced values instead of BibTeX macros in ' + entry['key'])
                value = literal.group()
                position += literal.end()
            entry['fields'][name] = re.sub(r'\s+', ' ', value).strip()
            skip()
            if position < len(text) and text[position] == ',':
                position += 1
            elif position >= len(text) or text[position] != '}':
                raise ValueError('Missing comma in ' + entry['key'])
        entries.append(entry)
    if strict:
        validate(entries)
    return entries


def title_key(value):
    return re.sub(r'[^\w]', '', value).casefold()


def validate(entries):
    keys, titles, dois = set(), set(), set()
    for entry in entries:
        key, fields = entry['key'], entry['fields']
        required = ['author', 'title', 'year']
        if entry['type'] == 'inproceedings': required.append('booktitle')
        if entry['type'] == 'article': required.append('journal')
        missing = [k for k in required if not fields.get(k)]
        if missing: raise ValueError('{} missing {}'.format(key, ', '.join(missing)))
        if key in keys: raise ValueError('Duplicate citation key: ' + key)
        keys.add(key)
        title = title_key(fields['title'])
        if title in titles: raise ValueError('Duplicate title: ' + fields['title'])
        titles.add(title)
        doi = fields.get('doi', '').lower().replace('https://doi.org/', '')
        if doi and doi in dois: raise ValueError('Duplicate DOI: ' + doi)
        if doi: dois.add(doi)
        if not re.fullmatch(r'\d{4}', fields['year']): raise ValueError('Invalid year: ' + key)
        if re.search(r'\bet\s+al\b|\.\.\.|…', fields['author'], re.I): raise ValueError('Incomplete author list: ' + key)
        if re.search(r'(?<!\\)&', fields.get('journal', '') + fields.get('booktitle', '')):
            raise ValueError('Escape venue ampersands with \\&: ' + key)


def format_entries(entries):
    blocks = []
    for entry in entries:
        fields = dict(entry['fields'])
        if 'pages' in fields:
            fields['pages'] = re.sub(r'(?<=\d)\s*[-–—]+\s*(?=\d)', '--', fields['pages'])
        names = [k for k in FIELD_ORDER if k in fields] + sorted(set(fields) - set(FIELD_ORDER))
        lines = ['@{}{{{},'.format(entry['type'], entry['key'])]
        lines.extend('  {} = {{{}}}{}'.format(k, fields[k], ',' if i < len(names) - 1 else '') for i, k in enumerate(names))
        blocks.append('\n'.join(lines + ['}']))
    return '\n\n'.join(blocks) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--write', action='store_true', help='Apply normalization in place; otherwise check only.')
    args = parser.parse_args()
    original = args.file.read_text(encoding='utf-8-sig')
    entries = parse(original)
    formatted = format_entries(entries)
    # A formatting pass must round-trip all metadata; only page range separators change.
    validate(parse(formatted))
    if args.write:
        args.file.write_bytes(formatted.encode('utf-8'))
    elif original != formatted:
        raise SystemExit('Valid BibTeX, but formatting differs. Run with --write to normalize.')
    print(json.dumps({'entries': len(entries), 'conference': sum(e['type'] == 'inproceedings' for e in entries), 'journal': sum(e['type'] == 'article' for e in entries), 'preprint_or_other': sum(e['type'] == 'misc' for e in entries)}))


if __name__ == '__main__':
    main()
