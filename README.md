# 英文句型快速選 · CEFR Sentence Pattern Context

一個單頁 Web 工具，把 A1–C2 共 **3,902** 句英文句型做成可**即時搜尋 + 分級篩選**的檢索介面。點選句型即可複製。

## 功能
- **分級篩選**：頂部 6 張級別封面圖（A1 入門 / A2 基礎 / B1 中級 / B2 中高級 / C1 高級 / C2 精通），可多選。
- **即時搜尋**：輸入英文關鍵字即時過濾，命中字串會高亮標記。
- **一鍵複製**：點任一句型即複製到剪貼簿（含離線備援）。
- **結果分頁**：每頁 200 筆，可「載入更多」。

## 目錄結構
```
index.html        介面與樣式
app.js            搜尋 / 篩選 / 複製邏輯
data.js           由原始資料產生的句型資料（AUTO-GENERATED）
assets/           6 張級別封面圖
source-data/      原始 Markdown 句型檔（英文句型_*.md）
parse_data.py     將 source-data 重新產生 data.js 的腳本
```

## 本地預覽
```bash
# 在 app/ 目錄下啟動靜態伺服器
python3 -m http.server 8000
# 瀏覽 http://localhost:8000
```

## 重新產生資料
若修改了 `source-data/` 裡的 Markdown，執行：
```bash
python3 parse_data.py
```
會重新輸出 `data.js`（覆寫）。

## 部署
- **Vercel**：`vercel deploy --prod`（靜態站，根目錄即 `index.html`）。
- 也可直接把本 repo 連接到 Vercel / GitHub Pages / 任何靜態托管。

## 資料說明
句型來源為「英文句型練習（A1–C2）」系列。原始資料中少數句子存在拼接瑕疵（兩句連在一起缺空格），屬來源資料問題；如需清理可調整 `parse_data.py` 後重新產生。
