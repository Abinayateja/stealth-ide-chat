import re

with open("input.txt", "r", encoding="utf-8") as f:
    data = f.readlines()

cleaned = []
for line in data:
    if not re.search(r'(?i)ans|answer', line):
        cleaned.append(line)

with open("output.txt", "w", encoding="utf-8") as f:
    f.writelines(cleaned)