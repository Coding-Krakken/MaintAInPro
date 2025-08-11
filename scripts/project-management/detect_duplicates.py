#!/usr/bin/env python3
import sys
import json
import re
from difflib import SequenceMatcher

def normalize(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9 ]', '', text)
    return text.strip()

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def main():
    issues = json.load(sys.stdin)
    threshold_title = 0.8
    threshold_body = 0.9
    seen_titles = {}
    seen_bodies = {}
    duplicates = set()
    for i, issue in enumerate(issues):
        num = issue['number']
        title = normalize(issue.get('title', ''))
        body = normalize(issue.get('body', ''))
        # Exact title
        if title in seen_titles:
            duplicates.add(num)
        else:
            seen_titles[title] = num
        # Exact body
        if body in seen_bodies:
            duplicates.add(num)
        else:
            seen_bodies[body] = num
    # Fuzzy matching
    for i, issue_i in enumerate(issues):
        num_i = issue_i['number']
        title_i = normalize(issue_i.get('title', ''))
        body_i = normalize(issue_i.get('body', ''))
        for j in range(i+1, len(issues)):
            issue_j = issues[j]
            num_j = issue_j['number']
            title_j = normalize(issue_j.get('title', ''))
            body_j = normalize(issue_j.get('body', ''))
            if similarity(title_i, title_j) >= threshold_title:
                duplicates.add(num_j)
            if similarity(body_i, body_j) >= threshold_body:
                duplicates.add(num_j)
    for num in sorted(duplicates):
        print(num)

if __name__ == "__main__":
    main()
