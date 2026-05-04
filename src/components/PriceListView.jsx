import { useState, useMemo } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Select from './ui/Select.jsx';

const SW = 1.5;
const COND_CLASS = { 'NUEVO':'nuevo','GRADO A':'a','GRADO B':'b','GRADO C':'c' };
function getBrand(name) { return (name || '').split(' ')[0]; }

function PriceRow({ d, listConfig }) {
  const { show_initial, show_cuotas, show_price, discount_pct } = listConfig || {};
  const hasDiscount = (discount_pct || 0) > 0;
  const disc = 1 - (discount_pct || 0) / 100;
  const finalPrice   = d.finalPrice  * disc;
  const finalInitial = d.initialAmt  * disc;
  const finalInstall = d.installAmt  * disc;
  const condClass = COND_CLASS[d.condition] || 'c';
  const mem = d.memory || [d.ram, d.rom].filter(Boolean).join('/');
  const showOfertaOnInitial = hasDiscount && !show_price && show_initial;

  return (
    <div className="pub-row">
      <div className="pub-row-left">
        <div className="pub-row-name">
          {d.name}{mem ? ` ${mem}` : ''}
          <span className={`pub-badge pub-badge-${condClass}`}>{d.condition}</span>
        </div>
        {d.desc && <div className="pub-row-desc">{d.desc}</div>}
      </div>

      <div className="pub-row-right">
        {show_initial && (
          <div className="pub-price-item">
            <span className="pub-price-lbl">
              {showOfertaOnInitial && <span className="oferta-tag">OFERTA</span>}
              Inicial {Math.round(d.initialPct || 0)}%
            </span>
            <span className="pub-price-val-sm">
              ${finalInitial.toFixed(2)}
              {hasDiscount && !showOfertaOnInitial && (
                <span className="original-price">${d.initialAmt.toFixed(2)}</span>
              )}
            </span>
          </div>
        )}

        {show_cuotas && (
          <div className="pub-price-item">
            <span className="pub-price-lbl">{d.installments} cuotas</span>
            <span className="pub-price-val-sm">${finalInstall.toFixed(2)}</span>
          </div>
        )}

        {show_price && (
          <div className="pub-price-item pub-price-item--main">
            <span className="pub-price-lbl">
              {hasDiscount && <span className="oferta-tag">OFERTA</span>}
              Precio
            </span>
            <span className="pub-price-val">
              ${finalPrice.toFixed(2)}
              {hasDiscount && <span className="original-price">${d.finalPrice.toFixed(2)}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PriceListView({ listConfig, devices }) {
  const [q, setQ]         = useState('');
  const [brand, setBrand] = useState('');
  const [sort, setSort]   = useState(null);

  const brands = useMemo(() => [...new Set(devices.map(d => getBrand(d.name)))].filter(Boolean).sort(), [devices]);
  const brandOpts = brands.map(b => ({ value: b, label: b }));

  const filtered = useMemo(() => {
    let list = devices.filter(d => {
      const lq = q.toLowerCase();
      return (!lq || d.name.toLowerCase().includes(lq) || (d.memory || '').toLowerCase().includes(lq))
        && (!brand || getBrand(d.name) === brand);
    });
    if (sort === 'asc')  return [...list].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === 'desc') return [...list].sort((a, b) => b.finalPrice - a.finalPrice);
    return list;
  }, [devices, q, brand, sort]);

  function cycleSort() { setSort(s => s === null ? 'asc' : s === 'asc' ? 'desc' : null); }

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
        <button className={`filter-sort-btn${sort ? ' active' : ''}`} onClick={cycleSort}>
          {sort === 'asc' ? <ArrowUp size={13} strokeWidth={SW} /> : sort === 'desc' ? <ArrowDown size={13} strokeWidth={SW} /> : <ArrowUpDown size={13} strokeWidth={SW} />}
          <span>Precio</span>
        </button>
      </div>

      {/* List */}
      <div className="card p-0">
        {filtered.length === 0
          ? <p className="text-text3 text-sm text-center py-8">Sin equipos disponibles.</p>
          : <div className="px-4">{filtered.map(d => <PriceRow key={d.id} d={d} listConfig={listConfig} />)}</div>
        }
      </div>

      {listConfig?.footer && <p className="text-text3 text-xs text-center pt-4">{listConfig.footer}</p>}
    </div>
  );
}
