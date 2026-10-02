// Real-Time Yahoo Finance Gold Rate Service for SBG Commercial Suite

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
const FALLBACK_24K_RATE = 11904.65; // Safe static fallback if network fails completely

export async function fetchLiveGoldRate(): Promise<GoldRateData> {
  const now = new Date();
  const formattedTime = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  try {
    // Attempt direct fetch from Yahoo Finance API
    let goldRes, inrRes;

    try {
      [goldRes, inrRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d'),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1m&range=1d'),
      ]);
    } catch (corsErr) {
      // Fallback via CORS proxy if direct browser fetch is blocked
      const proxyUrl = (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      [goldRes, inrRes] = await Promise.all([
        fetch(proxyUrl('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d')),
        fetch(proxyUrl('https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1m&range=1d')),
      ]);
    }

    if (!goldRes.ok || !inrRes.ok) {
      throw new Error(`HTTP Error: Gold(${goldRes.status}), INR(${inrRes.status})`);
    }

    const goldData = await goldRes.json();
    const inrData = await inrRes.json();

    const gcMeta = goldData?.chart?.result?.[0]?.meta;
    const inrMeta = inrData?.chart?.result?.[0]?.meta;

    if (!gcMeta?.regularMarketPrice || !inrMeta?.regularMarketPrice) {
      throw new Error('Invalid Yahoo Finance payload structure');
    }

    const goldUSD = gcMeta.regularMarketPrice;
    const prevGoldUSD = gcMeta.chartPreviousClose || gcMeta.previousClose || goldUSD;
    const usdInr = inrMeta.regularMarketPrice;
    const prevUsdInr = inrMeta.chartPreviousClose || inrMeta.previousClose || usdInr;

    const current24kInr = (goldUSD * usdInr) / TROY_OUNCE_TO_GRAMS;
    const prev24kInr = (prevGoldUSD * prevUsdInr) / TROY_OUNCE_TO_GRAMS;

    const change24hPercent = prev24kInr > 0 ? ((current24kInr - prev24kInr) / prev24kInr) * 100 : 0;

    const rateData: GoldRateData = {
      base24kPerGram: Number(current24kInr.toFixed(2)),
      rate995: Number((current24kInr * 0.995).toFixed(2)),
      rate916: Number((current24kInr * 0.916).toFixed(2)),
      rate750: Number((current24kInr * 0.750).toFixed(2)),
      change24hPercent: Number(change24hPercent.toFixed(2)),
      lastUpdated: formattedTime,
      isLive: true,
      source: 'Yahoo Finance Live (GC=F + USDINR=X)',
    };

    // Store in localStorage as last good reading
    localStorage.setItem('sbg_last_yahoo_gold_rate', JSON.stringify(rateData));
    return rateData;
  } catch (error) {
    console.warn('Failed to fetch Yahoo Finance live rate, using cached/fallback:', error);

    const cached = localStorage.getItem('sbg_last_yahoo_gold_rate');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          isLive: false,
          source: 'Cached Market Rate',
        };
      } catch (e) {
        // ignore parse error
      }
    }

    // Fallback baseline
    const fallbackBase = FALLBACK_24K_RATE;
    return {
      base24kPerGram: fallbackBase,
      rate995: Number((fallbackBase * 0.995).toFixed(2)),
      rate916: Number((fallbackBase * 0.916).toFixed(2)),
      rate750: Number((fallbackBase * 0.750).toFixed(2)),
      change24hPercent: +0.25,
      lastUpdated: formattedTime,
      isLive: false,
      source: 'Default Baseline Rate',
    };
  }
}
