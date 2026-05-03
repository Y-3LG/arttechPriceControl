import { useState, useMemo } from 'react';

const CONDITION_ORDER = ['NUEVO', 'GRADO A', 'GRADO B', 'GRADO C'];
const CONDITION_MAP   = {
  'NUEVO':   'badge-nuevo',
  'GRADO A': 'badge-a',
  'GRADO B': 'badge-b',
  'GRADO C': 'badge-c',
};

function fmt(n) { return `$${parseFloat(n || 0).toFixed(2)}`; }

function getBrand(name) { return (name || '').split(' ')[0]; }

export default function PriceListView({ listConfig, devices }) {
  const [search, setSearch]         = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [sortDir, setSortDir]       = useState(null); // null | 'asc' | 'desc'

  const brands = useMemo(() => {
    const set = new Set(devices.map(d => getBrand(d.name)));
    return [...set].filter(Boolean).sort();
  }, [devices]);

  const filtered = useMemo(() => {
    let list = devices.filter(d => {
      const q = search.toLowerCase();
      const matchQ = !q || d.name.toLowerCase().includes(q) || (d.memory || '').toLowerCase().includes(q);
      const matchB = !brandFilter || getBrand(d.name) === brandFilter;
      return matchQ && matchB;
    });

    if (sortDir === 'asc')  return [...list].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sortDir === 'desc') return [...list].sort((a, b) => b.finalPrice - a.finalPrice);
    return list;
  }, [devices, search, brandFilter, sortDir]);

  // Group by condition when no sort
  const grouped = useMemo(() => {
    if (sortDir) return null;
    const map = {};
    CONDITION_ORDER.forEach(c => {
      const items = filtered.filter(d => d.condition === c);
      if (items.length > 0) map[c] = items;
    });
    return map;
  }, [filtered, sortDir]);

  function cycleSortDir() {
    setSortDir(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
  }

  const sortIcon = sortDir === 'asc' ? '↑' : sortDir === 'desc' ? '↓' : '↕';

  const showInitial = listConfig?.show_initial !== false;
  const showCuotas  = listConfig?.show_cuotas  !== false;

  function renderRows(list) {
    return list.map(d => (
      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-bg3/30 transition-colors">
        <td className="px-4 py-3">
          <p className="font-medium text-text1 text-sm leading-tight">{d.name}{d.memory ? ` ${d.memory}` : ''}</p>
          {d.desc && <p className="text-text3 text-xs mt-0.5">{d.desc}</p>}
        </td>
        {showInitial && (
          <td className="px-3 py-3 text-right font-mono text-text2 text-sm whitespace-nowrap">
            {fmt(d.initialAmt)}
          </td>
        )}
        {showCuotas && (
          <td className="px-3 py-3 text-right font-mono text-text2 text-sm whitespace-nowrap">
            {d.installments}x {fmt(d.installAmt)}
          </td>
        )}
        <td className="px-4 py-3 text-right font-mono text-accent font-bold text-sm whitespace-nowrap">
          {fmt(d.finalPrice)}
        </td>
      </tr>
    ));
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="input flex-1 min-w-[180px]"
          placeholder="Buscar…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {brands.length > 1 && (
          <select className="select w-auto" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b}>{b}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-text3 text-sm text-center py-8">Sin equipos disponibles.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text3 text-xs">
                <th className="text-left px-4 py-3 font-medium">Equipo</th>
                {showInitial && <th className="text-right px-3 py-3 font-medium">Inicial</th>}
                {showCuotas  && <th className="text-right px-3 py-3 font-medium">Cuotas</th>}
                <th className="text-right px-4 py-3 font-medium">
                  <button
                    onClick={cycleSortDir}
                    className="inline-flex items-center gap-1 hover:text-text1 transition-colors"
                  >
                    Precio <span className="text-accent">{sortIcon}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortDir ? (
                renderRows(filtered)
              ) : (
                Object.entries(grouped).map(([cond, items]) => (
                  <>
                    <tr key={`group-${cond}`} className="bg-bg2/40">
                      <td colSpan={1 + (showInitial ? 1 : 0) + (showCuotas ? 1 : 0) + 1} className="px-4 py-1.5">
                        <span className={CONDITION_MAP[cond] || 'badge'}>{cond}</span>
                      </td>
                    </tr>
                    {renderRows(items)}
                  </>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {listConfig?.footer && (
        <p className="text-text3 text-xs text-center pt-2">{listConfig.footer}</p>
      )}
    </div>
  );
}
