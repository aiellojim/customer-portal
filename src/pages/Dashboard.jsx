// src/pages/Dashboard.jsx
// Phase 3: 資料載入 + checklist 互動 + 任務顯示

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate }       from 'react-router-dom';
import { supabase, CUSTOMER_CHECK_URL } from '../lib/supabase.js';

import { useI18n, LOCALES } from '../lib/i18n.jsx';
import Ico                  from '../components/Ico.jsx';

// ── Constants（與內部儀表保持一致）────────────────────────────
const BASIC_ITEMS = [
  '房型及機台擺放位置圖片','需申請後台權限的 email 帳號',
  '樓層房號表及 WiFi 資訊','機台重啟（Check out）方式',
  '是否需開啟打掃 & 勿擾功能','通話快捷鍵設定 & 分機提供',
  '歡迎畫面背景','歡迎詞填寫',
  '後台服務功能設定 & 送物 / 修繕項目清單','TMS Pro 設定',
];
const FAQ_TV_ITEM  = '電視頻道設定（若串接項目不含 IPTV 則不用填寫）';
const FAQ_ITEMS    = ['飯店基本資訊','飯店內設施','飯店提供之服務','入住規則','備品清單',FAQ_TV_ITEM,'特別推薦美食景點'];
const ACA_ITEM     = '轉接情境與歡迎詞設定';
const BATCH2_ITEMS = ['機台 Showcase 設定','廣告設定','Pop-up QR code 內容設定'];
const GW_ITEM      = 'GuestWeb 內容建置';

const PRODUCT_COLORS = {
  AVA:'var(--prod-ava)', AVT:'var(--prod-avt)', ACA:'var(--prod-aca)',
  TMSP:'var(--prod-tmsp)', GW:'var(--prod-gw)', KMS:'var(--prod-kms)',
};

// ── ThemeToggle ───────────────────────────────────────────────
const THEME_OPTIONS = [
  { value:'light',  label:'普通', icoName:'sun'     },
  { value:'dark',   label:'深色', icoName:'moon'    },
  { value:'system', label:'系統', icoName:'monitor' },
];
const ThemeToggle = ({ theme, setTheme }) => (
  <div style={{ display:'flex', alignItems:'center', background:'var(--surface-raised)',
    border:'1px solid var(--border)', borderRadius:9, padding:3, gap:2, height:32 }}>
    {THEME_OPTIONS.map(({ value, label, icoName }) => {
      const active = theme === value;
      return (
        <button key={value} onClick={() => setTheme(value)} title={label}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'0 9px',
            height:24, borderRadius:6, border:'none', fontFamily:'inherit', cursor:'pointer',
            background:active?'var(--surface)':'transparent',
            color:active?'var(--text)':'var(--text-subtle)',
            fontSize:11, fontWeight:active?600:400,
            boxShadow:active?'var(--shadow-sm)':'none', transition:'all 0.12s' }}>
          <Ico name={icoName} size={12} color="currentColor"/>
          <span>{label}</span>
        </button>
      );
    })}
  </div>
);

const getFlags = (products=[], integrations=[]) => ({
  hasAva:  products.includes('AVA'),
  hasAvt:  products.includes('AVT'),
  hasAca:  products.includes('ACA'),
  hasGw:   products.includes('GW'),
  hasIptv: integrations.includes('IPTV'),
});

const daysUntil = (d) => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;

// ── Sub-components ─────────────────────────────────────────────
const Ring = ({ pct, size=80, stroke=7, color }) => {
  const r=((size-stroke)/2), circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 0.7s cubic-bezier(.4,2,.6,1)' }}/>
    </svg>
  );
};

const DaysChip = ({ date, t }) => {
  if (!date) return <span style={{ color:'var(--text-subtle)', fontSize:12 }}>—</span>;
  const d = daysUntil(date);
  const color = d===null?'var(--text-subtle)':d<0?'var(--red)':d<=7?'var(--amber)':'var(--green)';
  const label = d===null?'—':d<0?t('common.overdue'):d===0?t('common.today'):t('common.days_until',{n:d});
  return (
    <span style={{ fontSize:11, fontWeight:600, color, background:`${color}18`,
      borderRadius:6, padding:'2px 8px', fontFamily:'DM Mono, monospace' }}>
      {label}
    </span>
  );
};

const CheckRow = ({ label, checked, onToggle, saving }) => (
  <div onClick={saving ? undefined : onToggle} style={{
    display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10,
    cursor:saving?'wait':'pointer', marginBottom:6, transition:'all 0.15s', opacity:saving?0.6:1,
    background:checked?'var(--green-light)':'var(--surface-raised)',
    border:`1.5px solid ${checked?'rgba(5,150,105,0.3)':'var(--border)'}`,
  }}>
    <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, transition:'all 0.15s',
      border:`2px solid ${checked?'var(--green)':'var(--border-mid)'}`,
      background:checked?'var(--green)':'var(--surface)',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      {checked && <Ico name="check" size={11} color="#fff" strokeWidth={2.5}/>}
    </div>
    <span style={{ fontSize:13, color:checked?'var(--text)':'var(--text-mid)', flex:1, lineHeight:1.4 }}>
      {label}
    </span>
    {saving
      ? <div style={{ width:14, height:14, border:'2px solid var(--border-mid)',
          borderTopColor:'var(--accent)', borderRadius:'50%', flexShrink:0,
          animation:'spin 0.7s linear infinite' }}/>
      : !checked && <span style={{ fontSize:10, color:'var(--text-subtle)',
          fontWeight:600, letterSpacing:'0.05em', flexShrink:0 }}>待提供</span>
    }
  </div>
);

const SectionHeader = ({ title, checked, total, color }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color }}>
      {title}
    </div>
    <div style={{ fontSize:12, fontFamily:'DM Mono, monospace', color,
      background:`${color}15`, border:`1px solid ${color}33`, borderRadius:8, padding:'3px 12px' }}>
      {checked}/{total}
    </div>
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16,
    padding:'20px 22px', marginBottom:16, boxShadow:'var(--shadow-sm)', ...style }}>
    {children}
  </div>
);

// ── Main ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { t, locale, setLocale, fmtDate } = useI18n();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [theme, setTheme] = useState(() => localStorage.getItem('cp-theme') || 'system');
  useEffect(() => {
    localStorage.setItem('cp-theme', theme);
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [phase,      setPhase]      = useState('init');
  const [project,    setProject]    = useState(null);
  const [progress,   setProgress]   = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [toast,      setToast]      = useState(null);
  const [savingKeys, setSavingKeys] = useState(new Set());
  const sessionRef   = useRef(null);
  const updatedAtRef = useRef(null);
  const toastTimer   = useRef(null);

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // ── hotel_id 優先從 URL 參數讀取（Magic Link 帶入）────────
      const searchParams = new URLSearchParams(window.location.search);
      const hotelIdFromUrl = searchParams.get('hotel_id');
      if (hotelIdFromUrl) sessionStorage.setItem('cp-hotel-id', hotelIdFromUrl);

      // ── PKCE exchange ────────────────────────────────────────
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) { navigate('/login?error=invalid_link'); return; }
        window.history.replaceState({}, '', '/dashboard');
      }

      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      sessionRef.current = session;

      try {
        // ── hotel_id 決定邏輯 ────────────────────────────────────
        // 1. 優先用 sessionStorage 的值（Login 輸入 / Magic Link URL 帶入）
        // 2. 驗證這個 email 確實有該 hotel_id 的權限（安全檢查）
        // 3. 若驗證失敗或沒有 sessionStorage，fallback 到 customer_access 第一筆
        const storedHotelId = sessionStorage.getItem('cp-hotel-id');
        let hotelId = null;

        if (storedHotelId) {
          const { data: verifyRows } = await supabase
            .from('customer_access').select('hotel_id')
            .eq('email', session.user.email)
            .eq('hotel_id', storedHotelId)
            .limit(1);
          if (verifyRows?.[0]) hotelId = storedHotelId;
        }

        if (!hotelId) {
          // Fallback：取這個 email 的第一筆授權
          const { data: fallbackRows } = await supabase
            .from('customer_access').select('hotel_id')
            .eq('email', session.user.email)
            .limit(1);
          hotelId = fallbackRows?.[0]?.hotel_id ?? null;
        }

        if (!hotelId) { setPhase('no_project'); return; }

        const { data:proj } = await supabase
          .from('projects').select('*')
          .eq('hotel_id', hotelId).maybeSingle();
        if (!proj) { setPhase('no_project'); return; }

        const { data:prog } = await supabase
          .from('project_progress').select('*')
          .eq('project_id', proj.id).maybeSingle();
        updatedAtRef.current = prog?.updated_at ?? null;

        const { data:taskRows } = await supabase
          .from('tasks').select('*')
          .eq('project_id', proj.id).eq('is_internal', false)
          .order('created_at', { ascending:true });

        setProject(proj);
        setProgress({ basic_checked:prog?.basic_checked??{}, faq_checked:prog?.faq_checked??{}, batch2_checked:prog?.batch2_checked??{}, sheet_links:prog?.sheet_links??{} });
        setTasks(taskRows ?? []);
        setPhase('ready');
      } catch(e) {
        console.error(e);
        setPhase('error');
      }
    })();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const showToast = useCallback((msg, ok=true) => {
    setToast({ msg, ok });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Toggle ────────────────────────────────────────────────
  const handleToggle = useCallback(async (section, itemKey, field) => {
    const saveKey = `${section}:${itemKey}`;
    if (savingKeys.has(saveKey)) return;
    const currentVal = progress[field]?.[itemKey] ?? false;
    const newVal = !currentVal;
    setProgress(prev => ({ ...prev, [field]:{ ...prev[field], [itemKey]:newVal } }));
    setSavingKeys(prev => new Set([...prev, saveKey]));
    try {
      const res = await fetch(CUSTOMER_CHECK_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${sessionRef.current.access_token}` },
        body: JSON.stringify({ project_id:project.id, item_key:itemKey, section, checked:newVal, client_updated_at:updatedAtRef.current }),
      });
      if (res.status===409) {
        setProgress(prev => ({ ...prev, [field]:{ ...prev[field], [itemKey]:currentVal } }));
        showToast(t('dash.conflict'), false);
      } else if (!res.ok) {
        setProgress(prev => ({ ...prev, [field]:{ ...prev[field], [itemKey]:currentVal } }));
        showToast(t('dash.save_fail'), false);
      } else {
        showToast(t('dash.save_ok'), true);
        const { data:prog } = await supabase.from('project_progress').select('updated_at').eq('project_id', project.id).maybeSingle();
        if (prog) updatedAtRef.current = prog.updated_at;
      }
    } catch {
      setProgress(prev => ({ ...prev, [field]:{ ...prev[field], [itemKey]:currentVal } }));
      showToast(t('dash.save_fail'), false);
    } finally {
      setSavingKeys(prev => { const n=new Set(prev); n.delete(saveKey); return n; });
    }
  }, [project, progress, savingKeys, t, showToast]);

  // ── Derived ───────────────────────────────────────────────
  const { hasAva, hasAvt, hasAca, hasGw, hasIptv } = useMemo(
    () => project ? getFlags(project.products??[], project.integrations??[]) : getFlags(),
    [project]
  );
  const activeFaq = useMemo(() => FAQ_ITEMS.filter(k => k!==FAQ_TV_ITEM||hasIptv), [hasIptv]);
  const counts = useMemo(() => {
    if (!progress) return { basic:0, aca:0, faq:0, batch2:0, gw:0 };
    const bc=progress.basic_checked??{}, fc=progress.faq_checked??{}, b2=progress.batch2_checked??{};
    return {
      basic:  BASIC_ITEMS.filter(k=>bc[k]).length,
      aca:    bc[ACA_ITEM]?1:0,
      faq:    activeFaq.filter(k=>fc[k]).length,
      batch2: BATCH2_ITEMS.filter(k=>b2[k]).length,
      gw:     b2[GW_ITEM]?1:0,
    };
  }, [progress, activeFaq]);

  const pct = useMemo(() => {
    if (!project||!progress) return 0;
    const done=(hasAva?counts.basic:0)+(hasAca?counts.aca:0)+(hasAva?counts.faq:0)+(hasAva?counts.batch2:0)+(hasGw?counts.gw:0);
    const total=(hasAva?BASIC_ITEMS.length:0)+(hasAca?1:0)+(hasAva?activeFaq.length:0)+(hasAva?BATCH2_ITEMS.length:0)+(hasGw?1:0);
    return total===0?0:Math.round((done/total)*100);
  }, [project, progress, counts, hasAva, hasAca, hasGw, activeFaq]);

  // ── States ────────────────────────────────────────────────
  if (phase==='init') return (
    <div style={S.center}>
      <div style={S.spinner}/><div style={{ fontSize:13, color:'var(--text-subtle)' }}>{t('common.loading')}</div>

    </div>
  );
  if (phase==='error') return (
    <div style={S.center}>
      <Ico name="warning" size={32} color="var(--red)"/>
      <div style={{ fontSize:14, color:'var(--text-mid)', marginTop:12 }}>{t('common.error')}</div>
      <button style={S.retryBtn} onClick={() => window.location.reload()}>
        <Ico name="refresh" size={13} color="currentColor"/> {t('common.retry')}
      </button>
    </div>
  );
  if (phase==='no_project') return (
    <div style={S.center}>
      <Ico name="building" size={36} color="var(--border-mid)"/>
      <div style={{ fontSize:13, color:'var(--text-subtle)', marginTop:12 }}>尚未有可顯示的專案資料</div>
    </div>
  );

  const ringColor = pct===100?'var(--green)':'var(--accent)';

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:"'Noto Sans TC', sans-serif" }}>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <div style={S.logoIcon}><Ico name="building" size={15} color="#fff"/></div>
            <span style={S.logoText}>Aiello</span>
            {project?.name && <>
              <span style={{ color:'var(--border-mid)', fontSize:14 }}>／</span>
              <span style={{ fontSize:13, color:'var(--text-mid)', fontWeight:500,
                maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {project.name}
              </span>
            </>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:isMobile?5:8 }}>
            {!isMobile && <ThemeToggle theme={theme} setTheme={setTheme}/>}
            <div style={{ display:'flex', gap:3 }}>
              {LOCALES.map(({ code, label }) => (
                <button key={code} style={S.langBtn(locale===code)} onClick={() => setLocale(code)}>{label}</button>
              ))}
            </div>
            <button style={S.logoutBtn} onClick={handleLogout}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--red)'; e.currentTarget.style.color='var(--red)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-subtle)'; }}>
              <Ico name="logout" size={13} color="currentColor"/>
              {!isMobile && <span style={{ fontSize:12 }}>{t('common.logout')}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, background:toast.ok?'var(--green)':'var(--red)' }}>
          <Ico name={toast.ok?'check':'warning'} size={13} color="#fff"/>
          {toast.msg}
        </div>
      )}

      {/* Content */}
      <main style={{ maxWidth:760, margin:'0 auto', padding:isMobile?'20px 14px 60px':'28px 20px 80px' }}>

        {/* Overview */}
        <Card style={{ animation:'fadeUp 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Ring pct={pct} size={78} stroke={7} color={ringColor}/>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:14, fontWeight:700, color:ringColor,
                fontFamily:'DM Mono, monospace' }}>{pct}%</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:5,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{project?.name}</div>
              <div style={{ fontSize:11, color:'var(--text-subtle)', marginBottom:10,
                fontFamily:'DM Mono, monospace' }}>{t('dash.hotel_id')}：{project?.hotel_id}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(project?.products??[]).map(p => (
                  <span key={p} style={{ fontSize:11, fontWeight:700, color:'#fff',
                    background:PRODUCT_COLORS[p]??'var(--accent)', borderRadius:6, padding:'2px 9px' }}>{p}</span>
                ))}
              </div>
              {/* PIC + Address */}
              {(project?.pic||project?.address) && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:9 }}>
                  {project?.pic && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-mid)' }}>
                    <Ico name="user" size={12} color="var(--text-subtle)"/>{project.pic}
                  </div>}
                  {project?.address && <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-mid)' }}>
                    <Ico name="pin" size={12} color="var(--text-subtle)"/>{project.address}
                  </div>}
                </div>
              )}
              {/* Integrations */}
              {(project?.integrations??[]).length>0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:7 }}>
                  {project.integrations.map(intg => (
                    <span key={intg} style={{ fontSize:11, fontWeight:500, color:'var(--text-mid)',
                      background:'var(--surface-raised)', border:'1px solid var(--border)',
                      borderRadius:6, padding:'2px 9px' }}>{intg}</span>
                  ))}
                </div>
              )}
              {/* AVA 台數 */}
              {hasAva && (project?.ava_units||project?.ava_spare) && (
                <div style={{ display:'flex', gap:12, marginTop:7 }}>
                  {project?.ava_units && <div style={{ fontSize:11, color:'var(--text-subtle)' }}>
                    裝機 <span style={{ fontFamily:'DM Mono, monospace', fontWeight:600, color:'var(--prod-ava)' }}>{project.ava_units}</span> 台
                  </div>}
                  {project?.ava_spare && <div style={{ fontSize:11, color:'var(--text-subtle)' }}>
                    備品 <span style={{ fontFamily:'DM Mono, monospace', fontWeight:600, color:'var(--prod-ava)' }}>{project.ava_spare}</span> 台
                  </div>}
                </div>
              )}
              {/* AVT 台數 */}
              {hasAvt && project?.avt_units && (
                <div style={{ display:'flex', gap:12, marginTop:4 }}>
                  <div style={{ fontSize:11, color:'var(--text-subtle)' }}>
                    AVT 裝機 <span style={{ fontFamily:'DM Mono, monospace', fontWeight:600, color:'var(--prod-avt)' }}>{project.avt_units}</span> 台
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          {(project?.launch_date||project?.batch1_deadline||project?.batch2_deadline) && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',
              gap:10, marginTop:18, paddingTop:16, borderTop:'1px solid var(--border)' }}>
              {[
                { label:t('dash.launch_date'),     date:project?.launch_date      },
                { label:t('dash.batch1_deadline'), date:project?.batch1_deadline  },
                { label:t('dash.batch2_deadline'), date:project?.batch2_deadline  },
              ].filter(x=>x.date).map(({ label, date }) => (
                <div key={label} style={{ background:'var(--surface-raised)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, color:'var(--text-subtle)', fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', fontFamily:'DM Mono, monospace' }}>
                      {fmtDate(date)}
                    </span>
                    <DaysChip date={date} t={t}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Batch 1 */}
        {(hasAva||hasAca) && (
          <Card style={{ animation:'fadeUp 0.35s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                background:'var(--green-light)', color:'var(--green)',
                border:'1px solid rgba(5,150,105,0.25)', borderRadius:6, padding:'2px 9px' }}>
                {t('dash.batch1')}
              </span>
              {project?.batch1_deadline && (
                <span style={{ fontSize:11, color:'var(--text-subtle)', marginLeft:'auto',
                  fontFamily:'DM Mono, monospace' }}>期限 {fmtDate(project.batch1_deadline)}</span>
              )}
            </div>
            {hasAva && <>
              <SectionHeader title={t('section.basic')} checked={counts.basic} total={BASIC_ITEMS.length} color="var(--green)"/>
              <div style={{ marginBottom: progress?.sheet_links?.basic ? 8 : 20 }}>
                {BASIC_ITEMS.map(item => (
                  <CheckRow key={item} label={item}
                    checked={!!(progress?.basic_checked?.[item])}
                    saving={savingKeys.has(`basic:${item}`)}
                    onToggle={() => handleToggle('basic', item, 'basic_checked')}/>
                ))}
              </div>
              {progress?.sheet_links?.basic && (
                <a href={progress.sheet_links.basic} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:4, marginBottom:20,
                    fontSize:12, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>↗ 開啟連結</a>
              )}
            </>}
            {hasAca && <>
              <SectionHeader title={t('section.aca')} checked={counts.aca} total={1} color="var(--green)"/>
              <div style={{ marginBottom:20 }}>
                <CheckRow label={ACA_ITEM}
                  checked={!!(progress?.basic_checked?.[ACA_ITEM])}
                  saving={savingKeys.has(`basic:${ACA_ITEM}`)}
                  onToggle={() => handleToggle('basic', ACA_ITEM, 'basic_checked')}/>
              </div>
            </>}
            {hasAva && <>
              <SectionHeader title={t('section.faq')} checked={counts.faq} total={activeFaq.length} color="var(--amber)"/>
              {activeFaq.map(item => (
                <CheckRow key={item} label={item}
                  checked={!!(progress?.faq_checked?.[item])}
                  saving={savingKeys.has(`faq:${item}`)}
                  onToggle={() => handleToggle('faq', item, 'faq_checked')}/>
              ))}
              {progress?.sheet_links?.faq && (
                <a href={progress.sheet_links.faq} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8,
                    fontSize:12, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>↗ 開啟連結</a>
              )}
            </>}
          </Card>
        )}

        {/* Batch 2 */}
        {(hasAva||hasGw) && (
          <Card style={{ animation:'fadeUp 0.4s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.06em',
                background:'var(--purple-light)', color:'var(--purple)',
                border:'1px solid rgba(124,58,237,0.25)', borderRadius:6, padding:'2px 9px' }}>
                {t('dash.batch2')}
              </span>
              {project?.batch2_deadline && (
                <span style={{ fontSize:11, color:'var(--text-subtle)', marginLeft:'auto',
                  fontFamily:'DM Mono, monospace' }}>期限 {fmtDate(project.batch2_deadline)}</span>
              )}
            </div>
            <SectionHeader title={t('section.batch2')}
              checked={counts.batch2+counts.gw}
              total={(hasAva?BATCH2_ITEMS.length:0)+(hasGw?1:0)}
              color="var(--purple)"/>
            {hasAva && BATCH2_ITEMS.map(item => (
              <CheckRow key={item} label={item}
                checked={!!(progress?.batch2_checked?.[item])}
                saving={savingKeys.has(`batch2:${item}`)}
                onToggle={() => handleToggle('batch2', item, 'batch2_checked')}/>
            ))}
            {hasAva && (() => {
              const links = [
                { key:'showcase', label:'Showcase' },
                { key:'ad',       label:'廣告' },
                { key:'popupQR',  label:'Pop-up QR' },
                { key:'guestWeb', label:'GuestWeb' },
              ].filter(l => progress?.sheet_links?.[l.key]);
              return links.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:8, marginBottom:8 }}>
                  {links.map(l => (
                    <a key={l.key} href={progress.sheet_links[l.key]} target="_blank" rel="noreferrer"
                      style={{ display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:12, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>↗ {l.label}</a>
                  ))}
                </div>
              ) : null;
            })()}
            {hasGw && (
              <CheckRow label={GW_ITEM}
                checked={!!(progress?.batch2_checked?.[GW_ITEM])}
                saving={savingKeys.has(`batch2:${GW_ITEM}`)}
                onToggle={() => handleToggle('batch2', GW_ITEM, 'batch2_checked')}/>
            )}
            {hasGw && progress?.sheet_links?.guestWeb && (
              <a href={progress.sheet_links.guestWeb} target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8,
                  fontSize:12, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>↗ GuestWeb 連結</a>
            )}
          </Card>
        )}

        {/* Tasks */}
        <Card style={{ animation:'fadeUp 0.45s ease' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
            color:'var(--accent)', marginBottom:14, display:'flex', alignItems:'center', gap:7 }}>
            <Ico name="clipboardList" size={13} color="currentColor"/>
            {t('dash.tasks')}
          </div>
          {tasks.length===0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'var(--text-subtle)', fontSize:13 }}>
              {t('dash.no_tasks')}
            </div>
          ) : tasks.map(task => {
            const isDl = task.type==='deadline';
            return (
              <div key={task.id} style={{ padding:'12px 14px', borderRadius:10, marginBottom:8,
                background:'var(--surface-raised)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                  gap:10, marginBottom:task.description?6:0 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', lineHeight:1.4 }}>
                    {task.name||'—'}
                  </span>
                  <span style={{ flexShrink:0, fontSize:10, fontWeight:600,
                    display:'inline-flex', alignItems:'center', gap:4, borderRadius:6, padding:'2px 8px',
                    background:isDl?'var(--amber-light)':'var(--green-light)',
                    color:isDl?'var(--amber)':'var(--green)',
                    border:`1px solid ${isDl?'rgba(217,119,6,0.3)':'rgba(5,150,105,0.3)'}`,
                    fontFamily:'DM Mono, monospace' }}>
                    <Ico name={isDl?'pin':'repeat'} size={10} color="currentColor"/>
                    {isDl ? fmtDate(task.deadline) : `${fmtDate(task.period_start)} → ${fmtDate(task.period_end)}`}
                  </span>
                </div>
                {task.description && (
                  <div style={{ fontSize:12, color:'var(--text-mid)', lineHeight:1.6 }}>{task.description}</div>
                )}
                {task.url?.startsWith('http') && (
                  <a href={task.url} target="_blank" rel="noreferrer"
                    style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:8,
                      fontSize:11, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>
                    <Ico name="link" size={11} color="currentColor"/> 相關連結
                  </a>
                )}
              </div>
            );
          })}
        </Card>

        {/* Last updated */}
        {updatedAtRef.current && (
          <div style={{ textAlign:'center', fontSize:11, color:'var(--text-subtle)', marginTop:4 }}>
            {t('dash.last_updated', {
              date: new Intl.DateTimeFormat(locale, { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })
                .format(new Date(updatedAtRef.current))
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  center:     { minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 },
  spinner:    { width:32, height:32, border:'2.5px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' },
  retryBtn:   { marginTop:8, display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-mid)', cursor:'pointer', fontFamily:'inherit', fontSize:13 },
  header:     { background:'var(--surface)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 },
  headerInner:{ maxWidth:760, margin:'0 auto', padding:'0 20px', height:54, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 },
  logo:       { display:'flex', alignItems:'center', gap:8, flexShrink:0, minWidth:0 },
  logoIcon:   { width:26, height:26, borderRadius:6, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  logoText:   { fontSize:14, fontWeight:700, color:'var(--text)', flexShrink:0 },
  langBtn:    (a) => ({ padding:'3px 9px', borderRadius:5, border:`1px solid ${a?'var(--accent)':'var(--border)'}`, background:a?'var(--accent-light)':'transparent', color:a?'var(--accent)':'var(--text-subtle)', fontSize:11, fontWeight:a?700:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s' }),
  logoutBtn:  { display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, border:'1px solid var(--border)', background:'transparent', color:'var(--text-subtle)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s' },
  toast:      { position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, color:'#fff', fontSize:13, fontWeight:600, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.2)', animation:'fadeUp 0.2s ease' },
};
