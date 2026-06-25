import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
de_path = root / "locales/de.json"
raw = de_path.read_text(encoding="utf-8-sig")
# Strip Shopify locale comment header
raw_json = re.sub(r"^/\*.*?\*/\s*", "", raw, count=1, flags=re.DOTALL)
de = json.loads(raw_json)
frag = json.loads((root / "scripts/pflege_faq_page.locale.json").read_text(encoding="utf-8"))
de.setdefault("sections", {})["pflege_faq_page"] = frag["pflege_faq_page"]

header = ""
if raw.lstrip().startswith("/*"):
    m = re.match(r"^/\*.*?\*/\s*", raw, re.DOTALL)
    if m:
        header = m.group(0)

de_path.write_text(
    header + json.dumps(de, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print("Merged pflege_faq_page into locales/de.json")
