import { useState, useEffect } from 'react';
import { Copy, Check, X } from 'lucide-react';
import { sb, toRow } from '../lib/supabase.js';

const RAM_OPTIONS = ['2GB','3GB','4GB','6GB','8GB','12GB','16GB'];
const ROM_OPTIONS = ['64GB','128GB','256GB','512GB','1TB','2TB'];
const CONDITIONS  = ['NUEVO','GRADO A','GRADO B','GRADO C'];
const PERIODS     = ['QUINCENALES','MENSUALES'];
const SW = 1.5;

function calcResults(cost, gainPct, initialPct, installments, manualPrice) {
  let finalPrice = manualPrice != null ? manualPrice : 0;
  if (manualPrice == null) {
    const gain = parseFloat(gainPct) || 0;
    const c    = parseFloat(cost)    || 0;
    finalPrice = c > 0 ? c * (1 + gain / 100) : 0;
  }
  const initialAmt = finalPrice * (parseFloat(initialPct) / 100);
  const remaining  = finalPrice - initialAmt;
  const n          = parseInt(installments) || 1;
  const installAmt = remaining / n;
  return { finalPrice, initialAmt, installAmt };
}

function buildMsg(device) {
  const mem = device.memory || [device.ram, device.rom].filter(Boolean).join('/');
  let line1 = device.name.toUpperCase();
  if (mem) line1 += ` ${mem}`;
  const lines = [line1, device.condition, ''];
  if (device.initialAmt > 0)
    lines.push(`INICIAL ${Math.round(device.initialPct)}%: $${device.initialAmt.toFixed(2)}`);
  if (device.installments > 0)
    lines.push(`+ ${device.installments} CUOTAS ${device.period} DE: $${device.installAmt.toFixed(2)}`);
  return lines.join('\n');
}

export default function Calculator({ user, editDevice, onSaved, onCancelEdit }) {
  const isEdit = !!editDevice;

  const [name, setName]           = useState('');
  const [ramSel, setRamSel]       = useState('8GB');
  const [ramCustom, setRamCustom] = useState('');
  const [romSel, setRomSel]       = useState('256GB');
  const [romCustom, setRomCustom] = useState('');
  const [condition, setCondition] = useState('GRADO A');
  const [desc, setDesc]           = useState('');
  const [currency, setCurrency]   = useState('USD');
  const [rate, setRate]           = useState('');
  const [cost, setCost]           = useState('');
  const [gainPct, setGainPct]     = useState('30');
  const [initialPct, setInitialPct] = useState('30');
  const [installments, setInstallments] = useState('6');
  const [period, setPeriod]       = useState('QUINCENALES');
  const [manualPrice, setManualPrice] = useState('');
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);

  const ram    = ramSel === '__otro__' ? ramCustom : ramSel;
  const rom    = romSel === '__otro__' ? romCustom : romSel;
  const memory = ram && rom ? `${ram}/${rom}` : (ram || rom || '');

  const costUsd = currency === 'Bs' && rate
    ? (parseFloat(cost) || 0) / (parseFloat(rate) || 1)
    : (parseFloat(cost) || 0);

  const hasManual = manualPrice !== '' && !isNaN(parseFloat(manualPrice));
  const { finalPrice, initialAmt, installAmt } = calcResults(
    costUsd, gainPct, initialPct, installments, hasManual ? parseFloat(manualPrice) : null
  );

  const device = {
    name, ram, rom, memory, condition, desc, finalPrice,
    initialPct: parseFloat(initialPct), initialAmt,
    installments: parseInt(installments), installAmt, period, available: true, msg: ''
  };
  device.msg = buildMsg(device);

  useEffect(() => {
    if (!editDevice) { resetForm(); return; }
    const d = editDevice;
    setName(d.name || '');
    const r = d.ram || '';
    if (RAM_OPTIONS.includes(r)) { setRamSel(r); setRamCustom(''); } else { setRamSel('__otro__'); setRamCustom(r); }
    const ro = d.rom || '';
    if (ROM_OPTIONS.includes(ro)) { setRomSel(ro); setRomCustom(''); } else { setRomSel('__otro__'); setRomCustom(ro); }
    setCondition(d.condition || 'GRADO A');
    setDesc(d.desc || '');
    setGainPct('30');
    setInitialPct(String(d.initialPct || 30));
    setInstallments(String(d.installments || 6));
    setPeriod(d.period || 'QUINCENALES');
    setManualPrice(String(d.finalPrice || ''));
    setCost(''); setCurrency('USD'); setRate('');
  }, [editDevice]);

  function resetForm() {
    setName(''); setRamSel('8GB'); setRamCustom('');
    setRomSel('256GB'); setRomCustom(''); setCondition('GRADO A'); setDesc('');
    setCurrency('USD'); setRate(''); setCost(''); setGainPct('30');
    setInitialPct('30'); setInstallments('6'); setPeriod('QUINCENALES'); setManualPrice('');
  }

  async function handleSave(asVariant = false) {
    if (!name.trim()) { window.toast('El nombre es obligatorio', true); return; }
    if (finalPrice <= 0) { window.toast('El precio debe ser mayor a 0', true); return; }
    setLoading(true);
    const row = toRow(device, user.id);
    let err;
    if (isEdit && !asVariant) {
      err = (await sb.from('devices').update(row).eq('id', editDevice.id)).error;
    } else {
      err = (await sb.from('devices').insert(row)).error;
    }
    setLoading(false);
    if (err) { window.toast(err.message, true); return; }
    window.toast(asVariant ? 'Variante creada' : isEdit ? 'Equipo actualizado' : 'Equipo guardado');
    onSaved && onSaved();
    if (!isEdit) resetForm();
  }

  function copyMsg() {
    navigator.clipboard.writeText(device.msg).then(() => {
      setCopied(true);
      window.toast('Mensaje copiado');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const condBtnStyle = (c) => ({
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    border: `1px solid ${condition === c ? 'rgba(200,255,0,0.4)' : '#2a2a2a'}`,
    color: condition === c ? '#c8ff00' : '#888888',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    fontFamily: 'DM Sans, sans-serif',
  });

  return (
    <div className="space-y-4">
      {isEdit && (
        <div className="edit-banner">
          <div>
            <div className="edit-banner-text">✏ Editando: {editDevice.name}</div>
            {editDevice.memory && <div className="edit-banner-sub">{editDevice.memory}</div>}
          </div>
          <button className="btn gap-1.5 text-xs py-1.5" onClick={onCancelEdit}>
            <X size={12} strokeWidth={SW} /> Descartar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left */}
        <div className="space-y-3">
          <div>
            <label className="label">Nombre / Modelo *</label>
            <input className="input" placeholder="Samsung Galaxy S25" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">RAM</label>
              <select className="select" value={ramSel} onChange={e => setRamSel(e.target.value)}>
                {RAM_OPTIONS.map(o => <option key={o}>{o}</option>)}
                <option value="__otro__">Otra…</option>
              </select>
              {ramSel === '__otro__' && <input className="input mt-1" placeholder="Ej: 6GB" value={ramCustom} onChange={e => setRamCustom(e.target.value)} />}
            </div>
            <div>
              <label className="label">ROM</label>
              <select className="select" value={romSel} onChange={e => setRomSel(e.target.value)}>
                {ROM_OPTIONS.map(o => <option key={o}>{o}</option>)}
                <option value="__otro__">Otra…</option>
              </select>
              {romSel === '__otro__' && <input className="input mt-1" placeholder="Ej: 128GB" value={romCustom} onChange={e => setRomCustom(e.target.value)} />}
            </div>
          </div>

          <div>
            <label className="label">Condición</label>
            <div className="flex gap-2 flex-wrap">
              {CONDITIONS.map(c => (
                <button key={c} style={condBtnStyle(c)} onClick={() => setCondition(c)}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Descripción adicional</label>
            <input className="input" placeholder="Opcional" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div>
            <label className="label">Moneda del costo</label>
            <div className="flex gap-2">
              {['USD','Bs'].map(c => (
                <button key={c}
                  onClick={() => setCurrency(c)}
                  style={{
                    padding: '5px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: `1px solid ${currency === c ? 'rgba(200,255,0,0.4)' : '#2a2a2a'}`,
                    color: currency === c ? '#c8ff00' : '#888888',
                    background: 'transparent', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >{c}</button>
              ))}
            </div>
          </div>

          {currency === 'Bs' && (
            <div>
              <label className="label">Tasa del día (Bs/USD)</label>
              <input className="input" type="number" placeholder="Ej: 90.5" value={rate} onChange={e => setRate(e.target.value)} />
              {rate && cost && (
                <p className="text-text3 text-xs mt-1">≈ ${costUsd.toFixed(2)} USD</p>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-3">
          <div>
            <label className="label">Precio de costo ({currency})</label>
            <input className="input" type="number" placeholder="0.00" value={cost}
              onChange={e => { setCost(e.target.value); setManualPrice(''); }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Ganancia %</label>
              <input className="input" type="number" placeholder="30" value={gainPct}
                onChange={e => { setGainPct(e.target.value); setManualPrice(''); }} />
            </div>
            <div>
              <label className="label">Inicial %</label>
              <input className="input" type="number" placeholder="30" value={initialPct}
                onChange={e => setInitialPct(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">N° cuotas</label>
              <input className="input" type="number" placeholder="6" value={installments}
                onChange={e => setInstallments(e.target.value)} />
            </div>
            <div>
              <label className="label">Período</label>
              <select className="select" value={period} onChange={e => setPeriod(e.target.value)}>
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Ajuste manual de precio</label>
            <input className="input" type="number" placeholder="Precio final (USD)"
              value={manualPrice} onChange={e => setManualPrice(e.target.value)} />
          </div>

          {/* Result box */}
          <div className="result-box space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-text3 text-xs">Precio final</span>
              <span className="result-big">${finalPrice.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-xs">
              <span className="text-text3">Inicial ({initialPct}%)</span>
              <span className="text-text2 font-mono">${initialAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text3">{installments} cuotas {period.toLowerCase()}</span>
              <span className="text-text2 font-mono">${installAmt.toFixed(2)}</span>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label">Mensaje para cliente</label>
              <button className="btn gap-1.5 py-1 px-2 text-xs" onClick={copyMsg}>
                {copied ? <Check size={11} strokeWidth={SW} /> : <Copy size={11} strokeWidth={SW} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="msg-box">{device.msg}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 flex-wrap">
        <button className="btn-primary" onClick={() => handleSave(false)} disabled={loading}>
          {loading ? <span className="spinner" /> : <Check size={14} strokeWidth={SW} />}
          {isEdit ? 'Guardar cambios' : 'Guardar equipo'}
        </button>
        {isEdit && (
          <button className="btn" onClick={() => handleSave(true)} disabled={loading}>
            <Plus size={14} strokeWidth={SW} /> Crear variante
          </button>
        )}
        {isEdit && (
          <button className="btn" onClick={onCancelEdit}>
            <X size={14} strokeWidth={SW} /> Descartar
          </button>
        )}
      </div>
    </div>
  );
}
