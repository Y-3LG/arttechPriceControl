import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ value, onChange, options, placeholder = 'Seleccionar' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selected = options.find(o => o.value === value);

  // Mobile: select nativo
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 680px)').matches) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className="select">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="select-btn" aria-expanded={open}>
        <span style={{ color: selected ? '#e8e8e8' : '#484848', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={13} strokeWidth={1.5} style={{ color: '#484848', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
      </button>

      {open && (
        <div className="select-dropdown">
          {placeholder && (
            <button className="select-option" onClick={() => { onChange(''); setOpen(false); }} data-selected={value === ''}>
              {placeholder}
            </button>
          )}
          {options.map(o => (
            <button key={o.value} className="select-option" onClick={() => { onChange(o.value); setOpen(false); }} data-selected={value === o.value}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
