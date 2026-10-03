import json

with open("public/questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

html = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<title>字音字形 400 題題庫校對表</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; }
h1 { text-align: center; color: #2c3e50; }
.tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
.tab-btn { padding: 10px 20px; font-size: 16px; border: none; border-radius: 8px; cursor: pointer; background: #e0e0e0; font-weight: bold; }
.tab-btn.active { background: #3498db; color: white; }
.section { display: none; }
.section.active { display: block; }
.band-img { width: 100%; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 12px; }
table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 30px; }
th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f8f9fa; color: #555; }
.target-char { color: #e74c3c; font-weight: bold; font-size: 18px; }
.zhuyin { color: #2980b9; font-weight: bold; font-size: 16px; }
</style>
</head>
<body>
<h1>字音字形 400 題完整題庫校對總表</h1>
<div class="tabs">
  <button class="tab-btn active" onclick="showTab('114-sound')">114 字音 (100題)</button>
  <button class="tab-btn" onclick="showTab('114-form')">114 字形 (100題)</button>
  <button class="tab-btn" onclick="showTab('113-sound')">113 字音 (100題)</button>
  <button class="tab-btn" onclick="showTab('113-form')">113 字形 (100題)</button>
</div>
"""

groups = {
    "114-sound": [q for q in questions if q["year"] == 114 and q["type"] == "sound"],
    "114-form": [q for q in questions if q["year"] == 114 and q["type"] == "form"],
    "113-sound": [q for q in questions if q["year"] == 113 and q["type"] == "sound"],
    "113-form": [q for q in questions if q["year"] == 113 and q["type"] == "form"],
}

img_dir_map = {
    "114-sound": "source-crops/114_sound",
    "114-form": "source-crops/114_form",
    "113-sound": "source-crops/113_sound",
    "113-form": "source-crops/113_form",
}

for group_id, q_list in groups.items():
    active_cls = "active" if group_id == "114-sound" else ""
    html += f'<div id="{group_id}" class="section {active_cls}">'
    for band_idx in range(4):
        start_no = band_idx * 25 + 1
        end_no = (band_idx + 1) * 25
        band_qs = [q for q in q_list if start_no <= q["no"] <= end_no]
        img_src = f"{img_dir_map[group_id]}/band_{band_idx+1}.jpg"
        html += f'<h3>第 {band_idx+1} 列 (題號 {start_no} - {end_no})</h3>'
        html += f'<img src="{img_src}" class="band-img" alt="原題截圖"/>'
        html += """<table>
        <thead><tr><th>題號</th><th>題型</th><th>語詞 (目標字)</th><th>考查字</th><th>注音</th><th>標籤</th></tr></thead>
        <tbody>"""
        for q in band_qs:
            ctx = list(q["context"])
            ctx[q["target"]] = f'<span class="target-char">{ctx[q["target"]]}</span>'
            ctx_display = "".join(ctx)
            html += f'<tr><td>{q["no"]}</td><td>{q["type"]}</td><td>{ctx_display}</td><td class="target-char">{q["char"]}</td><td class="zhuyin">{q["zhuyin"]}</td><td>{q["tags"]}</td></tr>'
        html += '</tbody></table>'
    html += '</div>'

html += """
<script>
function showTab(tabId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}
</script>
</body>
</html>
"""

with open("data/proof.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Saved data/proof.html")
