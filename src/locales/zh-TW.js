// src/locales/zh-TW.js
export default {
  // ── 通用 ────────────────────────────────────────
  'common.loading':       '載入中…',
  'common.error':         '發生錯誤，請稍後再試',
  'common.retry':         '重新嘗試',
  'common.logout':        '登出',
  'common.complete':      '完成',
  'common.pending':       '待完成',
  'common.days_until':    '{n} 天後',
  'common.today':         '今天',
  'common.overdue':       '已逾期',

  // ── 登入頁 ──────────────────────────────────────
  'login.title':          '專案進度追蹤',
  'login.subtitle':       '請輸入您的 Email 及飯店 ID 以取得登入連結',
  'login.email':          'Email',
  'login.email_placeholder': 'your@email.com',
  'login.hotel_id':       '飯店 ID',
  'login.hotel_id_placeholder': '請輸入飯店 ID',
  'login.submit':         '發送登入連結',
  'login.submitting':     '發送中…',
  'login.sent_title':     '請檢查您的信箱',
  'login.sent_body':      '我們已將登入連結寄送至 {email}，連結將在 15 分鐘後失效。',
  'login.sent_resend':    '沒有收到？重新發送',
  'login.error_invalid':  'Email 或飯店 ID 不正確，請確認後再試。',
  'login.error_expired':  '登入連結已過期，請重新申請。',
  'login.error_generic':  '發送失敗，請稍後再試。',

  // ── Dashboard ────────────────────────────────────
  'dash.welcome':         '您好，歡迎查看專案進度',
  'dash.hotel_id':        '飯店 ID',
  'dash.progress':        '整體完成度',
  'dash.batch1':          '第一批資料',
  'dash.batch2':          '第二批資料',
  'dash.tasks':           '任務紀錄',
  'dash.launch_date':     '預計上線日期',
  'dash.batch1_deadline': '第一批資料期限',
  'dash.batch2_deadline': '第二批資料期限',
  'dash.no_tasks':        '目前無公開任務',
  'dash.last_updated':    '最後更新：{date}',
  'dash.save_ok':         '已儲存',
  'dash.save_fail':       '儲存失敗，請重新整理後再試',
  'dash.conflict':        '資料已被更新，請重新整理頁面',

  // ── Checklist sections ───────────────────────────
  'section.basic':        '基礎設定資料表',
  'section.faq':          'FAQ 資料表',
  'section.aca':          'ACA 設定',
  'section.batch2':       '第二批資料',

  // ── Products ────────────────────────────────────
  'product.AVA':          'AVA 智慧助理',
  'product.AVT':          'AVT 翻譯',
  'product.ACA':          'ACA 語音',
  'product.TMSP':         'TMS Pro',
  'product.GW':           'GuestWeb',
  'product.KMS':          'KMS',
};
