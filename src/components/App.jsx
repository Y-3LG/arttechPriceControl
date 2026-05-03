import { useState, useEffect } from 'react';
import {
  Calculator as CalcIcon, Smartphone, List, LogOut,
  Download, Upload, MessageCircle, Check, Plus
} from 'lucide-react';
import { sb, fromRow, toRow, fromLegacyJson } from '../lib/supabase.js';
import { initToast } from '../lib/toast.js';
import Login from './Login.jsx';
import Calculator from './Calculator.jsx';
import DevicesTable from './DevicesTable.jsx';
import ListsManager from './ListsManager.jsx';

const NAV = [
  { id: 'calc',    label: 'Calculadora', Icon: CalcIcon },
  { id: 'devices', label: 'Equipos',     Icon: Smartphone },
  { id: 'lists',   label: 'Mis listas',  Icon: List },
];

const SW = 1.5; // strokeWidth global

export default function App() {
  const [session, setSession]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [section, setSection]       = useState('calc');
  const [devices, setDevices]       = useState([]);
  const [lists, setLists]           = useState([]);
  const [profile, setProfile]       = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [importing, setImporting]   = useState(false);
  // Local WA state for the input — fix para el bug de desenfoque
  const [localWA, setLocalWA]       = useState('');
  const [savingWa, setSavingWa]     = useState(false);

  useEffect(() => {
    initToast();
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setSession(session); setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) { loadDevices(); loadLists(); loadProfile(); }
  }, [session]);

  // Sync localWA when profile loads
  useEffect(() => {
    if (profile?.whatsapp) setLocalWA(profile.whatsapp);
  }, [profile?.whatsapp]);

  async function loadDevices() {
    const { data, error } = await sb.from('devices').select('*').order('created_at', { ascending: false });
    if (error) { window.toast(error.message, true); return; }
    setDevices((data || []).map(fromRow));
  }
  async function loadLists() {
    const { data } = await sb.from('price_lists').select('*').order('created_at', { ascending: false });
    setLists(data || []);
  }
  async function loadProfile() {
    const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) setProfile(data);
  }

  async function saveWhatsapp(val) {
    if (val === (profile?.whatsapp || '')) return;
    setSavingWa(true);
    const { error } = await sb.from('profiles').upsert({
      id: session.user.id, whatsapp: val.trim(), updated_at: new Date().toISOString()
    });
    setSavingWa(false);
    if (error) { window.toast(error.message, true); return; }
    window.toast('WhatsApp guardado');
    setProfile(p => ({ ...p, whatsapp: val.trim() }));
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
        window.toast('Formato inválido', true); return;
      }
      const mode = confirm('¿Reemplazar todos los equipos actuales?\nAceptar = Reemplazar · Cancelar = Solo añadir')
        ? 'replace' : 'merge';
      setImporting(true);
      if (mode === 'replace') {
        await sb.from('devices').delete().eq('user_id', session.user.id);
      }
      for (const obj of arr) {
        const d = fromLegacyJson(obj);
        await sb.from('devices').insert(toRow(d, session.user.id));
      }
      setImporting(false);
      window.toast(`${arr.length} equipos importados`);
      loadDevices();
    } catch {
      setImporting(false);
      window.toast('Error al leer el archivo', true);
    }
  }

  function handleEdit(d) { setEditDevice(d); setSection('calc'); setSidebarOpen(false); }
  function handleSaved() { loadDevices(); loadLists(); }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="spinner" style={{ width: 20, height: 20 }} />
    </div>
  );
  if (!session) return <Login />;

  const user = session.user;
  const sectionTitles = { calc: 'Calculadora', devices: 'Mis Equipos', lists: 'Mis Listas' };

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex-shrink-0">
        <span className="text-text1 font-semibold text-base tracking-tight">ArtTech</span>
        <span className="text-text3 text-xs ml-1">Precios</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => { setSection(id); setSidebarOpen(false); }}
              style={{
                borderLeft: `2px solid ${active ? '#c8ff00' : 'transparent'}`,
                paddingLeft: '10px',
              }}
              className={`w-full flex items-center gap-3 pr-3 py-2.5 rounded-r-btn text-sm transition-colors text-left ${
                active ? 'text-text1 font-medium' : 'text-text3 hover:text-text2'
              }`}
            >
              <Icon size={16} strokeWidth={SW} className={active ? 'opacity-100' : 'opacity-60'} />
              <span className="flex-1">{label}</span>
              {id === 'devices' && (
                <span className="text-xs text-text3">{devices.length}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="px-4 py-4 border-t border-border space-y-3 flex-shrink-0">
        <p className="text-text3 text-xs truncate" title={user.email}>{user.email}</p>
        <p className="text-text3 text-xs">{devices.filter(d => d.available).length} disponibles</p>

        <div className="space-y-1">
          <label className="label flex items-center gap-1.5">
            <MessageCircle size={10} strokeWidth={SW} /> WhatsApp
          </label>
          <input
            className="input text-xs"
            placeholder="584121234567"
            value={localWA}
            onChange={e => setLocalWA(e.target.value)}
            onBlur={() => saveWhatsapp(localWA)}
          />
          <button
            className="btn w-full text-xs py-1.5 mt-1 gap-1.5"
            onClick={() => saveWhatsapp(localWA)}
            disabled={savingWa}
          >
            {savingWa ? <span className="spinner" /> : <Check size={12} strokeWidth={SW} />}
            Guardar
          </button>
        </div>

        <div className="flex gap-2">
          <button className="btn flex-1 text-xs py-1.5 gap-1.5" onClick={exportJson}>
            <Download size={12} strokeWidth={SW} /> Exportar
          </button>
          <label className="btn flex-1 text-xs py-1.5 gap-1.5 cursor-pointer justify-center">
            {importing ? <span className="spinner" /> : <Upload size={12} strokeWidth={SW} />}
            Importar
            <input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) importJson(f); e.target.value = ''; }} />
          </label>
        </div>

        <button className="btn-danger w-full text-xs py-1.5 gap-1.5" onClick={() => sb.auth.signOut()}>
          <LogOut size={12} strokeWidth={SW} /> Cerrar sesión
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
        <header className="sticky top-0 z-20 bg-bg1 border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            className="md:hidden text-text3 hover:text-text2 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <List size={18} strokeWidth={SW} />
          </button>
          <h1 className="section-title flex-1">{sectionTitles[section]}</h1>
        </header>

        <div className="flex-1 p-4 pb-20 md:pb-6">
          {section === 'calc' && (
            <Calculator user={user} editDevice={editDevice} onSaved={handleSaved} onCancelEdit={() => setEditDevice(null)} />
          )}
          {section === 'devices' && (
            <DevicesTable devices={devices} onEdit={handleEdit} onRefresh={loadDevices} />
          )}
          {section === 'lists' && (
            <ListsManager lists={lists} devices={devices} user={user} onRefresh={() => { loadLists(); loadDevices(); }} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-bg1 border-t border-border flex">
        {NAV.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => { setSection(id); if (id !== 'calc') setEditDevice(null); }}
              className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${active ? 'text-text1' : 'text-text3'}`}
            >
              <Icon size={20} strokeWidth={SW} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
