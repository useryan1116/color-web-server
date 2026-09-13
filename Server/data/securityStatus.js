module.exports = Object.freeze({
  checkedAt: '2026-09-13T11:46:57.800Z',
  scope: ['伺服器路由、驗證與檔案界線', '管理員與會員帳號流程', '圖片上傳與 PDF 服務', 'npm 完整依賴樹與官方弱點公告'],
  detection: { status: 'unknown', summary: '目前未接入可驗證的 WAF、SIEM 或安全事件紀錄，因此不能判定網站是否曾遭攻擊。' },
  dependencyAudit: { before: { high: 2, moderate: 3, total: 5 }, after: { high: 0, moderate: 0, total: 0 }, status: 'resolved' },
  risks: [
    { severity: 'high', status: 'resolved', title: '公開檔案路徑界線', summary: '已移除多餘動態檔案路由，合法頁面仍由受限靜態目錄提供。' },
    { severity: 'medium', status: 'resolved', title: '預設管理員帳號', summary: '建立工具改為單一環境變數帳號，禁止內建帳密與覆寫既有帳號。' },
    { severity: 'medium', status: 'resolved', title: 'PDF 伺服器轉圖資源耗用', summary: '已移除新版前端未使用的公開伺服器轉圖端點。' },
    { severity: 'low', status: 'resolved', title: '註冊信箱探測', summary: '已移除公開查詢端點，註冊回應不再透露帳號是否存在。' },
    { severity: 'low', status: 'resolved', title: '正式環境 JWT 密鑰', summary: '正式環境缺少足夠長度密鑰時會停止啟動。' },
    { severity: 'medium', status: 'resolved', title: '依賴與圖片上傳', summary: '已更新公告涉及套件，並限制圖片格式、數量、欄位與 10MB 大小。' }
  ],
  todos: ['每週重新檢查完整依賴樹與官方公告。', '若要判斷實際攻擊事件，需另接入 Render／WAF 日誌或 SIEM；在此之前維持未知。'],
  note: '本頁是可稽核的安全查核摘要，不是即時防毒或入侵偵測器。'
});
