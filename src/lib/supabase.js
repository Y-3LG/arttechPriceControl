import { createClient } from '@supabase/supabase-js';

const SUPA_URL = 'https://evcutsnyncaqlkknjbfi.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2Y3V0c255bmNhcWxra25qYmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODE4MDYsImV4cCI6MjA5Mjc1NzgwNn0.UxynMcFzj5NZTqkMkJqhF4AiPHlCp9KKpX3o8Ep_Xv0';

export const sb = createClient(SUPA_URL, SUPA_KEY);

// DB row → JS object
export function fromRow(r) {
  return {
    id:           r.id,
    name:         r.name,
    ram:          r.ram          || '',
    rom:          r.rom          || '',
    memory:       r.memory       || '',
    condition:    r.condition    || 'GRADO A',
    desc:         r.description  || '',
    finalPrice:   parseFloat(r.final_price)  || 0,
    initialPct:   parseFloat(r.initial_pct)  || 30,
    initialAmt:   parseFloat(r.initial_amt)  || 0,
    installments: r.installments || 6,
    installAmt:   parseFloat(r.install_amt)  || 0,
    period:       r.period       || 'QUINCENALES',
    available:    r.available    !== false,
    msg:          r.msg          || '',
    createdAt:    r.created_at,
  };
}

// JS object → DB row
export function toRow(d, userId) {
  return {
    user_id:      userId,
    name:         d.name,
    ram:          d.ram          || '',
    rom:          d.rom          || '',
    memory:       d.memory       || '',
    condition:    d.condition,
    description:  d.desc         || '',
    final_price:  d.finalPrice,
    initial_pct:  d.initialPct,
    initial_amt:  d.initialAmt,
    installments: d.installments,
    install_amt:  d.installAmt,
    period:       d.period,
    available:    d.available    !== false,
    msg:          d.msg          || '',
  };
}

// Compat mapper for old JSON imports
export function fromLegacyJson(obj) {
  return {
    name:         obj.name         || '',
    ram:          obj.ram          || '',
    rom:          obj.rom          || '',
    memory:       obj.memory       || obj.variant || '',
    condition:    obj.condition    || 'GRADO A',
    desc:         obj.desc         || obj.description || '',
    finalPrice:   parseFloat(obj.finalPrice || obj.final_price) || 0,
    initialPct:   parseFloat(obj.initialPct || obj.initial_pct) || 30,
    initialAmt:   parseFloat(obj.initialAmt || obj.initial_amt) || 0,
    installments: parseInt(obj.installments)  || 6,
    installAmt:   parseFloat(obj.installAmt  || obj.install_amt) || 0,
    period:       obj.period       || 'QUINCENALES',
    available:    obj.available    !== false,
    msg:          obj.msg          || '',
  };
}
