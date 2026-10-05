// Real-Time Gold Rate Service for SBG Commercial Suite
// Tier 1: CoinGecko PAXG/INR (CORS-enabled, free, no key required)
// Tier 2: Binance PAXGUSDT + open.er-api.com USDINR
// Tier 3: Cached localStorage
// Tier 4: Static fallback

export interface GoldRateData {
  base24kPerGram: number;
  rate995: number;        // 99.5% fine gold (Standard Market Rate)
  rate916: number;        // 91.6% 22K gold
  rate750: number;        // 75.0% 18K gold
  change24hPercent: number;
  lastUpdated: string;
  isLive: boolean;
  source: string;
}

const TROY_OUNCE_TO_GRAMS = 31.1034768;
const FALLBACK_24K_RATE = 12900; // Updated safe fallback

const TIMEOUT_MS = 5000;

function withTimeout(promise: Promise<Response>, ms: number): Promise<Response> {
  return Promise.race([
    promise,
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    ),
  ]);
}

function formatTime(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

async function fetchTier1CoinGecko(): Promise<GoldRateData | null> {
  try {
    const res = await withTimeout(
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=inr&include_24hr_change=true',
        { headers: { Accept: 'application/json' } }
      ),
      TIMEOUT_MS
    );
    if (!res.ok) return null;
    const data = await res.json();
    const inrPerOz: number = data['pax-gold']?.inr;
    const change24h: number = data['pax-gold']?.inr_24h_change || 0;
    if (!inrPerOz || inrPerOz <= 0) return null;

    const base24k = inrPerOz / TROY_OUNCE_TO_GRAMS;
    return {
      base24kPerGram: Number(base24k.toFixed(2)),
      rate995: Number((base24k * 0.995).toFixed(2)),
      rate916: Number((base24k * 0.916).toFixed(2)),
      rate750: Number((base24k * 0.750).toFixed(2)),
      change24hPercent: Number(change24h.toFixed(2)),
      lastUpdated: formatTime(),
      isLive: true,
      source: 'Live Spot Market (Gold/INR)',
    };
  } catch {
    return null;
  }
}

async function fetchTier2BinanceFX(): Promise<GoldRateData | null> {
  try {
    const [binanceRes, fxRes] = await Promise.all([
      withTimeout(
        fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT', {
          headers: { Accept: 'application/json' },
        }),
        TIMEOUT_MS
      ),
      withTimeout(
        fetch('https://open.er-api.com/v6/latest/USD', {
          headers: { Accept: 'application/json' },
        }),
        TIMEOUT_MS
      ),
    ]);
    if (!binanceRes.ok || !fxRes.ok) return null;

    const binance = await binanceRes.json();
    const fx = await fxRes.json();

    const goldUSD = parseFloat(binance.lastPrice);
    const usdInr: number = fx.rates?.INR;
    const change24h = parseFloat(binance.priceChangePercent) || 0;

    if (!goldUSD || !usdInr || goldUSD <= 0 || usdInr <= 0) return null;

    const base24k = (goldUSD * usdInr) / TROY_OUNCE_TO_GRAMS;
    return {
      base24kPerGram: Number(base24k.toFixed(2)),
      rate995: Number((base24k * 0.995).toFixed(2)),
      rate916: Number((base24k * 0.916).toFixed(2)),
      rate750: Number((base24k * 0.750).toFixed(2)),
      change24hPercent: Number(change24h.toFixed(2)),
      lastUpdated: formatTime(),
      isLive: true,
      source: 'Live Spot (COMEX + Forex)',
    };
  } catch {
    return null;
  }
}

export async function fetchLiveGoldRate(): Promise<GoldRateData> {
  // Tier 1: CoinGecko PAXG/INR — best accuracy, direct INR
  const tier1 = await fetchTier1CoinGecko();
  if (tier1) {
    localStorage.setItem('sbg_last_gold_rate', JSON.stringify(tier1));
    return tier1;
  }

  // Tier 2: Binance PAXGUSDT + open.er-api.com USDINR
  const tier2 = await fetchTier2BinanceFX();
  if (tier2) {
    localStorage.setItem('sbg_last_gold_rate', JSON.stringify(tier2));
    return tier2;
  }

  // Tier 3: Return cached localStorage reading
  const cached = localStorage.getItem('sbg_last_gold_rate');
  if (cached) {
    try {
      const parsed: GoldRateData = JSON.parse(cached);
      if (parsed.base24kPerGram > 0) {
        console.warn('[SBG Gold] Using cached rate — network unavailable');
        return {
          ...parsed,
          lastUpdated: formatTime(),
          isLive: false,
          source: 'Cached Rate (Offline)',
        };
      }
    } catch {
      // ignore
    }
  }

  // Tier 4: Static fallback
  console.warn('[SBG Gold] Using static fallback rate');
  const fallback = FALLBACK_24K_RATE;
  return {
    base24kPerGram: fallback,
    rate995: Number((fallback * 0.995).toFixed(2)),
    rate916: Number((fallback * 0.916).toFixed(2)),
    rate750: Number((fallback * 0.750).toFixed(2)),
    change24hPercent: 0,
    lastUpdated: formatTime(),
    isLive: false,
    source: 'Default Baseline Rate',
  };
}
