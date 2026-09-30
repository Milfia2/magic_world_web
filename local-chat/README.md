# 本機角色自由對話

專用環境：`.local-llm/` 儲存 Ollama 可攜版、Qwen3 4B、設定與執行紀錄。Node.js 22+ 後端使用內建模組，無 npm 或 Python 套件依賴；不修改全域 Ollama 設定。

Ollama 首次執行另會在 Windows 使用者目錄建立 `.ollama` 本機金鑰；模型與本專案設定仍留在 `.local-llm/`。

## 安裝與啟動（PowerShell 7）

```powershell
pwsh -NoProfile -File scripts/install-local-llm.ps1
pwsh -NoProfile -File scripts/start-local-chat.ps1
node scripts/pull-local-model.mjs
node scripts/serve.mjs
```

在網站「對話連線」填 `http://127.0.0.1:8787` 和 `.local-llm/config.json` 的 `password`，再選角色、點其他人物，於對話泡泡下方輸入。初次模型載入較久。同時間只進行一個推理請求，其他人會收到稍後再試提示。

執行檔約 1.5 GB，模型約數 GB；下載後日常啟動只需要 `start-local-chat.ps1`。模型埠為 11435，對話 API 埠為 8787，均只監聽本機。

## 固定 HTTPS 網址

尚未設定網域時可先完成本機對話。遠端訪客的 `localhost` 指向訪客自己的電腦，GitHub Pages 必須填固定公開 HTTPS API 網址才能使用你的模型。

1. 使用你可管理的 Cloudflare 網域，在 Cloudflare Zero Trust 建立 named tunnel。
2. 新增公開應用程式路由，例如 `chat.example.com`，服務設定為 `http://127.0.0.1:8787`。不要把 Ollama 11435 或預覽伺服器 4173 對外發布。
3. 將 Tunnel token 儲存在本機 `.local-llm/tunnel-token.txt`（只有 token 本身，不要整段安裝指令）。
4. 執行 `pwsh -NoProfile -File scripts/start-local-chat.ps1 -Tunnel`。
5. 把 `js/chat-config.js` 的 `CHAT_API_URL` 設為該 HTTPS 網址並重新部署 Pages；也能在網站「對話連線」手動填網址。
6. `.local-llm/config.json` 的 `allowedOrigins` 預設包含 `https://milfia2.github.io`，若換網站網域需加入正確 origin（沒有路徑）。修改後停止再啟動後端。
7. 將 `password` 私下交給受邀使用者；不要放進前端程式、Git 或 Tunnel token 檔。

固定公開入口須在網域設定完成後才能驗證。此專案不會自動購買網域或部署 GitHub Pages。

目前前端預設使用你提供的臨時入口 `https://counted-citizenship-refused-dental.trycloudflare.com`。這不是固定網域；原本的 quick tunnel 停止或重建後可能失效，需更新 `js/chat-config.js`。已有瀏覽器分頁保存的連線網址不會被新預設覆蓋，請在「對話連線」重新填寫。

可用 `node scripts/test-local-chat.mjs` 測本機；指定你自己的 API 網址作為第一個參數可測 HTTPS。測試使用獨立的暫存記憶，不碰瀏覽器存檔，從本機設定讀密碼，不輸出密碼。

## 記憶、身分與重置

`llm_set/` 是本機後端專用文檔（世界觀、角色、關係與範例），已加入 `.gitignore`。前端不下載這些檔案，預覽伺服器拒絕提供，Pages 建置也不複製它們。請自行備份此資料夾；新機部署後端時需另外複製。若曾經手動提交到公開 Git，忽略設定不會移除歷史版本。本專案保留原本公開的固定台詞與學生名冊，完整 LLM 設定則只留本機。

- 瀏覽器 `localStorage` 的 `magic-world:chat-memory:v1` 按玩家角色與 NPC 配對保存最多 10 則訊息、懷疑程度與重置狀態。相同網站的分頁共用，重新整理、關閉再開與後端重啟不會刪除。不同瀏覽器、裝置、localhost/127.0.0.1 或 Pages 網址之間不互通。
- 每次只讀取共通世界觀、發言者 short prompt、該對人物的關係。玩家的口吻只以精簡印象提示比對；不載入整本日記或其他角色完整設定。
- 模型依性格判斷 `none / mild / strong`，後端維護 0～3 的疑慮。一般情緒變化不應直接判成冒充；語言模型仍可能誤判，需透過實際角色互動調整。
- 網站「重置紀錄」立即清空此瀏覽器網站儲存中的所有角色對話與疑慮，離線也有效。只保留遺忘標記，使各配對下次交談時短暫覺得忘了什麼。同頁及其他分頁的舊回覆不能將重置前記憶寫回。
- 密碼與網址仍放 `sessionStorage` 的 `magic-world:chat`，不寫入持久對話記憶。關閉分頁後可能需要重新連線，但記憶仍在。
- 後端不再保存對話 session；每次請求會暫時接收該配對的近期記憶交給本機模型，回覆後不保存為歷史，也不寫入日記或日誌。角色文檔仍只在後端。舊版 RAM 記憶不自動遷移。
- 清除網站資料會刪除記憶；私密瀏覽通常在關閉時清除資料。儲存不可用時介面會提示；對話記憶沒有加密，使用該瀏覽器的人可查看。前端記憶可被玩家修改，因此疑慮是單機玩法狀態，不是防作弊或身分驗證機制。

## 停止

```powershell
pwsh -NoProfile -File scripts/stop-local-chat.ps1
```

停機期間遠端自由對話會無法連線；既有地圖、物品與固定台詞仍可使用。

官方參考：[Ollama Windows](https://docs.ollama.com/windows)、[Chat API](https://docs.ollama.com/api/chat)、[Cloudflare 固定 Tunnel 設定](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)。
