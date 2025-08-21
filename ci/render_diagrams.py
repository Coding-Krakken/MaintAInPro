# MaintAInPro render_diagrams.py
# Renders the process graph to Mermaid format for MaintAInPro CMMS
import yaml
import sys
from pathlib import Path

def build_mermaid(graph):
    lines = ['flowchart TD']
    for node in graph.get('nodes', []):
        lines.append(f"{node['id']}[\"{node['id']}\"]")
        if 'next' in node:
            lines.append(f"{node['id']} --> {node['next']}")
    return '\n'.join(lines)

def main():
    graph_path = Path('.process/graph.yaml')
    if not graph_path.exists():
        print('ERROR: Process graph not found.')
        sys.exit(1)
    with open(graph_path) as f:
        graph = yaml.safe_load(f)
    mermaid = build_mermaid(graph)
    print(mermaid)
    sys.exit(0)

if __name__ == '__main__':
    main()
