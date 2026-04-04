#!/usr/bin/env python3
"""
Regenerate the inline data fallback in index.html after editing data/journeys.json.

Usage:
    python3 scripts/build-inline.py

What this does:
    1. Reads data/journeys.json
    2. Finds the <script id="inline-data" type="application/json"> tag in index.html
    3. Replaces its content with the current JSON data
    4. Writes the updated index.html

Why this exists:
    index.html has a dual data loading strategy:
    - Primary: fetch('data/journeys.json') — works on GitHub Pages / local server
    - Fallback: inline JSON in a <script> tag — works when opened as a standalone file

    After editing journeys.json, the inline fallback becomes stale.
    Run this script to sync them.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_PATH = ROOT / 'data' / 'journeys.json'
HTML_PATH = ROOT / 'index.html'

def main():
    # Read JSON
    if not DATA_PATH.exists():
        print(f"ERROR: {DATA_PATH} not found")
        sys.exit(1)
    json_content = DATA_PATH.read_text(encoding='utf-8').strip()

    # Read HTML
    if not HTML_PATH.exists():
        print(f"ERROR: {HTML_PATH} not found")
        sys.exit(1)
    html = HTML_PATH.read_text(encoding='utf-8')

    # Find and replace the inline-data script content
    pattern = r'(<script id="inline-data" type="application/json">)(.*?)(</script>)'
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        print("ERROR: Could not find <script id=\"inline-data\" type=\"application/json\"> in index.html")
        print("Make sure the tag exists. Expected format:")
        print('  <script id="inline-data" type="application/json">...data...</script>')
        sys.exit(1)

    old_data = match.group(2).strip()
    new_html = html[:match.start(2)] + json_content + html[match.end(2):]

    # Write
    HTML_PATH.write_text(new_html, encoding='utf-8')

    old_len = len(old_data)
    new_len = len(json_content)
    print(f"Updated inline data in {HTML_PATH}")
    print(f"  Old: {old_len:,} chars")
    print(f"  New: {new_len:,} chars")
    print(f"  Delta: {new_len - old_len:+,} chars")
    print(f"  Total HTML: {len(new_html):,} chars")

if __name__ == '__main__':
    main()
