// src/locales/ja.js
export default {
  // ── 通用 ────────────────────────────────────────
  'common.loading':       '読み込み中…',
  'common.error':         'エラーが発生しました。後でもう一度お試しください。',
  'common.retry':         '再試行',
  'common.logout':        'ログアウト',
  'common.complete':      '完了',
  'common.pending':       '未完了',
  'common.days_until':    '{n}日後',
  'common.today':         '本日',
  'common.overdue':       '期限超過',

  // ── ログインページ ────────────────────────────────
  'login.title':          'プロジェクト進捗管理',
  'login.subtitle':       'メールアドレスとホテルIDを入力してログインリンクを取得してください',
  'login.email':          'メールアドレス',
  'login.email_placeholder': 'your@email.com',
  'login.hotel_id':       'ホテルID',
  'login.hotel_id_placeholder': 'ホテルIDを入力',
  'login.submit':         'ログインリンクを送信',
  'login.submitting':     '送信中…',
  'login.sent_title':     'メールをご確認ください',
  'login.sent_body':      '{email} にログインリンクを送信しました。リンクは15分間有効です。',
  'login.sent_resend':    '届かない場合は再送信',
  'login.error_invalid':  'メールアドレスまたはホテルIDが正しくありません。確認してからお試しください。',
  'login.error_expired':  'ログインリンクの有効期限が切れました。再度お申し込みください。',
  'login.error_generic':  '送信に失敗しました。後でもう一度お試しください。',

  // ── ダッシュボード ────────────────────────────────
  'dash.welcome':         'プロジェクトの進捗状況をご確認ください',
  'dash.hotel_id':        'ホテルID',
  'dash.progress':        '全体の完了率',
  'dash.batch1':          '第1バッチデータ',
  'dash.batch2':          '第2バッチデータ',
  'dash.tasks':           'タスク',
  'dash.launch_date':     'ローンチ日',
  'dash.batch1_deadline': '第1バッチ締切',
  'dash.batch2_deadline': '第2バッチ締切',
  'dash.no_tasks':        '現在公開中のタスクはありません',
  'dash.last_updated':    '最終更新：{date}',
  'dash.save_ok':         '保存しました',
  'dash.save_fail':       '保存に失敗しました。ページを更新して再度お試しください。',
  'dash.conflict':        'データが更新されました。ページを更新してください。',

  // ── セクション ────────────────────────────────────
  'section.basic':        '基本設定シート',
  'section.faq':          'FAQシート',
  'section.aca':          'ACA設定',
  'section.batch2':       '第2バッチデータ',

  // ── 製品 ─────────────────────────────────────────
  'product.AVA':          'AVA スマートアシスタント',
  'product.AVT':          'AVT 翻訳',
  'product.ACA':          'ACA 音声',
  'product.TMSP':         'TMS Pro',
  'product.GW':           'GuestWeb',
  'product.KMS':          'KMS',
};
