// src/locales/en.js
export default {
  // ── General ──────────────────────────────────────
  'common.loading':       'Loading…',
  'common.error':         'Something went wrong. Please try again.',
  'common.retry':         'Retry',
  'common.logout':        'Log out',
  'common.complete':      'Complete',
  'common.pending':       'Pending',
  'common.days_until':    'in {n} days',
  'common.today':         'Today',
  'common.overdue':       'Overdue',

  // ── Login ────────────────────────────────────────
  'login.title':          'Project Progress',
  'login.subtitle':       'Enter your email and Hotel ID to receive a login link',
  'login.email':          'Email',
  'login.email_placeholder': 'your@email.com',
  'login.hotel_id':       'Hotel ID',
  'login.hotel_id_placeholder': 'Enter your Hotel ID',
  'login.submit':         'Send Login Link',
  'login.submitting':     'Sending…',
  'login.sent_title':     'Check your inbox',
  'login.sent_body':      'We sent a login link to {email}. The link expires in 15 minutes.',
  'login.sent_resend':    "Didn't receive it? Resend",
  'login.error_invalid':  'Email or Hotel ID is incorrect. Please check and try again.',
  'login.error_expired':  'Your login link has expired. Please request a new one.',
  'login.error_generic':  'Failed to send. Please try again later.',

  // ── Dashboard ────────────────────────────────────
  'dash.welcome':         'Welcome. Here is your project progress.',
  'dash.hotel_id':        'Hotel ID',
  'dash.progress':        'Overall Completion',
  'dash.batch1':          'Batch 1 Data',
  'dash.batch2':          'Batch 2 Data',
  'dash.tasks':           'Tasks',
  'dash.launch_date':     'Launch Date',
  'dash.batch1_deadline': 'Batch 1 Deadline',
  'dash.batch2_deadline': 'Batch 2 Deadline',
  'dash.no_tasks':        'No public tasks at this time',
  'dash.last_updated':    'Last updated: {date}',
  'dash.save_ok':         'Saved',
  'dash.save_fail':       'Save failed. Please refresh and try again.',
  'dash.conflict':        'Data was updated. Please refresh the page.',

  // ── Checklist sections ───────────────────────────
  'section.basic':        'Basic Setup',
  'section.faq':          'FAQ Sheet',
  'section.aca':          'ACA Setup',
  'section.batch2':       'Batch 2 Data',

  // ── Products ────────────────────────────────────
  'product.AVA':          'AVA Smart Assistant',
  'product.AVT':          'AVT Translation',
  'product.ACA':          'ACA Voice',
  'product.TMSP':         'TMS Pro',
  'product.GW':           'GuestWeb',
  'product.KMS':          'KMS',
};
