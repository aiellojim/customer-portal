// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CUSTOMER_AUTH_URL } from '../lib/supabase.js';
import { useI18n, LOCALES } from '../lib/i18n.jsx';
import Ico from '../components/Ico.jsx';

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeUp 0.3s ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 11,
    color: 'var(--text-subtle)',
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-mid)',
    marginBottom: 28,
    lineHeight: 1.6,
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-mid)',
    marginBottom: 7,
  },
  inputWrap: { marginBottom: 16 },
  input: {
    width: '100%',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    transition: 'background 0.15s, transform 0.1s',
    boxShadow: '0 2px 8px rgba(232,98,26,0.35)',
  },
  btnDisabled: {
    background: 'var(--border)',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  error: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '10px 14px',
    background: 'var(--red-light)',
    border: '1px solid rgba(220,38,38,0.25)',
    borderRadius: 10,
    fontSize: 13,
    color: 'var(--red)',
    marginBottom: 16,
    lineHeight: 1.5,
  },
  sentBox: {
    textAlign: 'center',
    padding: '8px 0',
    animation: 'fadeIn 0.3s ease',
  },
  sentIcon: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'var(--green-light)',
    border: '2px solid var(--green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  sentTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 8,
  },
  sentBody: {
    fontSize: 13,
    color: 'var(--text-mid)',
    lineHeight: 1.7,
    marginBottom: 20,
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textDecoration: 'underline',
  },
  langBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 20,
  },
  langBtn: (active) => ({
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-subtle)',
    fontSize: 11,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.12s',
  }),
};

// ── Component ─────────────────────────────────────────────────
export default function Login() {
  const { t, locale, setLocale } = useI18n();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();

  const [email,    setEmail]    = useState('');
  const [hotelId,  setHotelId]  = useState('');
  const [status,   setStatus]   = useState(
    params.get('error') === 'invalid_link' ? 'expired' : 'idle'
  );
  // status: 'idle' | 'submitting' | 'sent' | 'error_invalid' | 'error_generic' | 'expired'

  const canSubmit = email.trim() && hotelId.trim() && status !== 'submitting';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');

    try {
      const res = await fetch(CUSTOMER_AUTH_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:    email.trim().toLowerCase(),
          hotel_id: hotelId.trim(),
        }),
      });

      if (res.status === 403) { setStatus('error_invalid'); return; }
      if (!res.ok)             { setStatus('error_generic'); return; }

      setStatus('sent');
    } catch {
      setStatus('error_generic');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const isError  = ['error_invalid', 'error_generic', 'expired'].includes(status);
  const errorKey = status === 'error_invalid' ? 'login.error_invalid'
                 : status === 'expired'       ? 'login.error_expired'
                 :                              'login.error_generic';

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Language switcher */}
        <div style={S.langBar}>
          {LOCALES.map(({ code, label }) => (
            <button key={code} style={S.langBtn(locale === code)} onClick={() => setLocale(code)}>
              {label}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <Ico name="building" size={20} color="#fff" />
          </div>
          <div>
            <div style={S.logoText}>Aiello</div>
            <div style={S.logoSub}>{t('login.title')}</div>
          </div>
        </div>

        {status === 'sent' ? (
          /* ── Sent state ── */
          <div style={S.sentBox}>
            <div style={S.sentIcon}>
              <Ico name="mail" size={22} color="var(--green)" />
            </div>
            <div style={S.sentTitle}>{t('login.sent_title')}</div>
            <div style={S.sentBody}>
              {t('login.sent_body', { email: email.trim() })}
            </div>
            <button style={S.resendBtn} onClick={() => setStatus('idle')}>
              {t('login.sent_resend')}
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div style={S.title}>{t('login.title')}</div>
            <div style={S.subtitle}>{t('login.subtitle')}</div>

            {isError && (
              <div style={S.error}>
                <Ico name="warning" size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                {t(errorKey)}
              </div>
            )}

            <div style={S.inputWrap}>
              <label style={S.label}>{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t('login.email_placeholder')}
                style={S.input}
                onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
                autoComplete="email"
              />
            </div>

            <div style={S.inputWrap}>
              <label style={S.label}>{t('login.hotel_id')}</label>
              <input
                type="text"
                value={hotelId}
                onChange={e => setHotelId(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t('login.hotel_id_placeholder')}
                style={S.input}
                onFocus={e  => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
                autoComplete="off"
                autoCapitalize="off"
              />
            </div>

            <button
              style={{ ...S.btn, ...(canSubmit ? {} : S.btnDisabled) }}
              onClick={handleSubmit}
              disabled={!canSubmit}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = 'var(--accent-dark)'; }}
              onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {status === 'submitting' ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  {t('login.submitting')}
                </>
              ) : (
                <>
                  <Ico name="send" size={14} color="#fff" />
                  {t('login.submit')}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
