import { useState, useEffect } from 'react';
import { sb, fromRow } from '../lib/supabase.js';
import PriceListView from './PriceListView.jsx';

export default function PriceListPage() {
  const [listConfig, setListConfig] = useState(null);
  const [devices, setDevices]       = useState([]);
  const [whatsapp, setWhatsapp]     = useState('');
  const [status, setStatus]         = useState('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('id');
    if (!listId) { setStatus('error'); return; }
    loadList(listId);
  }, []);

  async function loadList(listId) {
    const { data: list, error } = await sb.from('price_lists').select('*').eq('id', listId).single();
    if (error || !list) { setStatus('error'); return; }
    setListConfig(list);

    const query = sb.from('devices').select('*').eq('user_id', list.user_id).eq('available', true);
    if (list.filter_condition) query.eq('condition', list.filter_condition);
    const { data: devs, error: devErr } = await query.order('created_at', { ascending: false });
    if (devErr) { setStatus('error'); return; }

    let rows = (devs || []).map(fromRow);
    if (list.filter_brand) {
      rows = rows.filter(d => (d.name || '').split(' ')[0] === list.filter_brand);
    }
    setDevices(rows);

    const { data: prof } = await sb.from('profiles').select('whatsapp').eq('id', list.user_id).single();
    if (prof?.whatsapp) setWhatsapp(prof.whatsapp);

    setStatus('ok');
  }

  if (status === 'loading') return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <span className="spinner" style={{ width: 20, height: 20 }} />
    </div>
  );

  if (status === 'error') return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-text1 font-medium">Lista no encontrada</p>
        <p className="text-text3 text-sm mt-1">El enlace puede haber expirado o ser incorrecto.</p>
      </div>
    </div>
  );

  const now = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-bg pb-24">
      <header className="bg-bg1 border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-text1 font-semibold text-sm">ArtTech</span>
          <span className="text-text3 text-xs">Precios</span>
        </div>
        <p className="text-text3 text-xs">{now}</p>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-text1">{listConfig.title}</h1>
          <p className="text-text3 text-xs mt-0.5">{devices.length} equipos disponibles</p>
        </div>
        <PriceListView listConfig={listConfig} devices={devices} />
      </div>

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#25D366' }}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 text-white px-4 py-3 rounded-full shadow-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          💬 Consultar por WhatsApp
        </a>
      )}
    </div>
  );
}
