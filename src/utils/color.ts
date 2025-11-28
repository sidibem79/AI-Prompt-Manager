const palette = ['#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#facc15', '#06b6d4', '#f472b6'];

const sanitizeHex = (hex: string) => {
  if (!hex) return '000000';
  const normalized = hex.replace('#', '');
  return normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized.padEnd(6, '0').slice(0, 6);
};

export const getTagColor = (value: string) => {
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = sanitizeHex(hex);
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
