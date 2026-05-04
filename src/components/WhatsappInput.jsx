import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { sb } from '../lib/supabase.js';

const SW = 1.5;

export default function WhatsappInput({ userId }) {
  const [value, setValue]   = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    sb.from('profiles').select('whatsapp').eq('id', userId).single()
      .then(({ data }) => {
        if (data?.whatsapp) setValue(data.whatsapp);
        setLoaded(true);
      });
  }, [userId]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    await sb.from('profiles').upsert({ id: userId, whatsapp: value.trim(), updated_at: new Date().toISOString() });
    setSaving(false);
    window.toast?.('WhatsApp guardado');
  }

  if (!loaded) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="label">WhatsApp</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="input"
          type="tel"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="584121234567"
          style={{ flex: 1, fontSize: 12 }}
        />
        <button className="btn" onClick={handleSave} disabled={saving} style={{ flexShrink: 0, padding: '7px 10px' }}>
          {saving ? <span className="spinner" /> : <Check size={13} strokeWidth={SW} />}
        </button>
      </div>
    </div>
  );
}
