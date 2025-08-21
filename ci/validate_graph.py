# MaintAInPro validate_graph.py
# Validates the process graph for MaintAInPro CMMS
import yaml
import sys
from pathlib import Path

def main():
    graph_path = Path('.process/graph.yaml')
    if not graph_path.exists():
        print('ERROR: Process graph not found.')
        sys.exit(1)
    with open(graph_path) as f:
        graph = yaml.safe_load(f)
    if 'nodes' not in graph or not isinstance(graph['nodes'], list):
        print('ERROR: No nodes defined in process graph.')
        sys.exit(1)
    required_kinds = {'activity', 'decision', 'gate'}
    for node in graph['nodes']:
        if 'id' not in node or 'kind' not in node:
            print(f"ERROR: Node missing 'id' or 'kind': {node}")
            sys.exit(1)
        if node['kind'] not in required_kinds:
            print(f"ERROR: Invalid node kind: {node['kind']} in node {node['id']}")
            sys.exit(1)
    print('Process graph is valid.')
    sys.exit(0)

if __name__ == '__main__':
    main()
