import { useState, useEffect } from 'react';
import { sb, fromRow } from '../lib/supabase.js';
import PriceListView from './PriceListView.jsx';

export default function PriceListPage() {
  const [listConfig, setListConfig] = useState(null);
  const [devices, setDevices]       = useState([]);
  const [whatsapp, setWhatsapp]     = useState('');
  const [status, setStatus]         = useState('loading'); // loading | ok | error

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('id');
    if (!listId) { setStatus('error'); return; }
    loadList(listId);
  }, []);

  async function loadList(listId) {
    // Load list config (public read policy)
    const { data: list, error: listErr } = await sb
      .from('price_lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (listErr || !list) { setStatus('error'); return; }
    setListConfig(list);

    // Load available devices for that user (public_select policy)
    const query = sb
      .from('devices')
      .select('*')
      .eq('user_id', list.user_id)
      .eq('available', true);

    if (list.filter_condition) query.eq('condition', list.filter_condition);

    const { data: devs, error: devErr } = await query.order('name');
    if (devErr) { setStatus('error'); return; }

    let rows = (devs || []).map(fromRow);

    // Brand filter (client-side since it's first word of name)
    if (list.filter_brand) {
      rows = rows.filter(d => (d.name || '').split(' ')[0] === list.filter_brand);
    }

    setDevices(rows);

    // Load WhatsApp from profile
    const { data: prof } = await sb.from('profiles').select('whatsapp').eq('id', list.user_id).single();
    if (prof?.whatsapp) setWhatsapp(prof.whatsapp);

    setStatus('ok');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="spinner" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-text1 font-medium">Lista no encontrada</p>
          <p className="text-text3 text-sm mt-1">El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const now = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Topbar */}
      <header className="bg-bg1 border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-base">ArtTech</span>
          <span className="text-text3 text-xs">Precios</span>
        </div>
        <p className="text-text3 text-xs">Actualizado: {now}</p>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-text1">{listConfig.title}</h1>
          <p className="text-text3 text-xs mt-0.5">{devices.length} equipos disponibles</p>
        </div>
        <PriceListView listConfig={listConfig} devices={devices} />
      </div>

      {/* WhatsApp FAB */}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#1ebe5d] transition-colors text-sm font-medium"
        >
          💬 Consultar por WhatsApp
        </a>
      )}
    </div>
  );
}
