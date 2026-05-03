import { useState } from 'react';
import { sb } from '../lib/supabase.js';
import PriceListView from './PriceListView.jsx';

const CONDITIONS = ['NUEVO', 'GRADO A', 'GRADO B', 'GRADO C'];

function getBrand(name) { return (name || '').split(' ')[0]; }

function emptyForm() {
  return { name: '', title: '', footer: '', filter_condition: '', filter_brand: '', show_initial: true, show_cuotas: true };
}

export default function ListsManager({ lists, devices, user, onRefresh }) {
  const [showForm, setShowForm]     = useState(false);
  const [editList, setEditList]     = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [preview, setPreview]       = useState(null); // listConfig for preview
  const [deleting, setDeleting]     = useState(null);

  const brands = [...new Set(devices.map(d => getBrand(d.name)))].filter(Boolean).sort();

  function openNew() {
    setForm(emptyForm());
    setEditList(null);
    setShowForm(true);
    setPreview(null);
  }

  function openEdit(l) {
    setForm({
      name: l.name, title: l.title, footer: l.footer || '',
      filter_condition: l.filter_condition || '',
      filter_brand: l.filter_brand || '',
      show_initial: l.show_initial !== false,
      show_cuotas:  l.show_cuotas  !== false,
    });
    setEditList(l);
    setShowForm(true);
    setPreview(null);
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.name.trim() || !form.title.trim()) {
      window.toast('Nombre interno y título público son requeridos', true);
      return;
    }
    setSaving(true);
    const payload = { ...form, user_id: user.id };
    let err;
    if (editList) {
      const res = await sb.from('price_lists').update(payload).eq('id', editList.id);
      err = res.error;
    } else {
      const res = await sb.from('price_lists').insert(payload);
      err = res.error;
    }
    setSaving(false);
    if (err) { window.toast(err.message, true); return; }
    window.toast(editList ? 'Lista actualizada' : 'Lista creada');
    setShowForm(false);
    onRefresh && onRefresh();
  }

  async function handleDelete(l) {
    if (!confirm(`¿Eliminar la lista "${l.name}"?`)) return;
    setDeleting(l.id);
    const { error } = await sb.from('price_lists').delete().eq('id', l.id);
    setDeleting(null);
    if (error) { window.toast(error.message, true); return; }
    window.toast('Lista eliminada');
    if (preview?.id === l.id) setPreview(null);
    onRefresh && onRefresh();
  }

  function copyLink(l) {
    const url = `${window.location.origin}/lista?id=${l.id}`;
    navigator.clipboard.writeText(url).then(() => window.toast('Link copiado'));
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
        <p className="text-text2 text-sm">{lists.length} lista{lists.length !== 1 ? 's' : ''}</p>
        <button className="btn-primary" onClick={openNew}>+ Nueva lista</button>
      </div>

      {/* Form */}
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
              <select className="select" value={form.filter_condition} onChange={e => set('filter_condition', e.target.value)}>
                <option value="">Todas</option>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Filtrar por marca</label>
              <select className="select" value={form.filter_brand} onChange={e => set('filter_brand', e.target.value)}>
                <option value="">Todas</option>
                {brands.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="chk-label">
              <input type="checkbox" checked={form.show_initial} onChange={e => set('show_initial', e.target.checked)} />
              Mostrar columna Inicial
            </label>
            <label className="chk-label">
              <input type="checkbox" checked={form.show_cuotas} onChange={e => set('show_cuotas', e.target.checked)} />
              Mostrar columna Cuotas
            </label>
          </div>

          <div>
            <label className="label">Nota al pie</label>
            <input className="input" placeholder="Precios sujetos a cambio sin previo aviso" value={form.footer} onChange={e => set('footer', e.target.value)} />
          </div>

          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {editList ? 'Guardar cambios' : 'Crear lista'}
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 && !showForm ? (
        <div className="card text-center py-8">
          <p className="text-text3 text-sm">No tienes listas aún.</p>
          <p className="text-text3 text-xs mt-1">Crea una para compartir tu catálogo con clientes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(l => (
            <div key={l.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-text1">{l.name}</p>
                  <p className="text-text3 text-xs mt-0.5">"{l.title}"</p>
                  <p className="text-text3 text-xs mt-0.5">
                    {getListDevices(l).length} equipos
                    {l.filter_condition ? ` · ${l.filter_condition}` : ''}
                    {l.filter_brand ? ` · ${l.filter_brand}` : ''}
                  </p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  <button className="btn-ghost py-1 px-2 text-xs" onClick={() => setPreview(preview?.id === l.id ? null : l)}>
                    {preview?.id === l.id ? 'Cerrar' : 'Vista previa'}
                  </button>
                  <button className="btn-ghost py-1 px-2 text-xs" onClick={() => copyLink(l)}>
                    Copiar link
                  </button>
                  <button className="btn-ghost py-1 px-2 text-xs" onClick={() => openEdit(l)}>
                    Editar
                  </button>
                  <button className="btn-danger py-1 px-2 text-xs" onClick={() => handleDelete(l)} disabled={deleting === l.id}>
                    {deleting === l.id ? <span className="spinner" /> : 'Eliminar'}
                  </button>
                </div>
              </div>

              {preview?.id === l.id && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-text3 mb-3">Vista previa — {l.title}</p>
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
