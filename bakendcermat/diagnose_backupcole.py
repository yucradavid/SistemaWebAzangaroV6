from pathlib import Path
import re

path = Path('backupcole.sql')
text = path.read_text(encoding='utf-8', errors='replace')
lines = text.splitlines()
print('total_lines:', len(lines))
print('first_line:', repr(lines[0]) if lines else 'none')
print('count_COPY:', sum(1 for l in lines if 'COPY ' in l))
print('count_term:', sum(1 for l in lines if l.strip() == r'\.'))
print('count_psql:', sum(1 for l in lines if re.match(r'^\\(restrict|unrestrict|connect)(?:\s|$)', l)))
for idx, line in enumerate(lines[:50], 1):
    if 'COPY ' in line or line.strip() == r'\\.' or re.match(r'^\\(restrict|unrestrict|connect)(?:\s|$)', line):
        print('match at', idx, repr(line))

for idx, line in enumerate(lines[-50:], len(lines)-49):
    if 'COPY ' in line or line.strip() == r'\\.' or re.match(r'^\\(restrict|unrestrict|connect)(?:\s|$)', line):
        print('match at', idx, repr(line))
