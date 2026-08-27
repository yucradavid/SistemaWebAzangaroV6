from pathlib import Path
import re

path = Path('backupcole.sql')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
out = []
in_copy = False
removed_blocks = 0
removed_lines = 0

for line in lines:
    if not in_copy and re.match(r'^COPY\s+.*\sFROM\s+stdin;$', line):
        in_copy = True
        removed_blocks += 1
        removed_lines += 1
        continue
    if in_copy:
        removed_lines += 1
        if line.strip() == r'\\.':
            in_copy = False
        continue
    if re.match(r'^\\(restrict|unrestrict|connect)(?:\s|$)', line):
        removed_blocks += 1
        removed_lines += 1
        continue
    out.append(line)

if out and not out[0].startswith('--'):
    first_comment = next((i for i, l in enumerate(out) if l.strip().startswith('--')), None)
    if first_comment is not None:
        out = out[first_comment:]
    else:
        out.insert(0, '-- cleaned SQL dump')

path.write_text('\n'.join(out) + '\n', encoding='utf-8')
print('removed_blocks:', removed_blocks)
print('removed_lines:', removed_lines)
print('first_line:', out[0] if out else '')
