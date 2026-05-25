// src/pages/Dashboard.jsx
// Phase 2: PKCE callback + session guard + 基本 layout
// Phase 3: 拉資料、渲染 checklist、任務

import { useEffect, useState } from 'react';
import { useNavigate }          from 'react-router-dom';
import { supabase }             from '../lib/supabase.js';
import { useI18n, LOCALES }    from '../lib/i18n.jsx';
import Ico                      from '../components/Ico.jsx';

export default function Dashboard() {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('init');
  // phase: 'init' | 'ready' | 'error'

  // ── PKCE callback + session guard ─────────────────────────
  useEffect(() => {
    const init = async () => {
      const code = new URLSearchParams(window.location.search).get('code');

      // 如果 URL 帶有 code，先 exchange
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          navigate('/login?error=invalid_link');
          return;
        }
        // 清掉 URL 中的 code，保持 /dashboard 乾淨
        window.history.replaceState({}, '', '/dashboard');
      }

      // 確認 session 存在
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setPhase('ready');
    };

    init();
  }, [navigate]);

  // ── 登出 ───────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // ── Loading ────────────────────────────────────────────────
  if (phase === 'init') {
    return (
      <div style={S.loadingPage}>
        <div style={S.spinner} />
        <div style={S.loadingText}>{t('common.loading')}</div>
      </div>
    );
  }

  // ── Main layout（Phase 3 在此填入內容） ────────────────────
  return (
    <div style={S.page}>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          {/* Logo */}
          <div style={S.logo}>
            <div style={S.logoIcon}>
              <Ico name="building" size={16} color="#fff" />
            </div>
            <span style={S.logoText}>Aiello</span>
          </div>

          {/* Right: lang + logout */}
          <div style={S.headerRight}>
            {/* Language switcher */}
            <div style={S.langBar}>
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  style={S.langBtn(locale === code)}
                  onClick={() => setLocale(code)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              style={S.logoutBtn}
              onClick={handleLogout}
              title={t('common.logout')}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-subtle)'; }}
            >
              <Ico name="logout" size={15} color="currentColor" />
              <span style={{ fontSize: 13 }}>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content — Phase 3 在此渲染 */}
      <main style={S.main}>
        {/* placeholder — Phase 3 replace */}
        <div style={S.placeholder}>
          <Ico name="clipboardList" size={36} color="var(--border-mid)" />
          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-subtle)' }}>
            Phase 3 — 資料載入中
          </div>
        </div>
      </main>

    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    fontFamily: "'Noto Sans TC', 'Segoe UI', sans-serif",
  },
  header: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '0 24px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    flexShrink: 0,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  langBar: {
    display: 'flex',
    gap: 3,
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
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-subtle)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.12s',
  },
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '32px 24px 80px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: 'var(--text-subtle)',
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    background: 'var(--bg)',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '2.5px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  loadingText: {
    fontSize: 13,
    color: 'var(--text-subtle)',
  },
};
