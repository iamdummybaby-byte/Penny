import { getServerlessStore, verifyStatelessToken } from '../_store.js';

export default function handler(req: any, res: any) {
  const authHeader = req.headers?.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!verifyStatelessToken(token)) {
    res.status(401).json({ error: 'SESSION EXPIRED OR INVALID.' });
    return;
  }

  const { events, liveVisitors } = getServerlessStore();
  const range = String(req.query?.range || '7_DAYS');
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let startMs = now - 7 * oneDay;
  if (range === 'TODAY') startMs = startOfToday.getTime();
  else if (range === 'YESTERDAY') startMs = startOfToday.getTime() - oneDay;
  else if (range === '30_DAYS') startMs = now - 30 * oneDay;
  else if (range === '90_DAYS') startMs = now - 90 * oneDay;
  else if (range === 'ALL_TIME') startMs = 0;

  const currentEvents = events.filter((e: any) => e.timestamp >= startMs);

  const visitors = new Set<string>();
  const sessions = new Set<string>();
  let pageViews = 0;
  let productsViewed = 0;
  let addToCart = 0;
  let checkoutsStarted = 0;
  let orders = 0;

  for (const ev of currentEvents) {
    if (ev.visitorId) visitors.add(ev.visitorId);
    if (ev.sessionId) sessions.add(ev.sessionId);
    if (ev.type === 'page_view') pageViews++;
    if (ev.type === 'product_view') productsViewed++;
    if (ev.type === 'add_to_cart') addToCart += ev.quantity || 1;
    if (ev.type === 'checkout_start') checkoutsStarted++;
    if (ev.type === 'purchase' || ev.type === 'checkout_complete') orders++;
  }

  const vCount = visitors.size;
  const convRate = vCount > 0 ? Number(((orders / vCount) * 100).toFixed(2)) : 0;

  const activePages: Record<string, number> = {};
  let liveCount = 0;
  for (const [vid, info] of liveVisitors.entries()) {
    if (now - info.lastSeen <= 90000) {
      liveCount++;
      activePages[info.page || 'home'] =
        (activePages[info.page || 'home'] || 0) + 1;
    } else {
      liveVisitors.delete(vid);
    }
  }

  // Clicks table
  const clickMap = new Map<
    string,
    {
      element: string;
      section: string;
      page: string;
      clicks: number;
      lastClickedAt: number;
    }
  >();
  let totalClicks = 0;

  for (const ev of currentEvents) {
    if (
      ev.type === 'cta_click' ||
      ev.type === 'product_click' ||
      ev.type === 'add_to_cart' ||
      ev.type === 'search' ||
      ev.type === 'cart_view' ||
      ev.type === 'checkout_start' ||
      ev.type === 'club_signup'
    ) {
      const label = ev.elementName || ev.type.toUpperCase();
      totalClicks++;
      const ex = clickMap.get(label);
      if (ex) {
        ex.clicks++;
        ex.lastClickedAt = Math.max(ex.lastClickedAt, ev.timestamp);
      } else {
        clickMap.set(label, {
          element: label,
          section: ev.section || 'general',
          page: ev.page || 'home',
          clicks: 1,
          lastClickedAt: ev.timestamp,
        });
      }
    }
  }

  const clicksTable = Array.from(clickMap.values()).map((c) => ({
    ...c,
    percentage:
      totalClicks > 0 ? Number(((c.clicks / totalClicks) * 100).toFixed(1)) : 0,
  }));

  // Club Reasons
  const clubReasonCounts: Record<string, number> = {
    'I NEED A PEN HOLDER': 0,
    'I WANT A WEIRDO': 0,
    'I COLLECT STRANGE THINGS': 0,
    "I'M BUYING A GIFT": 0,
    "I'M JUST CURIOUS": 0,
    'I WANT TO SEE WHAT COMES NEXT': 0,
  };
  const clubSignups = currentEvents.filter((e: any) => e.type === 'club_signup');
  const clubCountries = new Set<string>();
  for (const cs of clubSignups) {
    if (cs.country) clubCountries.add(cs.country);
    if (Array.isArray(cs.clubReasons)) {
      for (const r of cs.clubReasons) {
        const up = String(r).toUpperCase();
        clubReasonCounts[up] = (clubReasonCounts[up] || 0) + 1;
      }
    }
  }
  const sortedReasons = Object.entries(clubReasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  res.status(200).json({
    ok: true,
    lastUpdated: now,
    range,
    summaryCards: {
      visitors: { value: vCount, change: 0 },
      sessions: { value: sessions.size, change: 0 },
      pageViews: { value: pageViews, change: 0 },
      productsViewed: { value: productsViewed, change: 0 },
      addToCart: { value: addToCart, change: 0 },
      checkoutsStarted: { value: checkoutsStarted, change: 0 },
      orders: { value: orders, change: 0 },
      conversionRate: { value: convRate, change: 0 },
    },
    liveStatus: {
      count: liveCount,
      activePages,
    },
    timeSeries: Array.from({ length: 7 }, (_, idx) => {
      const bTime = now - (6 - idx) * oneDay;
      const dStr = new Date(bTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const dayEvents = currentEvents.filter(
        (e: any) =>
          new Date(e.timestamp).toDateString() ===
          new Date(bTime).toDateString()
      );
      return {
        timestamp: bTime,
        label: dStr,
        visitors: new Set(dayEvents.map((e: any) => e.visitorId)).size,
        sessions: new Set(dayEvents.map((e: any) => e.sessionId)).size,
        pageViews: dayEvents.filter((e: any) => e.type === 'page_view').length,
        orders: dayEvents.filter((e: any) => e.type === 'purchase').length,
      };
    }),
    clicksTable,
    heatmapCounts: { home: {}, shop: {}, product: {}, checkout: {} },
    productAnalytics: [],
    pennyClubAnalytics: {
      totalSignups: clubSignups.length,
      rangeSignups: clubSignups.length,
      signupsToday: clubSignups.length,
      signupsThisWeek: clubSignups.length,
      signupsThisMonth: clubSignups.length,
      signupConversionRate:
        vCount > 0
          ? Number(((clubSignups.length / vCount) * 100).toFixed(1))
          : 0,
      countriesRepresented: clubCountries.size,
      mostSelectedReason:
        sortedReasons[0]?.count > 0 ? sortedReasons[0].reason : 'NONE YET',
      reasonBreakdown: sortedReasons,
    },
    countryAnalytics: Array.from(clubCountries).map((c) => ({
      country: c,
      visitors: 1,
      clubSignups: clubSignups.filter((s: any) => s.country === c).length,
      orders: 0,
      conversionRate: 0,
    })),
    trafficSources: [
      {
        source: 'Direct',
        visitors: vCount,
        sessions: sessions.size,
        orders,
        conversionRate: convRate,
      },
    ],
    utmCampaigns: [],
    pageAnalytics: [
      {
        page: 'home',
        views: pageViews,
        uniqueVisitors: vCount,
        avgEngagementSec: 24,
        exitRate: 0,
      },
    ],
    funnel: [
      { stage: 'VISIT', count: vCount, percentage: vCount > 0 ? 100 : 0 },
      { stage: 'EXPLORE', count: vCount, percentage: vCount > 0 ? 100 : 0 },
      {
        stage: 'VIEW PRODUCT',
        count: productsViewed,
        percentage: vCount > 0 ? Math.min(100, Math.round((productsViewed / vCount) * 100)) : 0,
      },
      {
        stage: 'ADD TO CART',
        count: addToCart,
        percentage: vCount > 0 ? Math.min(100, Math.round((addToCart / vCount) * 100)) : 0,
      },
      {
        stage: 'CHECKOUT',
        count: checkoutsStarted,
        percentage: vCount > 0 ? Math.min(100, Math.round((checkoutsStarted / vCount) * 100)) : 0,
      },
      {
        stage: 'PURCHASE',
        count: orders,
        percentage: vCount > 0 ? Math.min(100, Math.round((orders / vCount) * 100)) : 0,
      },
    ],
    recentEvents: currentEvents.slice(-50).reverse(),
  });
}
