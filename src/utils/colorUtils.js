/**
 * Converts a hex color to rgba with opacity
 * Works cross-browser, replaces color-mix() which has limited support
 */
export const hexToRgba = (hex, opacity) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2), 16);
  const g = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

// Named colors map for CSS variables (can't parse CSS vars at runtime)
const COLOR_MAP = {
  '#00e5a0': [0,229,160],
  '#3b82f6': [59,130,246],
  '#a78bfa': [167,139,250],
  '#f5a623': [245,166,35],
  '#ff4d6d': [255,77,109],
  '#34d399': [52,211,153],
  '#60a5fa': [96,165,250],
  '#c084fc': [192,132,252],
  '#8892a4': [136,146,164],
};

export const colorBg = (hex, opacity = 0.15) => {
  const rgb = COLOR_MAP[hex];
  if (!rgb) return 'rgba(255,255,255,0.08)';
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`;
};
