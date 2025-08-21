# MaintAInPro check_gates.py
# Checks for required evidence at each gate in MaintAInPro CMMS
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
    gates = [n for n in graph['nodes'] if n['kind'] == 'gate']
    missing_evidence = []
    for gate in gates:
        if 'evidence' not in gate or not gate['evidence']:
            missing_evidence.append(gate['id'])
            continue
        for evidence in gate['evidence']:
            if not Path(evidence).exists():
                print(f"ERROR: Missing evidence for gate {gate['id']}: {evidence}")
                sys.exit(1)
    if missing_evidence:
        print(f"ERROR: Gates missing evidence: {missing_evidence}")
        sys.exit(1)
    print('All gate evidence present.')
    sys.exit(0)

if __name__ == '__main__':
    main()
