export const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);

export const fmtShort = (n) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Number(n).toFixed(0)}`;
};

export const fmtPct = (n) => `${Math.round(n || 0)}%`;

export const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d) ? dateStr : d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: '2-digit' });
};

export const statusColor = (status) => {
  if (status === 'over')    return '#ff4d6d';
  if (status === 'warning') return '#f5a623';
  return '#00e5a0';
};

export const necesidadColor = (nec) => {
  const map = {
    'Necesario':    '#00e5a0',
    'Importante':   '#3b82f6',
    'Moderado':     '#f5a623',
    'Prescindible': '#ff4d6d',
  };
  return map[nec] || '#8892a4';
};
