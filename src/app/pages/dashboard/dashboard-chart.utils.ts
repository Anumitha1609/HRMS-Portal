/**
 * Lightweight, dependency-free chart geometry helpers.
 * Each function returns pre-computed render data so templates only bind
 * to attributes — no math in the HTML.
 */

export interface BarRow {
  label: string;
  value: number;
  pct: number;
  color: string;
  display: string;
}

export interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

export interface LineChartData {
  points: string;
  areaPath: string;
  first: number;
  last: number;
  deltaPct: number;
}

export interface DualBarRow {
  label: string;
  aPct: number;
  bPct: number;
  aVal: number;
  bVal: number;
}

const DEFAULT_CIRCUMFERENCE = 2 * Math.PI * 42;

export function buildBarRows(
  data: { label: string; value: number; color?: string }[],
  defaultColor = 'var(--amber)',
  formatFn: (n: number) => string = (n) => `${n}`
): BarRow[] {
  const max = Math.max(...data.map((d) => d.value), 1);
  return data.map((d) => ({
    label: d.label,
    value: d.value,
    pct: (d.value / max) * 100,
    color: d.color ?? defaultColor,
    display: formatFn(d.value)
  }));
}

export function buildDonut(
  data: { label: string; value: number; color: string }[],
  circumference = DEFAULT_CIRCUMFERENCE
): DonutSegment[] {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let acc = 0;
  return data.map((d) => {
    const percent = (d.value / total) * 100;
    const len = (percent / 100) * circumference;
    const seg: DonutSegment = {
      label: d.label,
      value: d.value,
      percent,
      color: d.color,
      dashArray: `${len.toFixed(1)} ${(circumference - len).toFixed(1)}`,
      dashOffset: -acc
    };
    acc += len;
    return seg;
  });
}

export function buildLine(values: number[], width = 280, height = 96, padding = 10): LineChartData {
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (Math.max(values.length - 1, 1));

  const pts = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const points = pts.join(' ');
  const areaPath = `M${padding},${height - padding} L${pts.join(' L')} L${(width - padding).toFixed(1)},${height - padding} Z`;
  const first = values[0];
  const last = values[values.length - 1];
  const deltaPct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

  return { points, areaPath, first, last, deltaPct };
}

export function buildDualBars(data: { label: string; a: number; b: number }[]): DualBarRow[] {
  const max = Math.max(...data.map((d) => Math.max(d.a, d.b)), 1);
  return data.map((d) => ({
    label: d.label,
    aPct: (d.a / max) * 100,
    bPct: (d.b / max) * 100,
    aVal: d.a,
    bVal: d.b
  }));
}

export function lastNMonthLabels(n: number, from = new Date()): string[] {
  const labels: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
  }
  return labels;
}
