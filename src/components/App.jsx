import { useState, useEffect } from 'react';
import { sb, fromRow, toRow, fromLegacyJson } from '../lib/supabase.js';
import { initToast } from '../lib/toast.js';
import Login from './Login.jsx';
import Calculator from './Calculator.jsx';
import DevicesTable from './DevicesTable.jsx';
import ListsManager from './ListsManager.jsx';

const NAV = [
  { id: 'calc',    label: 'Calculadora', icon: '🧮' },
  { id: 'devices', label: 'Equipos',     icon: '📱' },
  { id: 'lists',   label: 'Mis listas',  icon: '📋' },
];

export default function App() {
  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [section, setSection]   = useState('calc');
  const [devices, setDevices]   = useState([]);
  const [lists, setLists]       = useState([]);
  const [profile, setProfile]   = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [savingWa, setSavingWa] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    initToast();
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadDevices();
      loadLists();
      loadProfile();
    }
  }, [session]);

  async function loadDevices() {
    const { data, error } = await sb.from('devices').select('*').order('created_at', { ascending: false });
    if (error) { window.toast(error.message, true); return; }
    setDevices((data || []).map(fromRow));
  }

  async function loadLists() {
    const { data, error } = await sb.from('price_lists').select('*').order('created_at', { ascending: false });
    if (error) return;
    setLists(data || []);
  }

  async function loadProfile() {
    const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) { setProfile(data); setWhatsapp(data.whatsapp || ''); }
  }

  async function saveWhatsapp() {
    setSavingWa(true);
    const { error } = await sb.from('profiles').upsert({ id: session.user.id, whatsapp: whatsapp.trim(), updated_at: new Date().toISOString() });
    setSavingWa(false);
    if (error) { window.toast(error.message, true); return; }
    window.toast('WhatsApp guardado');
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(devices, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'arttech_backup.json';
    a.click();
  }

  async function importJson(file) {
    try {
      const text = await file.text();
      const arr  = JSON.parse(text);
      if (!Array.isArray(arr) || !arr.every(x => x.name && (x.finalPrice || x.final_price))) {
        window.toast('Formato inválido: se requiere array con name y finalPrice', true);
        return;
      }
      const mode = confirm('¿Reemplazar todos los equipos actuales?\nAceptar = Reemplazar · Cancelar = Solo añadir')
        ? 'replace' : 'merge';

      setImporting(true);
      if (mode === 'replace') {
        const { error } = await sb.from('devices').delete().eq('user_id', session.user.id);
        if (error) { window.toast(error.message, true); setImporting(false); return; }
      }
      for (const obj of arr) {
        const d = fromLegacyJson(obj);
        await sb.from('devices').insert(toRow(d, session.user.id));
      }
      setImporting(false);
      window.toast(`${arr.length} equipos importados`);
      loadDevices();
    } catch (e) {
      setImporting(false);
      window.toast('Error al leer el archivo', true);
    }
  }

  function handleEdit(d) {
    setEditDevice(d);
    setSection('calc');
    setSidebarOpen(false);
  }

  function handleSaved() {
    loadDevices();
    loadLists();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (!session) return <Login />;

  const user = session.user;

  const sectionTitles = { calc: 'Calculadora', devices: 'Mis Equipos', lists: 'Mis Listas' };

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <span className="text-accent font-bold text-lg">ArtTech</span>
        <span className="text-text3 text-sm ml-1">Precios</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => { setSection(n.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors text-left ${
              section === n.id
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-text2 hover:bg-bg3 hover:text-text1'
            }`}
          >
            <span>{n.icon}</span>
            <span>{n.label}</span>
            {n.id === 'devices' && <span className="ml-auto text-xs text-text3">{devices.length}</span>}
          </button>
        ))}
      </nav>

      {/* Footer / Profile */}
      <div className="px-4 py-4 border-t border-border space-y-3">
        <p className="text-text3 text-xs truncate" title={user.email}>{user.email}</p>
        <p className="text-text3 text-xs">{devices.filter(d => d.available).length} equipos disponibles</p>

        <div className="space-y-1">
          <label className="label">WhatsApp</label>
          <input
            className="input text-xs"
            placeholder="ej. 584121234567"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
          <button className="btn-secondary w-full text-xs py-1.5 mt-1" onClick={saveWhatsapp} disabled={savingWa}>
            {savingWa ? <span className="spinner" /> : 'Guardar WhatsApp'}
          </button>
        </div>

        <div className="flex gap-2">
          <button className="btn-ghost flex-1 text-xs py-1.5" onClick={exportJson}>
            Exportar JSON
          </button>
          <label className="btn-ghost flex-1 text-xs py-1.5 cursor-pointer text-center">
            {importing ? <span className="spinner" /> : 'Importar JSON'}
            <input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) importJson(f); e.target.value = ''; }} />
          </label>
        </div>

        <button
          className="btn-danger w-full text-xs py-1.5"
          onClick={() => sb.auth.signOut()}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] bg-bg1 border-r border-border fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] bg-bg1 border-r border-border z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-[220px] flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-bg1 border-b border-border px-4 py-3 flex items-center gap-3">
          <button className="md:hidden text-text2 hover:text-text1" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <h1 className="section-title flex-1">{sectionTitles[section]}</h1>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 pb-20 md:pb-6">
          {section === 'calc' && (
            <Calculator
              user={user}
              editDevice={editDevice}
              onSaved={handleSaved}
              onCancelEdit={() => setEditDevice(null)}
            />
          )}
          {section === 'devices' && (
            <DevicesTable
              devices={devices}
              onEdit={handleEdit}
              onRefresh={loadDevices}
            />
          )}
          {section === 'lists' && (
            <ListsManager
              lists={lists}
              devices={devices}
              user={user}
              onRefresh={() => { loadLists(); loadDevices(); }}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-bg1 border-t border-border flex">
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => { setSection(n.id); setEditDevice(n.id !== 'calc' ? null : editDevice); }}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors ${
              section === n.id ? 'text-accent' : 'text-text3'
            }`}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
