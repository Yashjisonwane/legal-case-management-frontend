import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const statusBadge = (s) => ({
  draft:     { bg: 'rgba(234,179,8,0.15)',    color: '#fde047', border: 'rgba(234,179,8,0.3)' },
  completed: { bg: 'rgba(34,197,94,0.15)',    color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  filed:     { bg: 'rgba(59,130,246,0.15)',   color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
}[s] || { bg: 'rgba(234,179,8,0.15)', color: '#fde047', border: 'rgba(234,179,8,0.3)' });

const SYSTEM_FIELDS = [
  { key: 'case_title',    label: 'Case Title' },
  { key: 'case_number',   label: 'Case Number' },
  { key: 'matter_number', label: 'Matter Number' },
  { key: 'plaintiff',     label: 'Plaintiff' },
  { key: 'defendant',     label: 'Defendant' },
  { key: 'filing_date',   label: 'Filing Date',   type: 'date' },
  { key: 'hearing_date',  label: 'Hearing Date',  type: 'date' },
  { key: 'court_name',    label: 'Court Name' },
  { key: 'court_address', label: 'Court Address' },
  { key: 'judge_name',    label: 'Judge Name' },
  { key: 'attorney_name', label: 'Attorney Name' },
  { key: 'attorney_email',label: 'Attorney Email' },
  { key: 'firm_name',     label: 'Firm Name' },
  { key: 'firm_address',  label: 'Firm Address' },
  { key: 'firm_phone',    label: 'Firm Phone' },
  { key: 'client_name',   label: 'Client Name' },
  { key: 'client_address',label: 'Client Address' },
  { key: 'client_phone',  label: 'Client Phone' },
  { key: 'client_email',  label: 'Client Email' },
];

const toDateValue = (v) => {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return v;
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
};

// ─── Custom Matter Dropdown ───────────────────────────────────
function MatterDropdown({ matters, value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState('');
  const ref               = useRef(null);
  const inputRef          = useRef(null);
  const selected          = matters.find(m => String(m.id) === String(value));
  const filtered          = matters.filter(m =>
    !q || m.title.toLowerCase().includes(q.toLowerCase()) ||
    (m.case_number || '').toLowerCase().includes(q.toLowerCase())
  );

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => { setOpen(v => !v); setQ(''); setTimeout(() => inputRef.current?.focus(), 40); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '11px 14px', cursor: 'pointer', transition: 'border-color .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,87,199,0.6)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = open ? 'rgba(0,87,199,0.7)' : 'rgba(255,255,255,0.12)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,87,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
          </div>
          {selected ? (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.title}</div>
              {selected.case_number && <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 1 }}>{selected.case_number}</div>}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#8a94a6' }}>— Choose a Matter —</span>
          )}
        </div>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8a94a6" strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', zIndex: 999, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#8a94a6" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search matters..."
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1 }}/>
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '20px', textAlign: 'center', color: '#8a94a6', fontSize: 13 }}>No matters found</div>
              : filtered.map(m => (
                <button key={m.id} type="button" onClick={() => { onChange(String(m.id)); setOpen(false); setQ(''); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    background: String(m.id) === String(value) ? 'rgba(0,87,199,0.2)' : 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { if (String(m.id) !== String(value)) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = String(m.id) === String(value) ? 'rgba(0,87,199,0.2)' : 'transparent'; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    {m.case_number && <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 2 }}>{m.case_number}</div>}
                  </div>
                  {String(m.id) === String(value) && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2.5}><path d="M5 13l4 4L19 7"/></svg>
                  )}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Custom Practice Area Dropdown ────────────────────────────
function PracticeAreaDropdown({ practiceAreas, value, onChange }) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '220px' }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: 'border-color .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,87,199,0.6)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = open ? 'rgba(0,87,199,0.7)' : 'rgba(255,255,255,0.12)'}
      >
        <span style={{ fontSize: 13, color: value ? '#fff' : '#8a94a6', textTransform: 'capitalize', truncate: true }}>
          {value || 'All Practice Areas'}
        </span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8a94a6" strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', zIndex: 999, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              style={{ width: '100%', textAlign: 'left', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                background: !value ? 'rgba(0,87,199,0.2)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#fff', fontSize: 13 }}>
              All Practice Areas
            </button>
            {practiceAreas.map(pa => (
              <button key={pa} type="button" onClick={() => { onChange(pa); setOpen(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  background: value === pa ? 'rgba(0,87,199,0.2)' : 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#fff', fontSize: 13 }}
                onMouseEnter={e => { if (value !== pa) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = value === pa ? 'rgba(0,87,199,0.2)' : 'transparent'; }}>
                {pa}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default function CourtFormsPage({ toast, role = 'admin' }) {
  const [tab,            setTab]            = useState('library');
  const [templates,      setTemplates]      = useState([]);
  const [drafts,         setDrafts]         = useState([]);
  const [matters,        setMatters]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [practiceFilter, setPracticeFilter] = useState('');
  const [wizard,         setWizard]         = useState(null);
  const [wizardStep,     setWizardStep]     = useState(1);
  const [prefillData,    setPrefillData]    = useState({});
  const [formValues,     setFormValues]     = useState({});
  const [generating,     setGenerating]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('court_form_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('court_form_favorites', JSON.stringify(next));
      return next;
    });
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tR, dR, mR] = await Promise.all([
        api.courtForms.listTemplates(),
        api.courtForms.listDrafts(),
        api.matters.list({ limit: 200 }),
      ]);
      setTemplates(Array.isArray(tR.data) ? tR.data : []);
      setDrafts(Array.isArray(dR.data) ? dR.data : []);
      setMatters(Array.isArray(mR.data) ? mR.data : []);
    } catch { toast?.('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredTemplates = templates.filter(t => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.form_number.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
    const matchesPractice = !practiceFilter || t.practice_area === practiceFilter;
    const matchesFav = !showOnlyFavs || favorites.includes(t.id);
    return matchesSearch && matchesPractice && matchesFav;
  });
  const practiceAreas = [...new Set(templates.map(t => t.practice_area).filter(Boolean))];

  const openWizard = async (template, draft = null) => {
    setPrefillData({});
    setFormValues(draft?.form_data || {});
    setWizard({ template, matter_id: draft?.matter?.id || '', draft_id: draft?.id || null });
    setWizardStep(draft ? 2 : 1);
    if (draft?.matter?.id) {
      try { const r = await api.courtForms.prefill(draft.matter.id); setPrefillData(r.data || {}); } catch {}
    }
  };

  const handleMatterSelect = async id => {
    setWizard(p => ({ ...p, matter_id: id }));
    if (!id) return;
    try { const r = await api.courtForms.prefill(id); setPrefillData(r.data || {}); setFormValues(r.data || {}); } catch {}
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (wizard.draft_id) {
        await api.courtForms.updateDraft(wizard.draft_id, { form_data: formValues });
      } else {
        const r = await api.courtForms.createDraft({ template_id: wizard.template.id, matter_id: wizard.matter_id, form_data: formValues });
        setWizard(p => ({ ...p, draft_id: r.data?.id }));
      }
      toast?.('Draft saved', 'success'); fetchAll();
    } catch { toast?.('Failed to save draft', 'error'); }
    finally { setSaving(false); }
  };

  const doGenerate = async draftId => {
    setGenerating(true);
    try {
      const r = await api.courtForms.generatePdf(draftId);
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${wizard.template.form_number}_form.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast?.('PDF generated and downloaded!', 'success');
      setWizard(null); fetchAll();
    } catch { toast?.('PDF generation failed', 'error'); }
    finally { setGenerating(false); }
  };

  const handleGeneratePdf = async () => {
    if (!wizard.draft_id) {
      setSaving(true);
      try {
        const r = await api.courtForms.createDraft({ template_id: wizard.template.id, matter_id: wizard.matter_id, form_data: formValues });
        setWizard(p => ({ ...p, draft_id: r.data?.id }));
        await doGenerate(r.data?.id);
      } catch { toast?.('Save failed', 'error'); }
      finally { setSaving(false); }
      return;
    }
    await api.courtForms.updateDraft(wizard.draft_id, { form_data: formValues });
    await doGenerate(wizard.draft_id);
  };

  const sx = { // shared styles shorthand
    page:    { minHeight: '100vh', background: '#020b18', color: '#fff', padding: '32px' },
    card:    { background: '#0a1628', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 },
    tabBar:  { display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, width: 'fit-content', marginBottom: 28 },
    chip:    (active) => ({ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .2s',
      background: active ? '#0057c7' : 'transparent', color: active ? '#fff' : '#8a94a6' }),
    input:   { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none' },
    btn:     (variant) => ({
      primary: { padding: '10px 22px', background: '#0057c7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
      ghost:   { padding: '10px 22px', background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
      danger:  { padding: '7px 14px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
      success: { padding: '7px 14px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
      edit:    { padding: '7px 14px', background: 'rgba(0,87,199,0.2)', color: '#38bdf8', border: '1px solid rgba(0,87,199,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    }[variant]),
  };

  return (
    <div style={sx.page}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,87,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={1.5}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Court Forms</h1>
            <p style={{ fontSize: 13, color: '#8a94a6', margin: 0 }}>California Judicial Council Forms — Auto-Prefill &amp; PDF Generator</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={sx.tabBar}>
        {[
          { id: 'library', label: 'Forms Library' },
          { id: 'drafts',  label: `My Forms${drafts.length ? ` (${drafts.length})` : ''}` },
          ...(role === 'admin' ? [{ id: 'mapping', label: 'Field Mapping' }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={sx.chip(tab === t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,87,199,0.3)', borderTopColor: '#0057c7', animation: 'spin 0.8s linear infinite' }}/>
        </div>
      ) : (
        <>
          {/* ── LIBRARY ── */}
          {tab === 'library' && (
            <div>
              {/* Search + Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, ...sx.card, padding: '10px 16px' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8a94a6" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by form number or title…"
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1 }}/>
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#8a94a6', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>}
                </div>
                
                <PracticeAreaDropdown practiceAreas={practiceAreas} value={practiceFilter} onChange={setPracticeFilter} />
                
                {/* Favorites filter toggle */}
                <button type="button" onClick={() => setShowOnlyFavs(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: showOnlyFavs ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${showOnlyFavs ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.12)'}`,
                    color: showOnlyFavs ? '#fde047' : '#8a94a6', transition: 'all 0.2s' }}>
                  <svg width="14" height="14" fill={showOnlyFavs ? '#fde047' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z"/>
                  </svg>
                  Favorites
                </button>
              </div>

              {/* Results count */}
              {(search || showOnlyFavs || practiceFilter) && (
                <p style={{ fontSize: 13, color: '#8a94a6', marginBottom: 16 }}>
                  {filteredTemplates.length} form{filteredTemplates.length !== 1 ? 's' : ''} found
                </p>
              )}

              {/* Cards Grid */}
              {filteredTemplates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#8a94a6' }}>
                  <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }}>
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
                  </svg>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>No forms found</p>
                  <p style={{ fontSize: 13, marginTop: 4 }}>Try a different search term or clear the filters</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {filteredTemplates.map(t => {
                    const isFav = favorites.includes(t.id);
                    return (
                      <div key={t.id} style={{ ...sx.card, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', transition: 'border-color .2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,87,199,0.4)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                        
                        {/* Favorite Star Button */}
                        <button type="button" onClick={() => toggleFavorite(t.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFav ? '#fde047' : 'rgba(255,255,255,0.2)' }}
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                          <svg width="18" height="18" fill={isFav ? '#fde047' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.176 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z"/>
                          </svg>
                        </button>

                        {/* Icon */}
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,87,199,0.15)', border: '1px solid rgba(0,87,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={1.5}>
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                            <rect x="9" y="3" width="6" height="4" rx="1"/>
                            <path d="M9 12h6M9 16h4"/>
                          </svg>
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{t.form_number}</span>
                            {t.practice_area && (
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 20, background: 'rgba(0,87,199,0.2)', color: '#38bdf8', border: '1px solid rgba(0,87,199,0.25)' }}>
                                {t.practice_area}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', margin: 0 }}>{t.title}</p>
                        </div>
                        {/* Generate Button */}
                        <button onClick={() => openWizard(t)}
                          style={{ ...sx.btn('primary'), flexShrink: 0, whiteSpace: 'nowrap' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0066e0'}
                          onMouseLeave={e => e.currentTarget.style.background = '#0057c7'}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4v16m8-8H4"/></svg>
                          Generate
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* ── MY FORMS ── */}
          {tab === 'drafts' && (
            <div>
              {drafts.length === 0 ? (
                <div style={{ ...sx.card, textAlign: 'center', padding: '80px 40px' }}>
                  <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ margin: '0 auto 16px', display: 'block', color: '#1e3a5f' }}>
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
                  </svg>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>No saved forms yet</p>
                  <p style={{ fontSize: 13, color: '#8a94a6' }}>Generate your first form from the <strong style={{ color: '#38bdf8' }}>Forms Library</strong> tab</p>
                </div>
              ) : (
                <div style={{ ...sx.card, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['Form', 'Matter', 'Status', 'Generated By', 'Last Modified', 'Actions'].map((h, i) => (
                          <th key={h} style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8a94a6', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.map((d, idx) => {
                        const st = statusBadge(d.status);
                        return (
                          <tr key={d.id} style={{ borderBottom: idx < drafts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background .15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 20px' }}>
                              <p style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#38bdf8', margin: 0 }}>{d.template?.form_number}</p>
                              <p style={{ fontSize: 12, color: '#8a94a6', marginTop: 3 }}>{d.template?.title}</p>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#fff', margin: 0 }}>{d.matter?.title || '—'}</p>
                              {d.matter?.case_number && <p style={{ fontSize: 11, color: '#8a94a6', marginTop: 3 }}>{d.matter.case_number}</p>}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, textTransform: 'capitalize', background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{d.status}</span>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 13, color: '#8a94a6' }}>{d.creator?.full_name || '—'}</td>
                            <td style={{ padding: '16px 20px', fontSize: 13, color: '#8a94a6' }}>{new Date(d.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => openWizard(d.template, d)} style={sx.btn('edit')}>Edit</button>
                                {d.status !== 'filed' && <button onClick={() => { api.courtForms.updateDraft(d.id, { status: 'filed' }).then(() => { toast?.('Marked as filed', 'success'); fetchAll(); }).catch(() => toast?.('Failed', 'error')); }} style={sx.btn('success')}>Mark Filed</button>}
                                <button onClick={() => { api.courtForms.deleteDraft(d.id).then(() => { toast?.('Deleted', 'success'); fetchAll(); }).catch(() => toast?.('Failed', 'error')); }} style={sx.btn('danger')}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── MAPPING ── */}
          {tab === 'mapping' && <MappingTab templates={templates} toast={toast} />}
        </>
      )}

      {/* ── WIZARD MODAL ── */}
      {wizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, width: '100%', maxWidth: 740, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 26px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#0d1f3c', zIndex: 10, borderRadius: '18px 18px 0 0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: 6 }}>{wizard.template?.form_number}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{wizard.template?.title}</h2>
              </div>
              <button onClick={() => setWizard(null)}
                style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a94a6', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 26px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Select Matter', 'Fill Details', 'Generate PDF'].map((label, i) => {
                const done    = wizardStep > i + 1;
                const active  = wizardStep === i + 1;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                        background: done ? '#22c55e' : active ? '#0057c7' : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${done ? '#22c55e' : active ? '#0057c7' : 'rgba(255,255,255,0.12)'}`,
                        color: (done || active) ? '#fff' : '#8a94a6' }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#fff' : done ? '#4ade80' : '#8a94a6' }}>{label}</span>
                    </div>
                    {i < 2 && <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.08)' }}/>}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '26px' }}>
              {/* Step 1 */}
              {wizardStep === 1 && (
                <div>
                  <p style={{ color: '#8a94a6', fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
                    Select the case / matter to pre-populate this form with client, attorney, and court information.
                  </p>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Select Matter <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <MatterDropdown matters={matters} value={wizard.matter_id} onChange={handleMatterSelect}/>
                  {!wizard.matter_id && (
                    <p style={{ fontSize: 12, color: '#8a94a6', marginTop: 10 }}>
                      💡 {matters.length} matter{matters.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                    <button onClick={() => { if (!wizard.matter_id) { toast?.('Please select a matter first', 'error'); return; } setWizardStep(2); }}
                      style={{ ...sx.btn('primary') }}
                      onMouseEnter={e => e.currentTarget.style.background = '#0066e0'}
                      onMouseLeave={e => e.currentTarget.style.background = '#0057c7'}>
                      Next: Fill Details →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {wizardStep === 2 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 10 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p style={{ fontSize: 12, color: '#38bdf8', margin: 0 }}>Fields tagged <strong>AUTO</strong> were prefilled from the database. You can edit anything before generating.</p>
                  </div>
                  {/* Form divided into sections to avoid overlap and look clean */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Section 1: Matter Details */}
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                        ⚖️ Matter Details
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {[
                          { key: 'case_title', label: 'Case Title' },
                          { key: 'case_number', label: 'Case Number' },
                          { key: 'matter_number', label: 'Matter Number' },
                          { key: 'filing_date', label: 'Filing Date', type: 'date' },
                        ].map(({ key, label, type }) => (
                          <div key={key}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                            <div style={{ position: 'relative' }}>
                              <input type={type || 'text'} value={type === 'date' ? toDateValue(formValues[key]) : (formValues[key] || '')}
                                onChange={e => setFormValues(p => ({ ...p, [key]: e.target.value }))}
                                style={{ ...sx.input, paddingRight: prefillData[key] ? 50 : 14, borderColor: prefillData[key] ? 'rgba(0,87,199,0.5)' : 'rgba(255,255,255,0.1)' }}/>
                              {prefillData[key] && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#38bdf8', background: 'rgba(0,87,199,0.15)', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Parties & Case Roles */}
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                        👥 Case Parties
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {[
                          { key: 'plaintiff', label: 'Plaintiff' },
                          { key: 'defendant', label: 'Defendant' },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                            <div style={{ position: 'relative' }}>
                              <input type="text" value={formValues[key] || ''}
                                onChange={e => setFormValues(p => ({ ...p, [key]: e.target.value }))}
                                style={{ ...sx.input, paddingRight: prefillData[key] ? 50 : 14, borderColor: prefillData[key] ? 'rgba(0,87,199,0.5)' : 'rgba(255,255,255,0.1)' }}/>
                              {prefillData[key] && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#38bdf8', background: 'rgba(0,87,199,0.15)', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Client Details */}
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                        👤 Client Contact Details
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {[
                          { key: 'client_name', label: 'Client Name' },
                          { key: 'client_email', label: 'Client Email' },
                          { key: 'client_phone', label: 'Client Phone' },
                          { key: 'client_address', label: 'Client Address' },
                        ].map(({ key, label }) => (
                          <div key={key} style={{ gridColumn: key === 'client_address' ? 'span 2' : 'auto' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                            <div style={{ position: 'relative' }}>
                              <input type="text" value={formValues[key] || ''}
                                onChange={e => setFormValues(p => ({ ...p, [key]: e.target.value }))}
                                style={{ ...sx.input, paddingRight: prefillData[key] ? 50 : 14, borderColor: prefillData[key] ? 'rgba(0,87,199,0.5)' : 'rgba(255,255,255,0.1)' }}/>
                              {prefillData[key] && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#38bdf8', background: 'rgba(0,87,199,0.15)', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Attorney & Firm Details */}
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                        🏢 Attorney &amp; Firm Information
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {[
                          { key: 'attorney_name', label: 'Attorney Name' },
                          { key: 'attorney_email', label: 'Attorney Email' },
                          { key: 'firm_name', label: 'Firm Name' },
                          { key: 'firm_phone', label: 'Firm Phone' },
                          { key: 'firm_address', label: 'Firm Address' },
                        ].map(({ key, label }) => (
                          <div key={key} style={{ gridColumn: key === 'firm_address' ? 'span 2' : 'auto' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                            <div style={{ position: 'relative' }}>
                              <input type="text" value={formValues[key] || ''}
                                onChange={e => setFormValues(p => ({ ...p, [key]: e.target.value }))}
                                style={{ ...sx.input, paddingRight: prefillData[key] ? 50 : 14, borderColor: prefillData[key] ? 'rgba(0,87,199,0.5)' : 'rgba(255,255,255,0.1)' }}/>
                              {prefillData[key] && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#38bdf8', background: 'rgba(0,87,199,0.15)', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 5: Court details */}
                    <div>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                        🏛️ Court Details
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        {[
                          { key: 'court_name', label: 'Court Name' },
                          { key: 'judge_name', label: 'Judge Name' },
                          { key: 'court_address', label: 'Court Address' },
                          { key: 'hearing_date', label: 'Hearing Date', type: 'date' },
                        ].map(({ key, label, type }) => (
                          <div key={key} style={{ gridColumn: key === 'court_address' ? 'span 2' : 'auto' }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
                            <div style={{ position: 'relative' }}>
                              <input type={type || 'text'} value={type === 'date' ? toDateValue(formValues[key]) : (formValues[key] || '')}
                                onChange={e => setFormValues(p => ({ ...p, [key]: e.target.value }))}
                                style={{ ...sx.input, paddingRight: prefillData[key] ? 50 : 14, borderColor: prefillData[key] ? 'rgba(0,87,199,0.5)' : 'rgba(255,255,255,0.1)' }}/>
                              {prefillData[key] && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#38bdf8', background: 'rgba(0,87,199,0.15)', padding: '2px 6px', borderRadius: 4 }}>AUTO</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button onClick={() => setWizardStep(1)} style={{ background: 'none', border: 'none', color: '#8a94a6', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      ← Back
                    </button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={handleSaveDraft} disabled={saving} style={{ ...sx.btn('ghost'), opacity: saving ? 0.6 : 1 }}>
                        {saving ? 'Saving…' : 'Save Draft'}
                      </button>
                      <button onClick={handleGeneratePdf} disabled={generating || saving}
                        style={{ ...sx.btn('primary'), opacity: (generating || saving) ? 0.6 : 1 }}
                        onMouseEnter={e => { if (!generating && !saving) e.currentTarget.style.background = '#0066e0'; }}
                        onMouseLeave={e => e.currentTarget.style.background = '#0057c7'}>
                        {generating
                          ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/> Generating…</>
                          : <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Generate PDF</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Template Dropdown ─────────────────────────────────
function TemplateDropdown({ templates, value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [q, setQ]         = useState('');
  const ref               = useRef(null);
  const inputRef          = useRef(null);
  const selected          = templates.find(t => String(t.id) === String(value));
  const filtered          = templates.filter(t =>
    !q || t.title.toLowerCase().includes(q.toLowerCase()) ||
    t.form_number.toLowerCase().includes(q.toLowerCase())
  );

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
      <button type="button" onClick={() => { setOpen(v => !v); setQ(''); setTimeout(() => inputRef.current?.focus(), 40); }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '11px 14px', cursor: 'pointer', transition: 'border-color .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,87,199,0.6)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = open ? 'rgba(0,87,199,0.7)' : 'rgba(255,255,255,0.12)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,87,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
          </div>
          {selected ? (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.title}</div>
              <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 1 }}>{selected.form_number}</div>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: '#8a94a6' }}>— Choose a template —</span>
          )}
        </div>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8a94a6" strokeWidth={2}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div style={{ position: 'absolute', zIndex: 999, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#8a94a6" strokeWidth={2}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search templates..."
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1 }}/>
            </div>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '20px', textAlign: 'center', color: '#8a94a6', fontSize: 13 }}>No templates found</div>
              : filtered.map(t => (
                <button key={t.id} type="button" onClick={() => { onChange(String(t.id)); setOpen(false); setQ(''); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    background: String(t.id) === String(value) ? 'rgba(0,87,199,0.2)' : 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { if (String(t.id) !== String(value)) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = String(t.id) === String(value) ? 'rgba(0,87,199,0.2)' : 'transparent'; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 2 }}>{t.form_number}</div>
                  </div>
                  {String(t.id) === String(value) && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth={2.5}><path d="M5 13l4 4L19 7"/></svg>
                  )}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mapping Tab ──────────────────────────────────────────────
function MappingTab({ templates, toast }) {
  const [sel,     setSel]     = useState('');
  const [detail,  setDetail]  = useState(null);
  const [maps,    setMaps]    = useState([]);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!sel) return;
    api.courtForms.getTemplate(sel).then(r => { setDetail(r.data); setMaps(r.data?.mappings || []); });
  }, [sel]);

  const SYSTEM_FIELDS_MAP = [
    { key: 'case_title', label: 'Case Title' }, { key: 'case_number', label: 'Case Number' },
    { key: 'plaintiff', label: 'Plaintiff' }, { key: 'defendant', label: 'Defendant' },
    { key: 'court_name', label: 'Court Name' }, { key: 'judge_name', label: 'Judge Name' },
    { key: 'attorney_name', label: 'Attorney Name' }, { key: 'firm_name', label: 'Firm Name' },
    { key: 'client_name', label: 'Client Name' }, { key: 'client_address', label: 'Client Address' },
    { key: 'client_phone', label: 'Client Phone' }, { key: 'client_email', label: 'Client Email' },
    { key: 'filing_date', label: 'Filing Date' }, { key: 'hearing_date', label: 'Hearing Date' },
    { key: 'firm_address', label: 'Firm Address' }, { key: 'firm_phone', label: 'Firm Phone' },
    { key: 'court_address', label: 'Court Address' }, { key: 'matter_number', label: 'Matter Number' },
    { key: 'attorney_email', label: 'Attorney Email' },
  ];

  return (
    <div>
      <p style={{ color: '#8a94a6', fontSize: 13, marginBottom: 24 }}>
        Map system database fields to PDF form input fields. Configured mappings are used during auto-prefill.
      </p>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Select Template</label>
        <TemplateDropdown templates={templates} value={sel} onChange={setSel} />
      </div>

      {sel && (
        <div style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <p style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: 14 }}>Field Mappings</p>
              <p style={{ fontSize: 12, color: '#8a94a6', margin: 0, marginTop: 2 }}>{detail?.form_number} — {maps.length} mapping{maps.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button onClick={() => setMaps(p => [...p, { pdf_field_name: '', system_field_path: '' }])}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', background: 'rgba(0,87,199,0.2)', color: '#38bdf8', border: '1px solid rgba(0,87,199,0.3)', borderRadius: 8, cursor: 'pointer' }}>
              + Add Mapping
            </button>
          </div>

          {maps.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#8a94a6', fontSize: 13 }}>
              No mappings yet. Click "Add Mapping" to define field connections.
            </div>
          ) : (
            <div>
              {maps.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <input placeholder="PDF field name (from form)" value={m.pdf_field_name}
                    onChange={e => setMaps(p => p.map((x, j) => j === i ? { ...x, pdf_field_name: e.target.value } : x))}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none' }}/>
                  <span style={{ color: '#8a94a6', fontSize: 18, flexShrink: 0 }}>→</span>
                  <select value={m.system_field_path}
                    onChange={e => setMaps(p => p.map((x, j) => j === i ? { ...x, system_field_path: e.target.value } : x))}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', cursor: 'pointer' }}>
                    <option value="">— System Field —</option>
                    {SYSTEM_FIELDS_MAP.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <button onClick={() => setMaps(p => p.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6', padding: 4, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8a94a6'}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={async () => {
              setSaving(true);
              try { await api.courtForms.saveMappings(sel, maps.filter(m => m.pdf_field_name && m.system_field_path)); toast?.('Mappings saved', 'success'); }
              catch { toast?.('Failed to save', 'error'); } finally { setSaving(false); }
            }} disabled={saving}
              style={{ padding: '10px 22px', background: '#0057c7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Mappings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
