import { useState } from 'react';
import { Plus, ExternalLink, Copy, Pencil, Trash2 } from 'lucide-react';
import { sb } from '../lib/supabase.js';
import PriceListView from './PriceListView.jsx';
import Select from './ui/Select.jsx';

const SW = 1.5;
const COND_OPTS = [
  { value: 'NUEVO',   label: 'Nuevo'   },
  { value: 'GRADO A', label: 'Grado A' },
  { value: 'GRADO B', label: 'Grado B' },
  { value: 'GRADO C', label: 'Grado C' },
];
function getBrand(name) { return (name || '').split(' ')[0]; }
function emptyForm() {
  return { name: '', title: '', footer: '', filter_condition: '', filter_brand: '', show_initial: true, show_cuotas: true, show_price: true, discount_pct: '' };
}

export default function ListsManager({ lists, devices, user, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editList, setEditList] = useState(null);
  const [form, setForm]         = useState(emptyForm());
  const [saving, setSaving]     = useState(false);
  const [preview, setPreview]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  const brands    = [...new Set(devices.map(d => getBrand(d.name)))].filter(Boolean).sort();
  const brandOpts = brands.map(b => ({ value: b, label: b }));

  function openNew() { setForm(emptyForm()); setEditList(null); setShowForm(true); setPreview(null); }
  function openEdit(l) {
    setForm({
      name: l.name, title: l.title, footer: l.footer || '',
      filter_condition: l.filter_condition || '', filter_brand: l.filter_brand || '',
      show_initial: l.show_initial !== false, show_cuotas: l.show_cuotas !== false,
      show_price: l.show_price !== false, discount_pct: l.discount_pct ? String(l.discount_pct) : '',
    });
    setEditList(l); setShowForm(true); setPreview(null);
  }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim() || !form.title.trim()) { window.toast('Nombre y título son requeridos', true); return; }
    setSaving(true);
    const payload = { ...form, user_id: user.id, discount_pct: parseFloat(form.discount_pct) || 0 };
    const err = editList
      ? (await sb.from('price_lists').update(payload).eq('id', editList.id)).error
      : (await sb.from('price_lists').insert(payload)).error;
    setSaving(false);
    if (err) { window.toast(err.message, true); return; }
    window.toast(editList ? 'Lista actualizada' : 'Lista creada');
    setShowForm(false); onRefresh?.();
  }

  async function handleDelete(l) {
    if (!confirm(`¿Eliminar "${l.name}"?`)) return;
    setDeleting(l.id);
    const { error } = await sb.from('price_lists').delete().eq('id', l.id);
    setDeleting(null);
    if (error) { window.toast(error.message, true); return; }
    window.toast('Lista eliminada');
    if (preview?.id === l.id) setPreview(null);
    onRefresh?.();
  }

  function copyLink(l) {
    navigator.clipboard.writeText(`${window.location.origin}/lista?id=${l.id}`)
      .then(() => window.toast('Link copiado'));
  }

  function getListDevices(l) {
    return devices.filter(d => {
      if (!d.available) return false;
      if (l.filter_condition && d.condition !== l.filter_condition) return false;
      if (l.filter_brand && getBrand(d.name) !== l.filter_brand) return false;
      return true;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text3 text-sm">{lists.length} lista{lists.length !== 1 ? 's' : ''}</p>
        <button className="btn-primary gap-1.5" onClick={openNew}>
          <Plus size={14} strokeWidth={SW} /> Nueva lista
        </button>
      </div>

      {showForm && (
        <div className="card space-y-3">
          <h3 className="section-title">{editList ? 'Editar lista' : 'Nueva lista'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre interno *</label>
              <input className="input" placeholder="Mi lista premium" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Título público *</label>
              <input className="input" placeholder="Lista de Precios Junio" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Filtrar por condición</label>
              <Select value={form.filter_condition} onChange={v => set('filter_condition', v)} options={COND_OPTS} placeholder="Todas" />
            </div>
            <div>
              <label className="label">Filtrar por marca</label>
              <Select value={form.filter_brand} onChange={v => set('filter_brand', v)} options={brandOpts} placeholder="Todas" />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <label className="chk-label">
              <input type="checkbox" checked={form.show_initial} onChange={e => set('show_initial', e.target.checked)} />
              Monto inicial
            </label>
            <label className="chk-label">
              <input type="checkbox" checked={form.show_cuotas} onChange={e => set('show_cuotas', e.target.checked)} />
              Cuotas
            </label>
            <label className="chk-label">
              <input type="checkbox" checked={form.show_price} onChange={e => set('show_price', e.target.checked)} />
              Precio total
            </label>
          </div>

          <div>
            <label className="label">Descuento de promoción (%)</label>
            <input className="input" type="number" onWheel={e => e.target.blur()} placeholder="0" min="0" max="100"
              value={form.discount_pct} onChange={e => set('discount_pct', e.target.value)} />
            <p className="text-text3 text-xs mt-1">Dejar en 0 para no aplicar descuento.</p>
          </div>

          <div>
            <label className="label">Nota al pie</label>
            <input className="input" placeholder="Precios sujetos a cambio…" value={form.footer} onChange={e => set('footer', e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button className="btn-primary gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {editList ? 'Guardar cambios' : 'Crear lista'}
            </button>
            <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {lists.length === 0 && !showForm ? (
        <div className="card text-center py-8">
          <p className="text-text3 text-sm">No tienes listas aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(l => (
            <div key={l.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-text1 text-sm">{l.name}</p>
                  <p className="text-text3 text-xs mt-0.5">"{l.title}"</p>
                  <p className="text-text3 text-xs mt-0.5">
                    {getListDevices(l).length} equipos
                    {l.filter_condition ? ` · ${l.filter_condition}` : ''}
                    {l.filter_brand ? ` · ${l.filter_brand}` : ''}
                    {l.discount_pct > 0 ? ` · ${l.discount_pct}% dto` : ''}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  <button className="btn gap-1.5 py-1 px-2 text-xs" onClick={() => setPreview(preview?.id === l.id ? null : l)}>
                    <ExternalLink size={11} strokeWidth={SW} />
                    {preview?.id === l.id ? 'Cerrar' : 'Previa'}
                  </button>
                  <button className="btn gap-1.5 py-1 px-2 text-xs" onClick={() => copyLink(l)}>
                    <Copy size={11} strokeWidth={SW} /> Link
                  </button>
                  <button className="btn gap-1.5 py-1 px-2 text-xs" onClick={() => openEdit(l)}>
                    <Pencil size={11} strokeWidth={SW} /> Editar
                  </button>
                  <button className="btn-danger gap-1.5 py-1 px-2 text-xs" onClick={() => handleDelete(l)} disabled={deleting === l.id}>
                    {deleting === l.id ? <span className="spinner" /> : <Trash2 size={11} strokeWidth={SW} />}
                    Eliminar
                  </button>
                </div>
              </div>

              {preview?.id === l.id && (
                <div className="border-t border-border pt-3">
                  <p className="text-text3 text-xs mb-3">Vista previa — {l.title}</p>
                  <PriceListView listConfig={l} devices={getListDevices(l)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
