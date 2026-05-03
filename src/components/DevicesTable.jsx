import { useState } from 'react';
import { sb } from '../lib/supabase.js';

const CONDITION_MAP = {
  'NUEVO':   'badge-nuevo',
  'GRADO A': 'badge-a',
  'GRADO B': 'badge-b',
  'GRADO C': 'badge-c',
};

function fmt(n) { return `$${parseFloat(n || 0).toFixed(2)}`; }

export default function DevicesTable({ devices, onEdit, onRefresh }) {
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || (d.memory || '').toLowerCase().includes(q);
  });

  const total       = devices.length;
  const disponibles = devices.filter(d => d.available).length;
  const categories  = [...new Set(devices.map(d => d.condition))].length;

  async function handleDelete(d) {
    if (!confirm(`¿Eliminar "${d.name}"?`)) return;
    setDeleting(d.id);
    const { error } = await sb.from('devices').delete().eq('id', d.id);
    setDeleting(null);
    if (error) { window.toast(error.message, true); return; }
    window.toast('Equipo eliminado');
    onRefresh && onRefresh();
  }

  async function handleToggle(d) {
    setToggling(d.id);
    const { error } = await sb.from('devices').update({ available: !d.available }).eq('id', d.id);
    setToggling(null);
    if (error) { window.toast(error.message, true); return; }
    onRefresh && onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',       value: total },
          { label: 'Disponibles', value: disponibles },
          { label: 'Categorías',  value: categories },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-bold text-text1">{s.value}</p>
            <p className="text-text3 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        className="input"
        placeholder="Buscar por nombre o memoria…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-text3 text-sm text-center py-8">
            {devices.length === 0 ? 'Aún no tienes equipos. ¡Agrega uno desde la calculadora!' : 'Sin resultados.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text3 text-xs">
                <th className="text-left px-4 py-3 font-medium">Equipo</th>
                <th className="text-left px-3 py-3 font-medium">Condición</th>
                <th className="text-right px-3 py-3 font-medium">Precio</th>
                <th className="text-right px-3 py-3 font-medium hidden sm:table-cell">Inicial</th>
                <th className="text-right px-3 py-3 font-medium hidden sm:table-cell">Cuota</th>
                <th className="text-center px-3 py-3 font-medium">Disp.</th>
                <th className="text-center px-3 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d.id}
                  className={`border-b border-border last:border-0 hover:bg-bg3/40 transition-colors ${!d.available ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text1 leading-tight">{d.name}</p>
                    {d.memory && <p className="text-text3 text-xs">{d.memory}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={CONDITION_MAP[d.condition] || 'badge'}>{d.condition}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-accent font-medium">
                    {fmt(d.finalPrice)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-text2 hidden sm:table-cell">
                    {fmt(d.initialAmt)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-text2 hidden sm:table-cell">
                    {fmt(d.installAmt)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleToggle(d)}
                      disabled={toggling === d.id}
                      className={`w-8 h-5 rounded-full transition-colors relative ${d.available ? 'bg-accent' : 'bg-border2'}`}
                      title={d.available ? 'Disponible' : 'No disponible'}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-bg rounded-full shadow transition-all ${d.available ? 'left-3.5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        className="btn-ghost py-1 px-2 text-xs"
                        onClick={() => onEdit && onEdit(d)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger py-1 px-2 text-xs"
                        onClick={() => handleDelete(d)}
                        disabled={deleting === d.id}
                      >
                        {deleting === d.id ? <span className="spinner" /> : 'Borrar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
