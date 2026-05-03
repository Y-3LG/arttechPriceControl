import { useState, useMemo } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const SW = 1.5;
const fmt = n => `$${parseFloat(n || 0).toFixed(2)}`;

const COND_CLASS = { 'NUEVO': 'badge-nuevo', 'GRADO A': 'badge-a', 'GRADO B': 'badge-b', 'GRADO C': 'badge-c' };
function getBrand(name) { return (name || '').split(' ')[0]; }

export default function PriceListView({ listConfig, devices }) {
  const [q, setQ]           = useState('');
  const [brand, setBrand]   = useState('');
  const [sort, setSort]     = useState(null); // null | 'asc' | 'desc'

  const showInitial = listConfig?.show_initial !== false;
  const showCuotas  = listConfig?.show_cuotas  !== false;
  const showPrice   = listConfig?.show_price   !== false;
  const discountPct = parseFloat(listConfig?.discount_pct) || 0;
  const hasDiscount = discountPct > 0;

  const brands = useMemo(() => [...new Set(devices.map(d => getBrand(d.name)))].filter(Boolean).sort(), [devices]);

  const filtered = useMemo(() => {
    let list = devices.filter(d => {
      const lq = q.toLowerCase();
      const matchQ = !lq || d.name.toLowerCase().includes(lq) || (d.memory || '').toLowerCase().includes(lq);
      const matchB = !brand || getBrand(d.name) === brand;
      return matchQ && matchB;
    });
    if (sort === 'asc')  return [...list].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === 'desc') return [...list].sort((a, b) => b.finalPrice - a.finalPrice);
    // Default: created_at desc (devices already come sorted that way from DB)
    return list;
  }, [devices, q, brand, sort]);

  function cycleSort() {
    setSort(prev => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
  }

  function renderRows(list) {
    return list.map(d => {
      const dp  = hasDiscount ? d.finalPrice  * (1 - discountPct / 100) : d.finalPrice;
      const di  = hasDiscount ? d.initialAmt  * (1 - discountPct / 100) : d.initialAmt;
      const dq  = hasDiscount ? d.installAmt  * (1 - discountPct / 100) : d.installAmt;
      const mem = d.memory || [d.ram, d.rom].filter(Boolean).join('/');
      const nameStr = d.name + (mem ? ` ${mem}` : '');

      return (
        <tr key={d.id} className="border-b border-border last:border-0 hover:bg-bg3/20 transition-colors">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-text1 text-sm">{nameStr}</span>
              <span className={COND_CLASS[d.condition] || 'badge'}>{d.condition}</span>
            </div>
            {d.desc && <p className="text-text3 text-xs mt-0.5">{d.desc}</p>}
          </td>
          {showInitial && (
            <td className="px-3 py-3 text-right font-mono text-text2 text-sm whitespace-nowrap">
              {fmt(di)}
            </td>
          )}
          {showCuotas && (
            <td className="px-3 py-3 text-right font-mono text-text2 text-sm whitespace-nowrap">
              {d.installments}x {fmt(dq)}
            </td>
          )}
          {showPrice && (
            <td className="px-4 py-3 text-right whitespace-nowrap">
              {hasDiscount && <span className="oferta-tag">OFERTA</span>}
              <span className="font-mono font-semibold text-accent text-sm">{fmt(dp)}</span>
              {hasDiscount && <span className="original-price">{fmt(d.finalPrice)}</span>}
            </td>
          )}
        </tr>
      );
    });
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={13} strokeWidth={SW} className="filter-icon" />
          <input placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {brands.length > 1 && (
          <>
            <div className="filter-divider" />
            <select className="filter-select" value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="">Marca</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </>
        )}

        <div className="filter-divider" />
        <button className={`filter-sort-btn ${sort ? 'active' : ''}`} onClick={cycleSort}>
          {sort === 'asc' ? <ArrowUp size={13} strokeWidth={SW} /> : sort === 'desc' ? <ArrowDown size={13} strokeWidth={SW} /> : <ArrowUpDown size={13} strokeWidth={SW} />}
          <span>Precio</span>
        </button>
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
                {showPrice   && <th className="text-right px-4 py-3 font-medium">Precio</th>}
              </tr>
            </thead>
            <tbody>{renderRows(filtered)}</tbody>
          </table>
        )}
      </div>

      {listConfig?.footer && (
        <p className="text-text3 text-xs text-center pt-4">{listConfig.footer}</p>
      )}
    </div>
  );
}
