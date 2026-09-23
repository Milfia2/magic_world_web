# 魔法日常 · Magic World

依 FigJam 功能流程與 Figma 原型建立的互動初版。純 HTML、CSS 與原生 JavaScript，無執行階段套件、無後端；可部署在 GitHub Pages 的 repository 子路徑。

設計參考：[功能流程](https://www.figma.com/board/DaKM21HbMBiWT0WieZG0aI/FigJam-basics?node-id=0-1)、[互動原型](https://www.figma.com/proto/w51pm5Coy8ozbWGLjzil70/Untitled?node-id=13-690)。以原型的角色選擇、插畫場景與角色對話為基礎，新增一致的導覽與手機版排版。

## 本機預覽

安裝 Node.js 22 或以上；沒有 npm 套件需要安裝。

```sh
node scripts/serve.mjs
```

開啟 <http://127.0.0.1:4173>。請使用 HTTP 伺服器，避免直接雙擊 HTML 導致 ES modules 被瀏覽器阻擋。可用環境變數 `PORT` 改變埠號。

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
node scripts/build.mjs
node scripts/serve.mjs dist
```

最後一個指令預覽建置結果；先停止原本使用同一埠號的伺服器。

## GitHub Pages

1. 將專案（包含 `assets/`）提交到 GitHub repository 的 `main` 分支。
2. 在 repository 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
3. 推送 `main` 或手動執行 **Deploy Magic World to GitHub Pages** 工作流程。
4. 部署網址會出現在工作流程的 `github-pages` environment；專案型網址通常為 `https://帳號.github.io/repository名稱/`。

工作流程會檢查 JavaScript、圖片路徑、狀態規則，將公開檔案封裝至 `dist/` 後發布。PR 只建置、不部署。原始素材、腳本與文件不會放進部署產物。不需要 API key 或自行設定 secrets；Pages 使用工作流程的短期權限。流程依照 [GitHub Pages 官方文件](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 設定。

所有資源使用相對路徑；頁面使用 `#/library` 等 hash 路由，因此重新整理或分享地點網址不會產生 GitHub Pages 404。首次訪客打開探索地點時會先導向角色選擇。

## 功能對照

| 頁面 | 初版行為 |
| --- | --- |
| 角色選擇 | 四位角色、學院資料、可切換帶入角色 |
| 校園地圖／中庭 | 總地圖只有地點；中庭是一般互動場景 |
| 角色相遇 | 每三小時按角色偏好換地點，每人只有一個所在地；候選位置使用立繪，不出現玩家自身 |
| Q 版大廳 | 四角色聊天與位置重排；與探索進度分開 |
| 圖書館 | 三篇示範短篇、已讀收藏 |
| 教室／老師辦公室 | 可展開的世界設定、四位學生原始表格 |
| 天文臺 | 臺北／倫敦／愛丁堡即時天氣、三日高低溫、載入與重試狀態 |
| 宿舍 | 自己房間直接進入，其他人不會進來；拜訪其他房間需邀請，房內只可能遇到主人；小物與日記 |
| 球場 | 預設一般場景、可遇見有行程的角色；按鈕開始遊戲後四位騎行角色一起飛，支援上下左右與遠近縮放、金探子捕捉 |
| 森林 | 尋找並收藏四隻貓咪，解鎖變身 |
| 活米村 | 制服／Q 版／貓咪造型預覽，不改變一般場景立繪 |
| 共用 | 依裝置時間明暗切換、RWD、鍵盤操作、降低動畫偏好、原生 dialog |

## 檔案結構

```text
index.html                  網站入口
styles.css                  色彩、排版與響應式樣式
scene.css                   場景、立繪、物品與飛行介面
js/data.js                  角色、地點、故事、設定與素材命名
js/character-spawns.js       立繪候選位置、尺寸、角色地點偏好（美術調整入口）
js/schedule.js               三小時行程與場景居民
js/scene-layout.js           物品座標、背景投影、Q 版大廳散步
js/dialogue.js               依 Character Bible 編寫的情境與關係對話
js/flight.js                 騎行移動、景深、同伴飛行控制
js/state.js                 儲存格式、載入驗證與互動規則
js/app.js                   hash 路由、畫面與互動
js/agent-tools.js           可選 WebMCP 導覽／進度工具，無支援則略過
assets/                     網頁用 WebP 素材（需提交）
source/                     使用者提供的原始 PNG（保持原檔）
scripts/prepare-assets.py   原始素材轉 WebP、去除透明邊界
scripts/serve.mjs            本機 HTTP 預覽
scripts/check.mjs           語法與資源引用檢查
scripts/build.mjs           公開檔案封裝
tests/state.test.mjs        存檔、解鎖與贈禮規則測試
tests/scenes.test.mjs       場景投影、Q 版位置、飛行與角色對話測試
tests/schedule.test.mjs     行程時段、偏好、房間隱私、玩家排除測試
docs/scene-tuning.md        角色與物品座標調整說明
.github/workflows/pages.yml GitHub Pages 建置部署
```

## 素材與後續擴充

`source/` 的原始 PNG 保留原樣；網站目前使用 36 張、約 5.1 MiB 的 WebP，包含四張「騎行_去背_…」素材。人物依 alpha 邊界去除空白，以便卡片、對話與場景共用。未新增生成圖；現有素材已足夠支撐初版。

如需更新素材，先安裝 Pillow，再執行 `python scripts/prepare-assets.py`，並提交更新後的 `assets/`。此工具是選用的美術準備流程；正常建置與 GitHub Actions 不需要 Python。

角色命名以中文原始檔為準；`Amby`／`Abby` 對應艾比，`Gaile`／`Caleb` 對應蓋勒。集中映射於素材腳本與 `js/data.js`，方便後續統一。

角色姓名、生日、身高、學院與專長依照使用者提供的 Character Bible 更新；互動台詞是依照個性、四人既有關係編寫的情境草稿，故事仍是可替換的示範文案。學生名冊顯示已提供的資料，原始表格圖片仍保留空欄，不虛填年級與成績。尚未實作新增服裝圖層、帳號、多人同步、完整好感度系統、正式課程或付費功能。

調整立繪的大小與位置請編輯 `js/character-spawns.js`：`x/y` 是原圖百分比的腳底座標，`height` 是高度；`CHARACTER_SCALE` 可個別調整角色大小，`LOCATION_PREFERENCES` 控制地點偏好。物品位置在 `js/scene-layout.js`。完整說明見 [場景調整指南](docs/scene-tuning.md)。

行程依裝置當地日期與三小時時段固定抽取，每人只在一處；離開再進入不會重抽。00、03、06、09、12、15、18、21 時更新，同日相鄰時段不重複地點。夜間較容易回自己房間。對話與遊戲不會被時段更新中斷，結束後才更新一般場景。

`localStorage` 的 `magic-world:v1` 儲存進度；切換角色保留同一份探索／收藏／日記。不跨裝置同步，清除網站資料會失去紀錄；儲存不可用時仍可在當前頁面遊玩。資料載入會過濾未知 ID、錯誤格式與過長日記。日記以文字儲存與安全轉義顯示。

天氣使用 [Open-Meteo Forecast API](https://open-meteo.com/en/docs)，只送出選單預設城市座標，不取得裝置定位。API 不可用時顯示重試按鈕，不使用假天氣。網站字型使用 Google Fonts，離線會退回裝置襯線字型。場景依裝置當地時間 06:00–18:00 顯示日間，其餘顯示夜間色調；原圖本身的夕陽與燈光不重繪。

WebMCP 是可選增強：僅在 `document.modelContext` 支援時註冊進度讀取與地點導覽，讀取結果不含日記。已在本機預覽驗證地點導覽，普通瀏覽器的互動不依賴它。
