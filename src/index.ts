interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * ISO 8601 duration MCP.
 *
 * Keyless, offline: parse an ISO 8601 duration (e.g. "PT1H30M", "P1Y2M10D") to
 * its components + total seconds, and format a number of seconds back to ISO
 * 8601 + a human-readable string. Pure logic — no API, no key. (Months/years
 * use nominal lengths — 30d / 365d — for the seconds estimate.)
 */


const RE = /^(-)?P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
const SEC = { years: 365 * 86400, months: 30 * 86400, weeks: 7 * 86400, days: 86400, hours: 3600, minutes: 60, seconds: 1 };

function human(sec: number): string {
  const neg = sec < 0; sec = Math.abs(sec);
  const parts: string[] = [];
  for (const [name, s] of [['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]] as [string, number][]) {
    const n = Math.floor(sec / s); if (n) { parts.push(`${n} ${name}${n === 1 ? '' : 's'}`); sec -= n * s; }
  }
  return (neg ? '-' : '') + (parts.join(', ') || '0 seconds');
}

const tools: McpToolExport['tools'] = [
  {
    name: 'parse_duration',
    description: 'Parse an ISO 8601 duration string (e.g. "PT1H30M", "P1Y2M10DT2H") into its components and an approximate total in seconds (keyless, offline). Note: months=30d, years=365d for the estimate.',
    inputSchema: { type: 'object', properties: { duration: { type: 'string', description: 'An ISO 8601 duration, e.g. "P1DT2H30M".' } }, required: ['duration'] },
  },
  {
    name: 'format_duration',
    description: 'Convert a number of seconds into an ISO 8601 duration string and a human-readable form (keyless, offline).',
    inputSchema: { type: 'object', properties: { seconds: { type: 'number', description: 'Total seconds.' } }, required: ['seconds'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'parse_duration': {
      const d = reqStr(args, 'duration', '"PT1H30M"').trim().toUpperCase();
      const m = d.match(RE);
      if (!m || d === 'P' || d === '-P') return { input: d, valid: false, reason: 'Not a valid ISO 8601 duration (e.g. "PT1H30M", "P1Y2M10D").' };
      const sign = m[1] ? -1 : 1;
      const c = { years: +(m[2] || 0), months: +(m[3] || 0), weeks: +(m[4] || 0), days: +(m[5] || 0), hours: +(m[6] || 0), minutes: +(m[7] || 0), seconds: +(m[8] || 0) };
      const total = sign * Object.entries(c).reduce((a, [k, v]) => a + v * SEC[k as keyof typeof SEC], 0);
      return { input: d, valid: true, components: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, sign * v])), total_seconds: +total.toFixed(3), human: human(total) };
    }
    case 'format_duration': {
      const total = numArg(args, 'seconds');
      const neg = total < 0; let s = Math.abs(total);
      const y = Math.floor(s / SEC.years); s -= y * SEC.years;
      const d = Math.floor(s / SEC.days); s -= d * SEC.days;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const mi = Math.floor(s / 60); s -= mi * 60;
      const sec = +s.toFixed(3);
      let iso = 'P' + (y ? `${y}Y` : '') + (d ? `${d}D` : '');
      const t = (h ? `${h}H` : '') + (mi ? `${mi}M` : '') + (sec ? `${sec}S` : '');
      if (t) iso += 'T' + t;
      if (iso === 'P') iso = 'PT0S';
      return { input_seconds: total, iso_8601: (neg ? '-' : '') + iso, human: human(total) };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}
function numArg(args: Record<string, unknown>, key: string): number {
  const v = args[key]; const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) throw new Error(`Required argument "${key}" must be a number.`);
  return n;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
