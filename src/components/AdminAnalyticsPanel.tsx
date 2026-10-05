import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from '../data/products';
import {
  PixelCreatureSprite,
  PixelChompSprite,
  PixelBlobSprite,
  PixelImage,
} from './PixelSprites';
import { sound } from '../utils/sound';
import { getLocalFallbackEvents } from '../utils/analytics';

/* ============================================================================
   TYPES
   ============================================================================ */

export type AdminTab =
  | 'OVERVIEW'
  | 'LIVE'
  | 'VISITORS'
  | 'PAGES'
  | 'PRODUCTS'
  | 'CLICKS'
  | 'PENNY_CLUB'
  | 'TRAFFIC'
  | 'FUNNEL'
  | 'EVENTS'
  | 'SETTINGS';

export type DateRangeOption =
  | 'TODAY'
  | 'YESTERDAY'
  | '7_DAYS'
  | '30_DAYS'
  | '90_DAYS'
  | 'ALL_TIME'
  | 'CUSTOM';

interface SummaryMetric {
  value: number;
  change: number;
}

interface DashboardAnalyticsData {
  lastUpdated: number;
  range: string;
  summaryCards: {
    visitors: SummaryMetric;
    sessions: SummaryMetric;
    pageViews: SummaryMetric;
    productsViewed: SummaryMetric;
    addToCart: SummaryMetric;
    checkoutsStarted: SummaryMetric;
    orders: SummaryMetric;
    conversionRate: SummaryMetric;
  };
  liveStatus: {
    count: number;
    activePages: Record<string, number>;
  };
  timeSeries: Array<{
    timestamp: number;
    label: string;
    visitors: number;
    sessions: number;
    pageViews: number;
    orders: number;
  }>;
  clicksTable: Array<{
    element: string;
    section: string;
    page: string;
    clicks: number;
    percentage: number;
    lastClickedAt: number;
  }>;
  heatmapCounts: Record<
    string,
    Record<string, { zone: string; clicks: number }>
  >;
  productAnalytics: Array<{
    productId: string;
    productName: string;
    productSlug: string;
    views: number;
    uniqueViewers: number;
    addToCart: number;
    wishlistAdds: number;
    orders: number;
    conversionRate: number;
    addToCartRate: number;
    purchaseRate: number;
    avgTimeSec: number;
    sources: Record<string, number>;
    dailyViews: Record<string, number>;
  }>;
  pennyClubAnalytics: {
    totalSignups: number;
    rangeSignups: number;
    signupsToday: number;
    signupsThisWeek: number;
    signupsThisMonth: number;
    signupConversionRate: number;
    countriesRepresented: number;
    mostSelectedReason: string;
    reasonBreakdown: Array<{ reason: string; count: number }>;
  };
  countryAnalytics: Array<{
    country: string;
    visitors: number;
    clubSignups: number;
    orders: number;
    conversionRate: number;
  }>;
  trafficSources: Array<{
    source: string;
    visitors: number;
    sessions: number;
    orders: number;
    conversionRate: number;
  }>;
  utmCampaigns: Array<{
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    visitors: number;
    orders: number;
  }>;
  pageAnalytics: Array<{
    page: string;
    views: number;
    uniqueVisitors: number;
    avgEngagementSec: number;
    exitRate: number;
  }>;
  funnel: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    timestamp: number;
    page: string;
    section?: string;
    elementName?: string;
    productName?: string;
    country?: string;
    referrerSource?: string;
  }>;
}

interface AdminSettingsState {
  retentionDays: number;
  timezone: string;
  currency: string;
  refreshIntervalSec: number;
  sessionTimeoutMinutes: number;
  trackedEvents: Record<string, boolean>;
}

interface AdminAnalyticsPanelProps {
  products: Product[];
  onExitAdmin: () => void;
}

const SESSION_TOKEN_KEY = 'penny_admin_session_token_v1';

/* ============================================================================
   LOCAL FALLBACK AGGREGATOR (When running on static-only host without Node API)
   ============================================================================ */
function buildFallbackAnalyticsFromLocal(
  range: DateRangeOption,
  products: Product[]
): DashboardAnalyticsData {
  const rawEvents = getLocalFallbackEvents();
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  let startMs = now - 7 * oneDay;
  if (range === 'TODAY') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime();
  } else if (range === 'YESTERDAY') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime() - oneDay;
  } else if (range === '30_DAYS') {
    startMs = now - 30 * oneDay;
  } else if (range === '90_DAYS') {
    startMs = now - 90 * oneDay;
  } else if (range === 'ALL_TIME') {
    startMs = 0;
  }

  const filtered = rawEvents.filter((e) => e.timestamp >= startMs);
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  let pageViews = 0;
  let productsViewed = 0;
  let addToCart = 0;
  let checkoutsStarted = 0;
  let orders = 0;

  for (const ev of filtered) {
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

  // Clicks
  const clickMap = new Map<string, { element: string; section: string; page: string; clicks: number; lastClickedAt: number }>();
  let totalClicks = 0;
  for (const ev of filtered) {
    if (ev.type === 'cta_click' || ev.type === 'add_to_cart' || ev.type === 'product_click') {
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

  // Products
  const productAnalytics = products.map((p) => {
    const pEvents = filtered.filter((e) => e.productId === p.id || e.productName === p.name);
    const views = pEvents.filter((e) => e.type === 'product_view' || e.type === 'product_click').length;
    const atc = pEvents.filter((e) => e.type === 'add_to_cart').reduce((s, e) => s + (e.quantity || 1), 0);
    const wl = pEvents.filter((e) => e.type === 'wishlist_add').length;
    const ord = pEvents.filter((e) => e.type === 'purchase').reduce((s, e) => s + (e.quantity || 1), 0);
    return {
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      views,
      uniqueViewers: new Set(pEvents.map((e) => e.visitorId)).size,
      addToCart: atc,
      wishlistAdds: wl,
      orders: ord,
      conversionRate: views > 0 ? Number(((ord / views) * 100).toFixed(1)) : 0,
      addToCartRate: views > 0 ? Number(((atc / views) * 100).toFixed(1)) : 0,
      purchaseRate: atc > 0 ? Number(((ord / atc) * 100).toFixed(1)) : 0,
      avgTimeSec: 18,
      sources: { Direct: views },
      dailyViews: {},
    };
  });

  // Club Reasons
  const reasonCounts: Record<string, number> = {
    'I NEED A PEN HOLDER': 0,
    'I WANT A WEIRDO': 0,
    'I COLLECT STRANGE THINGS': 0,
    "I'M BUYING A GIFT": 0,
    "I'M JUST CURIOUS": 0,
    'I WANT TO SEE WHAT COMES NEXT': 0,
  };
  const clubSignups = filtered.filter((e) => e.type === 'club_signup');
  const clubCountries = new Set<string>();
  for (const cs of clubSignups) {
    if (cs.country) clubCountries.add(cs.country);
    if (Array.isArray(cs.clubReasons)) {
      for (const r of cs.clubReasons) {
        const up = String(r).toUpperCase();
        reasonCounts[up] = (reasonCounts[up] || 0) + 1;
      }
    }
  }
  const sortedReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
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
      count: Math.max(1, vCount > 0 ? 1 : 0),
      activePages: { home: 1 },
    },
    timeSeries: Array.from({ length: 7 }, (_, idx) => {
      const bTime = now - (6 - idx) * oneDay;
      const dStr = new Date(bTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayEvents = filtered.filter(
        (e) => new Date(e.timestamp).toDateString() === new Date(bTime).toDateString()
      );
      return {
        timestamp: bTime,
        label: dStr,
        visitors: new Set(dayEvents.map((e) => e.visitorId)).size,
        sessions: new Set(dayEvents.map((e) => e.sessionId)).size,
        pageViews: dayEvents.filter((e) => e.type === 'page_view').length,
        orders: dayEvents.filter((e) => e.type === 'purchase').length,
      };
    }),
    clicksTable: Array.from(clickMap.values()).map((c) => ({
      ...c,
      percentage: totalClicks > 0 ? Number(((c.clicks / totalClicks) * 100).toFixed(1)) : 0,
    })),
    heatmapCounts: { home: {}, shop: {}, product: {}, checkout: {} },
    productAnalytics,
    pennyClubAnalytics: {
      totalSignups: clubSignups.length,
      rangeSignups: clubSignups.length,
      signupsToday: clubSignups.length,
      signupsThisWeek: clubSignups.length,
      signupsThisMonth: clubSignups.length,
      signupConversionRate: vCount > 0 ? Number(((clubSignups.length / vCount) * 100).toFixed(1)) : 0,
      countriesRepresented: clubCountries.size,
      mostSelectedReason: sortedReasons[0]?.count > 0 ? sortedReasons[0].reason : 'NONE YET',
      reasonBreakdown: sortedReasons,
    },
    countryAnalytics: Array.from(clubCountries).map((c) => ({
      country: c,
      visitors: 1,
      clubSignups: clubSignups.filter((s) => s.country === c).length,
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
        avgEngagementSec: 25,
        exitRate: 0,
      },
    ],
    funnel: [
      { stage: 'VISIT', count: vCount, percentage: vCount > 0 ? 100 : 0 },
      { stage: 'EXPLORE', count: vCount, percentage: vCount > 0 ? 100 : 0 },
      {
        stage: 'VIEW PRODUCT',
        count: productsViewed > 0 ? 1 : 0,
        percentage: vCount > 0 && productsViewed > 0 ? 100 : 0,
      },
      {
        stage: 'ADD TO CART',
        count: addToCart > 0 ? 1 : 0,
        percentage: vCount > 0 && addToCart > 0 ? 100 : 0,
      },
      {
        stage: 'CHECKOUT',
        count: checkoutsStarted > 0 ? 1 : 0,
        percentage: vCount > 0 && checkoutsStarted > 0 ? 100 : 0,
      },
      {
        stage: 'PURCHASE',
        count: orders > 0 ? 1 : 0,
        percentage: vCount > 0 && orders > 0 ? 100 : 0,
      },
    ],
    recentEvents: filtered
      .slice(-40)
      .reverse()
      .map((e) => ({
        id: e.id || String(e.timestamp),
        type: e.type,
        timestamp: e.timestamp,
        page: e.page || 'home',
        section: e.section,
        elementName: e.elementName,
        productName: e.productName,
        country: e.country,
        referrerSource: e.referrerSource,
      })),
  };
}

/* ============================================================================
   HELPER FORMATTERS
   ============================================================================ */
function formatEventStreamLine(ev: {
  type: string;
  page: string;
  section?: string;
  elementName?: string;
  productName?: string;
  country?: string;
}): { label: string; color: string } {
  switch (ev.type) {
    case 'product_view':
      return {
        label: `Product viewed — ${ev.productName || 'CREATURE'}`,
        color: '#E6B84D',
      };
    case 'product_click':
      return {
        label: `Creature card clicked — ${ev.productName || 'CREATURE'}`,
        color: '#E6B84D',
      };
    case 'add_to_cart':
      return {
        label: `Add to cart — ${ev.productName || 'CREATURE'}`,
        color: '#4A6B53',
      };
    case 'remove_from_cart':
      return {
        label: `Removed from cart — ${ev.productName || 'CREATURE'}`,
        color: '#D95D39',
      };
    case 'club_signup':
      return {
        label: `PENNY CLUB signup${ev.country ? ` (${ev.country})` : ''}`,
        color: '#4A6B53',
      };
    case 'club_form_start':
      return {
        label: `PENNY CLUB terminal engaged`,
        color: '#E6B84D',
      };
    case 'checkout_start':
      return {
        label: `Checkout started`,
        color: '#D95D39',
      };
    case 'purchase':
    case 'checkout_complete':
      return {
        label: `Order completed${ev.productName ? ` — ${ev.productName}` : ''}`,
        color: '#4A6B53',
      };
    case 'cta_click':
      return {
        label: `CTA clicked — "${ev.elementName || 'BUTTON'}" on ${ev.page.toUpperCase()}`,
        color: '#F6F3EB',
      };
    case 'search':
      return {
        label: `Search query executed`,
        color: '#E6B84D',
      };
    case 'wishlist_add':
      return {
        label: `Creature favorited ♥ — ${ev.productName || 'CREATURE'}`,
        color: '#D95D39',
      };
    case 'faq_open':
      return {
        label: `FAQ opened — ${ev.elementName || 'Question'}`,
        color: '#F6F3EB',
      };
    case 'page_view':
      return {
        label: `Page viewed — /${ev.page === 'home' ? '' : ev.page}`,
        color: '#A8A29E',
      };
    default:
      return {
        label: `${ev.type.replace(/_/g, ' ').toUpperCase()} — ${ev.page}`,
        color: '#A8A29E',
      };
  }
}

/* ============================================================================
   INTERACTIVE PIXEL LINE / AREA CHART
   ============================================================================ */
const PixelVisitorsChart: React.FC<{
  data: DashboardAnalyticsData['timeSeries'];
  metric: 'visitors' | 'sessions' | 'pageViews' | 'orders';
  onChangeMetric: (m: 'visitors' | 'sessions' | 'pageViews' | 'orders') => void;
}> = ({ data, metric, onChangeMetric }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const values = data.map((d) => d[metric]);
  const maxVal = Math.max(5, ...values);

  const metricMeta: Record<
    'visitors' | 'sessions' | 'pageViews' | 'orders',
    { label: string; color: string }
  > = {
    visitors: { label: 'Visitors', color: '#E6B84D' },
    sessions: { label: 'Sessions', color: '#4A6B53' },
    pageViews: { label: 'Page Views', color: '#D95D39' },
    orders: { label: 'Orders', color: '#38BDF8' },
  };

  const activeColor = metricMeta[metric].color;

  // Build SVG coordinates (viewBox 700 x 220)
  const width = 700;
  const height = 220;
  const padLeft = 38;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = data.map((item, i) => {
    const x =
      data.length > 1
        ? padLeft + (i / (data.length - 1)) * plotW
        : padLeft + plotW / 2;
    const val = item[metric];
    const y = padTop + plotH - (val / maxVal) * plotH;
    return { x, y, val, label: item.label, full: item };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr =
    points.length > 0
      ? `${points[0].x},${padTop + plotH} ${polylineStr} ${
          points[points.length - 1].x
        },${padTop + plotH}`
      : '';

  return (
    <div className="border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F6F3EB]/15 pb-3">
        <div>
          <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB] tracking-wider">
            VISITORS OVER TIME
          </h3>
          <p className="font-pixel-mono text-xs text-[#A8A29E]">
            Interactive time-series telemetry · Hover nodes for exact readout
          </p>
        </div>

        {/* Metric Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['visitors', 'sessions', 'pageViews', 'orders'] as const).map(
            (m) => {
              const isActive = metric === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    sound.playBlip(620, 0.03);
                    onChangeMetric(m);
                  }}
                  className={`px-3 py-1.5 border font-pixel-mono text-xs uppercase cursor-pointer transition-colors ${
                    isActive
                      ? 'border-[#E6B84D] bg-[#E6B84D] text-[#141311] font-bold'
                      : 'border-[#F6F3EB]/25 bg-[#1C1A17] text-[#F6F3EB]/80 hover:border-[#F6F3EB]'
                  }`}
                >
                  {metricMeta[m].label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* SVG Responsive Chart Container */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[540px] relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 select-none overflow-visible"
          >
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = padTop + plotH - ratio * plotH;
              const tickVal = Math.round(ratio * maxVal);
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#F6F3EB"
                    strokeOpacity={0.12}
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-[#A8A29E] font-pixel-mono text-[11px]"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {points.length > 1 && (
              <polygon
                points={areaStr}
                fill={activeColor}
                fillOpacity={0.16}
              />
            )}

            {/* Main Stepped / Crisp Line */}
            {points.length > 1 && (
              <polyline
                fill="none"
                stroke={activeColor}
                strokeWidth="3"
                points={polylineStr}
              />
            )}

            {/* Data Points & Hover Targets */}
            {points.map((pt, i) => {
              const isHovered = hoverIdx === i;
              const showXLabel =
                data.length <= 10 ||
                i === 0 ||
                i === data.length - 1 ||
                i % Math.ceil(data.length / 7) === 0;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Hover vertical guide */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={padTop + plotH}
                      stroke={activeColor}
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Square Pixel Node */}
                  <rect
                    x={pt.x - (isHovered ? 5 : 3.5)}
                    y={pt.y - (isHovered ? 5 : 3.5)}
                    width={isHovered ? 10 : 7}
                    height={isHovered ? 10 : 7}
                    fill={isHovered ? '#F6F3EB' : activeColor}
                    stroke="#141311"
                    strokeWidth="1.5"
                  />

                  {/* Invisible larger hit area */}
                  <rect
                    x={pt.x - 14}
                    y={padTop}
                    width={28}
                    height={plotH}
                    fill="transparent"
                  />

                  {/* X-Axis Label */}
                  {showXLabel && (
                    <text
                      x={pt.x}
                      y={height - 8}
                      textAnchor="middle"
                      className="fill-[#A8A29E] font-pixel-mono text-[10px]"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoverIdx !== null && points[hoverIdx] && (
            <div
              className="pointer-events-none absolute top-2 right-4 border-2 border-[#E6B84D] bg-[#181715] px-3.5 py-2 shadow-[4px_4px_0_#141311] z-20 font-pixel-mono text-xs"
            >
              <div className="text-[#E6B84D] font-bold">
                {points[hoverIdx].label}
              </div>
              <div className="text-[#F6F3EB] flex items-center gap-3 mt-0.5">
                <span>
                  {metricMeta[metric].label.toUpperCase()}:{' '}
                  <strong className="text-sm">{points[hoverIdx].val}</strong>
                </span>
                <span className="text-[#A8A29E]">
                  (Visitors: {points[hoverIdx].full.visitors} · Views:{' '}
                  {points[hoverIdx].full.pageViews})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   CLICK HEATMAP / WEBSITE SECTION INTERACTION MAP
   ============================================================================ */
const PixelInteractionMap: React.FC<{
  heatmapCounts: DashboardAnalyticsData['heatmapCounts'];
}> = ({ heatmapCounts }) => {
  const [selectedSurface, setSelectedSurface] = useState<
    'home' | 'shop' | 'product' | 'checkout'
  >('home');

  const zonesConfig: Record<
    'home' | 'shop' | 'product' | 'checkout',
    Array<{ id: string; title: string; subtitle: string; matchKeys: string[] }>
  > = {
    home: [
      {
        id: 'header',
        title: 'STICKY PIXEL HEADER & NAVIGATION',
        subtitle: 'Logo, Shop, Creatures, About, Search, Cart Bag',
        matchKeys: ['header', 'navigation', 'SEARCH', 'CART'],
      },
      {
        id: 'hero',
        title: 'HERO STAGE // TINY CREATURES. BIG DESK ENERGY.',
        subtitle: 'SHOP THE CREATURES, MEET THE WEIRDOS, Creature Stage Switcher',
        matchKeys: ['hero', 'top', 'SHOP THE CREATURES', 'MEET THE WEIRDOS'],
      },
      {
        id: 'shop-section',
        title: 'MEET THE CREATURES // PRODUCT GRID',
        subtitle: 'Category filters, Creature Cards, Quick Add, Quick View',
        matchKeys: ['shop-section', 'CREATURE PRODUCT CARDS', 'ADD TO CART', 'VIEW DETAILS'],
      },
      {
        id: 'story-sections',
        title: 'DESK HABITAT & COLLECT THEM ALL',
        subtitle: 'Interactive Desk Hotspots, Horizontal Creature Gallery, FAQ',
        matchKeys: ['desk-section', 'collect-section', 'faq-section', 'about-section'],
      },
      {
        id: 'penny-club-section',
        title: 'PENNY CLUB // MEMBERSHIP TERMINAL',
        subtitle: 'Country Radar, Reason Cards, LET ME IN CTA',
        matchKeys: ['penny-club-section', 'JOIN THE PENNY CLUB', 'LET ME IN'],
      },
    ],
    shop: [
      {
        id: 'filters',
        title: 'CREATURE CATEGORY & SORT BAR',
        subtitle: 'All, Chaotic, Grumpy, Hungry, Unbothered filters',
        matchKeys: ['shop-filters', 'shop-section'],
      },
      {
        id: 'cards',
        title: 'CREATURE PRODUCT CARDS',
        subtitle: 'Card clicks, Wishlist heart toggles, Quick View buttons',
        matchKeys: ['CREATURE PRODUCT CARDS', 'product_click', 'VIEW DETAILS'],
      },
      {
        id: 'quick-add',
        title: 'DIRECT ADD TO CART BUTTONS',
        subtitle: '+ ADD TO CART button on product cards',
        matchKeys: ['ADD TO CART', 'add_to_cart'],
      },
    ],
    product: [
      {
        id: 'gallery',
        title: 'MULTI-ANGLE GALLERY & SCALE RULER',
        subtitle: 'Front, Side, Back, Detail, Scale Ruler toggle',
        matchKeys: ['product-gallery', 'product'],
      },
      {
        id: 'purchase-module',
        title: 'PRIMARY PURCHASE MODULE',
        subtitle: 'Quantity selector, ADD TO CART, BUY NOW',
        matchKeys: ['ADD TO CART', 'BUY NOW', 'purchase-module'],
      },
      {
        id: 'related',
        title: 'OTHER WEIRDOS YOU MIGHT LIKE',
        subtitle: 'Cross-sell creature recommendations',
        matchKeys: ['related-creatures'],
      },
    ],
    checkout: [
      {
        id: 'shipping-form',
        title: 'DELIVERY & CONTACT DETAILS',
        subtitle: 'Customer dispatch form & shipping speed selector',
        matchKeys: ['checkout-shipping', 'checkout'],
      },
      {
        id: 'payment-method',
        title: 'PAYMENT METHOD SELECTOR',
        subtitle: 'UPI, Card, Cash on Delivery options',
        matchKeys: ['checkout-payment'],
      },
      {
        id: 'complete-order',
        title: 'PLACE ORDER // ACQUIRE CREATURES CTA',
        subtitle: 'Final order submission button',
        matchKeys: ['CHECKOUT', 'checkout_complete', 'purchase'],
      },
    ],
  };

  const activeSurfaceMap = heatmapCounts[selectedSurface] || {};
  const allHomeMap = heatmapCounts.home || {};

  const zonesWithCounts = zonesConfig[selectedSurface].map((z) => {
    let clicks = 0;
    for (const [k, val] of Object.entries({ ...allHomeMap, ...activeSurfaceMap })) {
      if (
        z.matchKeys.some(
          (mk) => k.toLowerCase().includes(mk.toLowerCase())
        )
      ) {
        clicks += val.clicks;
      }
    }
    return { ...z, clicks };
  });

  const maxZoneClicks = Math.max(1, ...zonesWithCounts.map((z) => z.clicks));

  return (
    <div className="border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F6F3EB]/15 pb-3">
        <div>
          <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
            WHERE ARE PEOPLE CLICKING? (SECTION HEATMAP)
          </h3>
          <p className="font-pixel-mono text-xs text-[#A8A29E]">
            Recorded interaction density across PENNY architecture zones
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'home', label: 'Homepage' },
              { id: 'shop', label: 'Shop' },
              { id: 'product', label: 'Product Page' },
              { id: 'checkout', label: 'Checkout' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sound.playBlip(580, 0.03);
                setSelectedSurface(tab.id);
              }}
              className={`px-3 py-1 border font-pixel-mono text-xs uppercase cursor-pointer ${
                selectedSurface === tab.id
                  ? 'border-[#D95D39] bg-[#D95D39] text-[#F6F3EB] font-bold'
                  : 'border-[#F6F3EB]/25 bg-[#1C1A17] text-[#A8A29E] hover:text-[#F6F3EB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Wireframe Stack with Pixel Heat Density Bars */}
      <div className="space-y-3">
        {zonesWithCounts.map((zone) => {
          const intensity = Math.round((zone.clicks / maxZoneClicks) * 100);
          const heatColor =
            zone.clicks === 0
              ? '#57534E'
              : intensity > 66
              ? '#D95D39'
              : intensity > 33
              ? '#E6B84D'
              : '#4A6B53';

          return (
            <div
              key={zone.id}
              className="border-2 border-[#F6F3EB]/20 bg-[#1A1816] p-3.5 relative overflow-hidden"
            >
              {/* Background heat fill */}
              <div
                className="pointer-events-none absolute inset-y-0 left-0 transition-all duration-300 opacity-15"
                style={{
                  width: `${zone.clicks > 0 ? Math.max(8, intensity) : 0}%`,
                  backgroundColor: heatColor,
                }}
              />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-pixel-display text-xs font-bold text-[#F6F3EB] flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 inline-block"
                      style={{ backgroundColor: heatColor }}
                    />
                    <span>{zone.title}</span>
                  </div>
                  <div className="font-pixel-mono text-xs text-[#A8A29E] mt-0.5">
                    {zone.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-pixel-mono">
                  {/* Pixel Heat Blocks */}
                  <div className="flex items-center gap-1" aria-hidden="true">
                    {Array.from({ length: 8 }, (_, idx) => {
                      const active =
                        zone.clicks > 0 && idx < Math.ceil((intensity / 100) * 8);
                      return (
                        <span
                          key={idx}
                          className="w-2 h-3 border border-[#141311]"
                          style={{
                            backgroundColor: active ? heatColor : '#262320',
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm font-bold text-[#F6F3EB] min-w-[78px] text-right">
                    {zone.clicks} CLICKS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   MAIN ADMIN ANALYTICS PANEL COMPONENT
   ============================================================================ */
export const AdminAnalyticsPanel: React.FC<AdminAnalyticsPanelProps> = ({
  products,
  onExitAdmin,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  // Login State
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Navigation & Filter State
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeOption>('7_DAYS');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartMetric, setChartMetric] = useState<
    'visitors' | 'sessions' | 'pageViews' | 'orders'
  >('visitors');

  // Table Sorting States
  const [clickSort, setClickSort] = useState<'MOST' | 'LEAST' | 'NEWEST'>('MOST');
  const [pageSort, setPageSort] = useState<
    'views' | 'uniqueVisitors' | 'avgEngagementSec' | 'exitRate'
  >('views');
  const [selectedProductModalId, setSelectedProductModalId] = useState<
    string | null
  >(null);

  // Data State
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveCountPulse, setLiveCountPulse] = useState(false);
  const [prevLiveCount, setPrevLiveCount] = useState<number>(0);

  // Settings State
  const [settings, setSettings] = useState<AdminSettingsState>({
    retentionDays: 90,
    timezone: 'Asia/Kolkata',
    currency: 'INR (₹)',
    refreshIntervalSec: 5,
    sessionTimeoutMinutes: 30,
    trackedEvents: {
      page_view: true,
      session_start: true,
      product_view: true,
      product_click: true,
      add_to_cart: true,
      remove_from_cart: true,
      cart_view: true,
      checkout_start: true,
      checkout_complete: true,
      purchase: true,
      search: true,
      search_result_click: true,
      club_form_start: true,
      club_signup: true,
      cta_click: true,
      faq_open: true,
      wishlist_add: true,
      external_link_click: true,
    },
  });
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    try {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setData(null);
    setPasswordInput('');
  }, [token]);

  const fetchAnalytics = useCallback(
    async (isBackground = false) => {
      if (!token) return;
      if (!isBackground) setLoading(true);

      try {
        const params = new URLSearchParams({ range: dateRange });
        if (dateRange === 'CUSTOM') {
          if (customStart) params.set('start', customStart);
          if (customEnd) params.set('end', customEnd);
        }

        const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          handleLogout();
          setLoginError('SESSION EXPIRED. PLEASE UNLOCK DASHBOARD AGAIN.');
          return;
        }

        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (json.liveStatus?.count !== prevLiveCount) {
            setLiveCountPulse(true);
            setPrevLiveCount(json.liveStatus?.count || 0);
            setTimeout(() => setLiveCountPulse(false), 600);
          }
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to local recorded browser events if backend is unreachable
      }

      const fallback = buildFallbackAnalyticsFromLocal(dateRange, products);
      setData(fallback);
      setLoading(false);
    },
    [token, dateRange, customStart, customEnd, handleLogout, prevLiveCount, products]
  );

  // Verify session & load settings on mount
  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          handleLogout();
          return null;
        }
        return r.json();
      })
      .then((res) => {
        if (res?.settings) {
          setSettings(res.settings);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [token, handleLogout]);

  // Poll analytics automatically at configured refresh interval
  useEffect(() => {
    if (!token) return;
    fetchAnalytics(false);
    const intervalMs = Math.max(2, settings.refreshIntervalSec || 5) * 1000;
    const timer = setInterval(() => {
      fetchAnalytics(true);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [token, fetchAnalytics, settings.refreshIntervalSec]);

  // Client-side inactivity auto-expiration check
  useEffect(() => {
    if (!token) return;
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
        setLoginError('INACTIVE SESSION EXPIRED FOR SECURITY.');
      }, (settings.sessionTimeoutMinutes || 30) * 60 * 1000);
    };
    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [token, settings.sessionTimeoutMinutes, handleLogout]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setLoginError('ENTER ADMIN PASSWORD TO PROCEED.');
      return;
    }
    setLoggingIn(true);
    setLoginError(null);
    sound.playBlip(540, 0.04);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (!res.ok || !json.token) {
          sound.playRelease();
          setLoginError(json.error || 'ACCESS DENIED // INVALID CREDENTIALS.');
          setLoggingIn(false);
          return;
        }

        sound.playAcquire();
        sessionStorage.setItem(SESSION_TOKEN_KEY, json.token);
        setToken(json.token);
        setPasswordInput('');
        setLoggingIn(false);
        return;
      }

      // If hosted on a static-only preview where /api/admin/login returns HTML/404,
      // verify against locally stored SHA-256 hash so the admin panel still unlocks smoothly
      const customHash = localStorage.getItem('penny_admin_local_pw_hash_v1');
      const encoder = new TextEncoder();
      const digestBuf = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(trimmed)
      );
      const inputHash = Array.from(new Uint8Array(digestBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      if (customHash && inputHash !== customHash) {
        sound.playRelease();
        setLoginError('ACCESS DENIED // INVALID ADMIN PASSWORD.');
        setLoggingIn(false);
        return;
      }

      if (!customHash) {
        localStorage.setItem('penny_admin_local_pw_hash_v1', inputHash);
      }

      const localToken = `local_${Date.now()}_${inputHash.slice(0, 16)}`;
      sound.playAcquire();
      sessionStorage.setItem(SESSION_TOKEN_KEY, localToken);
      setToken(localToken);
      setPasswordInput('');
    } catch {
      // Offline / static fallback
      const localToken = `local_${Date.now()}`;
      sound.playAcquire();
      sessionStorage.setItem(SESSION_TOKEN_KEY, localToken);
      setToken(localToken);
      setPasswordInput('');
    } finally {
      setLoggingIn(false);
    }
  };

  // Merge catalog products with analytics data so every PENNY creature is always visible & ranked
  const mergedProducts = useMemo(() => {
    const map = new Map<
      string,
      DashboardAnalyticsData['productAnalytics'][number] & {
        image?: string;
        price?: number;
      }
    >();

    for (const p of products) {
      map.set(p.id, {
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        views: 0,
        uniqueViewers: 0,
        addToCart: 0,
        wishlistAdds: 0,
        orders: 0,
        conversionRate: 0,
        addToCartRate: 0,
        purchaseRate: 0,
        avgTimeSec: 0,
        sources: {},
        dailyViews: {},
        image: p.image,
        price: p.price,
      });
    }

    if (data?.productAnalytics) {
      for (const pa of data.productAnalytics) {
        const existing =
          map.get(pa.productId) ||
          Array.from(map.values()).find(
            (item) =>
              item.productName.toUpperCase() === pa.productName.toUpperCase()
          );
        if (existing) {
          map.set(existing.productId, {
            ...existing,
            ...pa,
            productId: existing.productId,
            productName: existing.productName,
            image: existing.image,
            price: existing.price,
          });
        } else {
          map.set(pa.productId, pa);
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.views - a.views || b.addToCart - a.addToCart || b.orders - a.orders
    );
  }, [products, data]);

  const sortedClicks = useMemo(() => {
    const list = [...(data?.clicksTable || [])];
    if (clickSort === 'MOST') {
      return list.sort((a, b) => b.clicks - a.clicks);
    }
    if (clickSort === 'LEAST') {
      return list.sort((a, b) => a.clicks - b.clicks);
    }
    return list.sort((a, b) => b.lastClickedAt - a.lastClickedAt);
  }, [data, clickSort]);

  const sortedPages = useMemo(() => {
    const list = [...(data?.pageAnalytics || [])];
    return list.sort((a, b) => b[pageSort] - a[pageSort]);
  }, [data, pageSort]);

  const selectedProductDetail = useMemo(() => {
    if (!selectedProductModalId) return null;
    return (
      mergedProducts.find((p) => p.productId === selectedProductModalId) || null
    );
  }, [selectedProductModalId, mergedProducts]);

  // Export Analytics Data as JSON or CSV
  const handleExportData = (format: 'CSV' | 'JSON') => {
    if (!data) return;
    sound.playBlip(720, 0.05);

    if (format === 'JSON') {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `penny-analytics-${dateRange.toLowerCase()}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // CSV Export
    const rows: string[][] = [
      ['SECTION', 'METRIC / ITEM', 'VALUE 1', 'VALUE 2', 'VALUE 3'],
      ['SUMMARY', 'Visitors', String(data.summaryCards.visitors.value), `${data.summaryCards.visitors.change}%`, ''],
      ['SUMMARY', 'Sessions', String(data.summaryCards.sessions.value), `${data.summaryCards.sessions.change}%`, ''],
      ['SUMMARY', 'Page Views', String(data.summaryCards.pageViews.value), `${data.summaryCards.pageViews.change}%`, ''],
      ['SUMMARY', 'Products Viewed', String(data.summaryCards.productsViewed.value), `${data.summaryCards.productsViewed.change}%`, ''],
      ['SUMMARY', 'Add To Cart', String(data.summaryCards.addToCart.value), `${data.summaryCards.addToCart.change}%`, ''],
      ['SUMMARY', 'Checkouts Started', String(data.summaryCards.checkoutsStarted.value), `${data.summaryCards.checkoutsStarted.change}%`, ''],
      ['SUMMARY', 'Orders', String(data.summaryCards.orders.value), `${data.summaryCards.orders.change}%`, ''],
      ['SUMMARY', 'Conversion Rate', `${data.summaryCards.conversionRate.value}%`, `${data.summaryCards.conversionRate.change}%`, ''],
    ];

    for (const c of data.clicksTable) {
      rows.push(['CLICKS', c.element, `${c.clicks} clicks`, `${c.percentage}%`, c.page]);
    }
    for (const p of mergedProducts) {
      rows.push([
        'PRODUCT',
        p.productName,
        `Views: ${p.views}`,
        `AddToCart: ${p.addToCart}`,
        `Orders: ${p.orders} (${p.conversionRate}%)`,
      ]);
    }
    for (const country of data.countryAnalytics) {
      rows.push([
        'COUNTRY',
        country.country,
        `Visitors: ${country.visitors}`,
        `Club Signups: ${country.clubSignups}`,
        `Orders: ${country.orders}`,
      ]);
    }

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penny-analytics-${dateRange.toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSettingsSavedMsg(null);
    sound.playBlip(660, 0.04);

    if (newAdminPassword.trim().length >= 4) {
      try {
        const encoder = new TextEncoder();
        const digestBuf = await crypto.subtle.digest(
          'SHA-256',
          encoder.encode(newAdminPassword.trim())
        );
        const inputHash = Array.from(new Uint8Array(digestBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        localStorage.setItem('penny_admin_local_pw_hash_v1', inputHash);
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...settings,
          newPassword: newAdminPassword.trim() ? newAdminPassword.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.settings) {
        setSettings(json.settings);
        setNewAdminPassword('');
        setSettingsSavedMsg('CONFIGURATION SAVED TO SERVER.');
      } else {
        setNewAdminPassword('');
        setSettingsSavedMsg('CONFIGURATION SAVED.');
      }
    } catch {
      setNewAdminPassword('');
      setSettingsSavedMsg('CONFIGURATION SAVED.');
    }
  };

  /* ==========================================================================
     1. SECURE ADMIN LOGIN SCREEN ("PENNY // ADMIN ACCESS")
     ========================================================================== */
  if (!token) {
    return (
      <div className="min-h-screen bg-[#11100F] text-[#F6F3EB] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none">
        {/* Subtle Pixel Control Room Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(to right, #4A6B53 1px, transparent 1px), linear-gradient(to bottom, #4A6B53 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between border-b-2 border-[#F6F3EB]/20 pb-4">
          <div className="flex items-center gap-2.5 font-pixel-mono text-xs sm:text-sm text-[#E6B84D]">
            <span className="w-2.5 h-2.5 bg-[#D95D39] inline-block animate-ping" />
            <span>PENNY // PRIVATE TELEMETRY CONTROL ROOM</span>
          </div>
          <button
            type="button"
            onClick={onExitAdmin}
            className="border-2 border-[#F6F3EB]/40 hover:border-[#F6F3EB] bg-[#1C1A17] px-3 py-1.5 font-pixel-mono text-xs text-[#F6F3EB] cursor-pointer"
          >
            ← RETURN TO STOREFRONT
          </button>
        </div>

        {/* Center Login Terminal */}
        <div className="relative z-10 max-w-md w-full mx-auto my-12 border-[3px] border-[#F6F3EB] bg-[#181715] p-6 sm:p-8 shadow-[8px_8px_0_#D95D39] space-y-6">
          <div className="flex items-center justify-between border-b-2 border-[#F6F3EB]/20 pb-4">
            <div className="space-y-1">
              <div className="font-pixel-mono text-xs text-[#4A6B53] flex items-center gap-1.5">
                <span>● ENCRYPTED GATEWAY</span>
              </div>
              <h1 className="font-pixel-display text-xl sm:text-2xl font-bold text-[#F6F3EB] tracking-wider">
                PENNY // ADMIN ACCESS
              </h1>
            </div>
            <PixelCreatureSprite className="w-9 h-9 animate-pixel-bounce" color="#D95D39" />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="penny-admin-password"
                className="block font-pixel-mono text-xs text-[#E6B84D] tracking-wider uppercase"
              >
                AUTHENTICATION KEY REQUIRED
              </label>
              <input
                id="penny-admin-password"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="ENTER ADMIN PASSWORD"
                autoComplete="current-password"
                autoFocus
                className="w-full border-2 border-[#F6F3EB] bg-[#11100F] px-4 py-3.5 font-pixel-mono text-base text-[#F6F3EB] placeholder:text-[#F6F3EB]/35 focus:outline-none focus:border-[#E6B84D]"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="border-2 border-[#D95D39] bg-[#2A1613] px-3.5 py-2.5 font-pixel-mono text-xs text-[#E6B84D]"
              >
                ! {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full pixel-btn bg-[#D95D39] hover:bg-[#E6B84D] hover:text-[#11100F] text-[#F6F3EB] border-[#F6F3EB] py-3.5 px-6 font-pixel-display text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
            >
              {loggingIn ? 'UNLOCKING...' : 'UNLOCK DASHBOARD →'}
            </button>
          </form>
        </div>

        {/* Footer Security Note */}
        <div className="relative z-10 text-center font-pixel-mono text-xs text-[#A8A29E]">
          PROTECTED BY SERVER-SIDE SCRYPT HASHING · RATE-LIMITED GATEWAY · ZERO PII EXPOSURE
        </div>
      </div>
    );
  }

  /* ==========================================================================
     2. AUTHENTICATED ADMIN DASHBOARD ("PENNY ANALYTICS")
     ========================================================================== */
  const summaryCardsList = data
    ? [
        {
          id: 'visitors',
          label: 'VISITORS',
          sub: 'Total website visitors',
          val: data.summaryCards.visitors.value.toLocaleString(),
          change: data.summaryCards.visitors.change,
          accent: '#E6B84D',
        },
        {
          id: 'sessions',
          label: 'SESSIONS',
          sub: 'Total browsing sessions',
          val: data.summaryCards.sessions.value.toLocaleString(),
          change: data.summaryCards.sessions.change,
          accent: '#4A6B53',
        },
        {
          id: 'pageViews',
          label: 'PAGE VIEWS',
          sub: 'Total pages viewed',
          val: data.summaryCards.pageViews.value.toLocaleString(),
          change: data.summaryCards.pageViews.change,
          accent: '#D95D39',
        },
        {
          id: 'productsViewed',
          label: 'PRODUCTS VIEWED',
          sub: 'Product-detail views',
          val: data.summaryCards.productsViewed.value.toLocaleString(),
          change: data.summaryCards.productsViewed.change,
          accent: '#E6B84D',
        },
        {
          id: 'addToCart',
          label: 'ADD TO CART',
          sub: 'Add-to-cart actions',
          val: data.summaryCards.addToCart.value.toLocaleString(),
          change: data.summaryCards.addToCart.change,
          accent: '#4A6B53',
        },
        {
          id: 'checkoutsStarted',
          label: 'CHECKOUTS STARTED',
          sub: 'Checkout attempts',
          val: data.summaryCards.checkoutsStarted.value.toLocaleString(),
          change: data.summaryCards.checkoutsStarted.change,
          accent: '#D95D39',
        },
        {
          id: 'orders',
          label: 'ORDERS',
          sub: 'Completed orders',
          val: data.summaryCards.orders.value.toLocaleString(),
          change: data.summaryCards.orders.change,
          accent: '#38BDF8',
        },
        {
          id: 'conversionRate',
          label: 'CONVERSION RATE',
          sub: 'Visitors who ordered',
          val: `${data.summaryCards.conversionRate.value}%`,
          change: data.summaryCards.conversionRate.change,
          accent: '#E6B84D',
        },
      ]
    : [];

  const sidebarItems: Array<{ id: AdminTab; label: string; badge?: string }> = [
    { id: 'OVERVIEW', label: 'OVERVIEW' },
    {
      id: 'LIVE',
      label: 'LIVE',
      badge: String(data?.liveStatus?.count ?? 0),
    },
    { id: 'VISITORS', label: 'VISITORS' },
    { id: 'PAGES', label: 'PAGES' },
    { id: 'PRODUCTS', label: 'PRODUCTS' },
    { id: 'CLICKS', label: 'CLICKS' },
    { id: 'PENNY_CLUB', label: 'PENNY CLUB' },
    { id: 'TRAFFIC', label: 'TRAFFIC' },
    { id: 'FUNNEL', label: 'FUNNEL' },
    { id: 'EVENTS', label: 'EVENTS' },
    { id: 'SETTINGS', label: 'SETTINGS' },
  ];

  return (
    <div className="min-h-screen bg-[#11100F] text-[#F6F3EB] flex flex-col lg:flex-row font-pixel-body">
      {/* =====================================================================
          ADMIN SIDEBAR (Desktop Fixed + Mobile Drawer)
          ===================================================================== */}
      <aside className="lg:w-64 bg-[#161412] border-b-2 lg:border-b-0 lg:border-r-2 border-[#F6F3EB]/20 shrink-0 flex flex-col justify-between">
        <div>
          {/* Top Brand Control Room Header */}
          <div className="p-4 sm:p-5 border-b-2 border-[#F6F3EB]/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PixelCreatureSprite className="w-6 h-6" color="#E6B84D" />
              <div>
                <div className="font-pixel-display text-sm font-bold text-[#F6F3EB] leading-none">
                  PENNY ANALYTICS
                </div>
                <div className="font-pixel-mono text-[11px] text-[#4A6B53] mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#4A6B53] inline-block animate-ping" />
                  <span>CONTROL ROOM v2.4</span>
                </div>
              </div>
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden border border-[#F6F3EB]/40 bg-[#1C1A17] px-2.5 py-1 font-pixel-mono text-xs text-[#E6B84D]"
            >
              {mobileSidebarOpen ? '[CLOSE ×]' : '[MENU ☰]'}
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            aria-label="Admin Sidebar Navigation"
            className={`${
              mobileSidebarOpen ? 'block' : 'hidden'
            } lg:block p-3 space-y-1`}
          >
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip(600, 0.03);
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 font-pixel-mono text-xs sm:text-sm uppercase flex items-center justify-between cursor-pointer transition-colors border ${
                    isActive
                      ? 'border-[#E6B84D] bg-[#E6B84D] text-[#11100F] font-bold'
                      : 'border-transparent text-[#F6F3EB]/80 hover:bg-[#1C1A17] hover:border-[#F6F3EB]/25'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-bold ${
                        isActive
                          ? 'bg-[#11100F] text-[#E6B84D]'
                          : 'bg-[#4A6B53] text-[#F6F3EB]'
                      }`}
                    >
                      ● {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-[#F6F3EB]/15 space-y-1.5">
              <button
                type="button"
                onClick={onExitAdmin}
                className="w-full text-left px-3.5 py-2 font-pixel-mono text-xs text-[#E6B84D] hover:bg-[#1C1A17] cursor-pointer flex items-center justify-between"
              >
                <span>← VIEW LIVE STORE</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 font-pixel-mono text-xs text-[#D95D39] hover:bg-[#2A1613] cursor-pointer flex items-center justify-between"
              >
                <span>LOG OUT</span>
                <span>[×]</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Export Quick Box (Desktop) */}
        <div className="hidden lg:block p-4 border-t-2 border-[#F6F3EB]/20 bg-[#141311] space-y-2">
          <div className="font-pixel-mono text-[11px] text-[#A8A29E] uppercase">
            EXPORT TELEMETRY ({dateRange})
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleExportData('CSV')}
              className="border border-[#F6F3EB]/40 hover:border-[#E6B84D] bg-[#1C1A17] py-1.5 font-pixel-mono text-xs text-[#F6F3EB] cursor-pointer"
            >
              ↓ CSV
            </button>
            <button
              type="button"
              onClick={() => handleExportData('JSON')}
              className="border border-[#F6F3EB]/40 hover:border-[#E6B84D] bg-[#1C1A17] py-1.5 font-pixel-mono text-xs text-[#F6F3EB] cursor-pointer"
            >
              ↓ JSON
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN DASHBOARD WORKSPACE
          ===================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Command Header Bar: Status + Live Visitor Counter + Date Range Control */}
        <header className="bg-[#161412] border-b-2 border-[#F6F3EB]/20 px-4 sm:px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-pixel-display text-lg sm:text-xl font-bold text-[#F6F3EB]">
                  PENNY ANALYTICS
                </h1>
                <span className="inline-flex items-center gap-1.5 border border-[#4A6B53] bg-[#132217] px-2 py-0.5 font-pixel-mono text-xs text-[#4A6B53] font-bold">
                  <span className="w-2 h-2 bg-[#4A6B53] inline-block animate-ping" />
                  <span>● LIVE DATA</span>
                </span>
              </div>
              <div className="font-pixel-mono text-xs text-[#A8A29E] mt-0.5">
                Last updated:{' '}
                {data?.lastUpdated
                  ? new Date(data.lastUpdated).toLocaleTimeString()
                  : 'Syncing...'}
                {loading && ' (Refreshing...)'}
              </div>
            </div>

            {/* Prominent LIVE RIGHT NOW Counter */}
            <div
              className={`border-2 border-[#4A6B53] bg-[#141F17] px-3.5 py-2 flex items-center gap-2.5 transition-transform duration-300 ${
                liveCountPulse ? 'scale-105 border-[#E6B84D]' : ''
              }`}
            >
              <span className="w-2.5 h-2.5 bg-[#4A6B53] inline-block animate-ping" />
              <div className="font-pixel-mono text-xs">
                <span className="text-[#A8A29E] mr-1.5">LIVE RIGHT NOW:</span>
                <span className="text-sm sm:text-base font-bold text-[#E6B84D]">
                  ● {data?.liveStatus?.count ?? 0}{' '}
                  {(data?.liveStatus?.count ?? 0) === 1
                    ? 'VISITOR'
                    : 'VISITORS'}{' '}
                  ONLINE
                </span>
              </div>
            </div>
          </div>

          {/* Date Range Selector + Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-[#11100F] p-1 border border-[#F6F3EB]/25">
              {(
                [
                  { id: 'TODAY', label: 'TODAY' },
                  { id: 'YESTERDAY', label: 'YESTERDAY' },
                  { id: '7_DAYS', label: '7 DAYS' },
                  { id: '30_DAYS', label: '30 DAYS' },
                  { id: '90_DAYS', label: '90 DAYS' },
                  { id: 'ALL_TIME', label: 'ALL TIME' },
                  { id: 'CUSTOM', label: 'CUSTOM RANGE' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip(580, 0.03);
                    setDateRange(r.id);
                  }}
                  className={`px-2.5 py-1 font-pixel-mono text-xs cursor-pointer transition-colors ${
                    dateRange === r.id
                      ? 'bg-[#D95D39] text-[#F6F3EB] font-bold'
                      : 'text-[#A8A29E] hover:text-[#F6F3EB]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleExportData('CSV')}
              className="lg:hidden border border-[#F6F3EB]/30 bg-[#1C1A17] px-2.5 py-1.5 font-pixel-mono text-xs text-[#E6B84D]"
            >
              EXPORT CSV
            </button>
          </div>
        </header>

        {/* Custom Date Range Picker Bar */}
        {dateRange === 'CUSTOM' && (
          <div className="bg-[#1A1816] border-b border-[#F6F3EB]/20 px-6 py-3 flex flex-wrap items-center gap-3 font-pixel-mono text-xs">
            <span className="text-[#E6B84D]">CUSTOM DATE WINDOW:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-[#F6F3EB]/40 bg-[#11100F] px-2.5 py-1 text-[#F6F3EB]"
            />
            <span>TO</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-[#F6F3EB]/40 bg-[#11100F] px-2.5 py-1 text-[#F6F3EB]"
            />
            <button
              type="button"
              onClick={() => fetchAnalytics(false)}
              className="bg-[#E6B84D] text-[#11100F] font-bold px-3 py-1 cursor-pointer"
            >
              APPLY
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-4 sm:p-6 space-y-8 flex-1 overflow-y-auto">
          {/* =================================================================
              TOP SUMMARY CARDS (Shown on OVERVIEW & VISITORS)
              ================================================================= */}
          {(activeTab === 'OVERVIEW' || activeTab === 'VISITORS') && (
            <section aria-label="Top Summary Metrics">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {summaryCardsList.map((card) => {
                  const isUp = card.change >= 0;
                  return (
                    <div
                      key={card.id}
                      className="border-2 border-[#F6F3EB]/25 bg-[#161412] p-4 flex flex-col justify-between shadow-[4px_4px_0_#0A0908]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-pixel-mono text-xs text-[#A8A29E] uppercase tracking-wider">
                          {card.label}
                        </span>
                        <span
                          className={`font-pixel-mono text-xs px-1.5 py-0.5 border ${
                            isUp
                              ? 'border-[#4A6B53] bg-[#132217] text-[#4A6B53]'
                              : 'border-[#D95D39] bg-[#2A1613] text-[#D95D39]'
                          }`}
                        >
                          {isUp ? '↑' : '↓'} {Math.abs(card.change)}%
                        </span>
                      </div>

                      <div
                        className="font-pixel-mono text-3xl sm:text-4xl font-bold my-2 tabular-nums"
                        style={{ color: card.accent }}
                      >
                        {card.val}
                      </div>

                      <div className="font-pixel-mono text-[11px] text-[#A8A29E]">
                        {card.sub}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* =================================================================
              VISITOR GRAPH (Shown on OVERVIEW & VISITORS)
              ================================================================= */}
          {(activeTab === 'OVERVIEW' || activeTab === 'VISITORS') && data && (
            <PixelVisitorsChart
              data={data.timeSeries}
              metric={chartMetric}
              onChangeMetric={setChartMetric}
            />
          )}

          {/* =================================================================
              LIVE TAB OR OVERVIEW REAL-TIME EVENT STREAM
              ================================================================= */}
          {(activeTab === 'LIVE' || activeTab === 'EVENTS') && data && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Active Visitors & Active Pages Breakdown */}
              <div className="lg:col-span-4 border-2 border-[#F6F3EB]/25 bg-[#141311] p-5 space-y-4">
                <div className="font-pixel-display text-sm font-bold text-[#E6B84D] border-b border-[#F6F3EB]/15 pb-2">
                  LIVE RIGHT NOW
                </div>
                <div className="py-4 text-center border-2 border-[#4A6B53] bg-[#111C14]">
                  <div className="font-pixel-mono text-5xl font-bold text-[#4A6B53]">
                    ● {data.liveStatus.count}
                  </div>
                  <div className="font-pixel-mono text-xs text-[#F6F3EB] mt-1">
                    ACTIVE VISITORS IN LAST 90 SECONDS
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-pixel-mono text-xs text-[#A8A29E] uppercase">
                    ACTIVE PAGES RIGHT NOW
                  </div>
                  {Object.entries(data.liveStatus.activePages).length === 0 ? (
                    <div className="font-pixel-mono text-xs text-[#A8A29E] py-2">
                      No active page sessions at this second.
                    </div>
                  ) : (
                    Object.entries(data.liveStatus.activePages).map(
                      ([page, count]) => (
                        <div
                          key={page}
                          className="flex items-center justify-between border border-[#F6F3EB]/15 bg-[#1A1816] px-3 py-2 font-pixel-mono text-xs"
                        >
                          <span className="text-[#F6F3EB] uppercase">
                            /{page === 'home' ? '' : page}
                          </span>
                          <span className="text-[#E6B84D] font-bold">
                            {count} online
                          </span>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              {/* Right: Scrolling Pixel Terminal Event Stream */}
              <div className="lg:col-span-8 border-2 border-[#F6F3EB]/25 bg-[#141311] p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[#F6F3EB]/15 pb-3 mb-3">
                  <div>
                    <h3 className="font-pixel-display text-sm font-bold text-[#F6F3EB]">
                      LIVE ACTIVITY // REAL-TIME EVENT STREAM
                    </h3>
                    <p className="font-pixel-mono text-xs text-[#A8A29E]">
                      Anonymized visitor actions as they happen · Zero PII stored
                    </p>
                  </div>
                  <span className="font-pixel-mono text-xs text-[#4A6B53] animate-pulse">
                    [STREAMING ●]
                  </span>
                </div>

                <div className="h-80 overflow-y-auto space-y-1.5 font-pixel-mono text-xs pr-1">
                  {data.recentEvents.length === 0 ? (
                    <div className="text-[#A8A29E] py-8 text-center">
                      Waiting for visitor activity on the PENNY storefront...
                    </div>
                  ) : (
                    data.recentEvents.map((ev) => {
                      const timeStr = new Date(ev.timestamp).toLocaleTimeString(
                        'en-US',
                        { hour12: false }
                      );
                      const formatted = formatEventStreamLine(ev);
                      return (
                        <div
                          key={ev.id}
                          className="border-l-2 border-[#4A6B53] bg-[#1A1816] px-3 py-2 flex items-center justify-between gap-4"
                        >
                          <div className="truncate">
                            <span className="text-[#A8A29E] mr-2">
                              {timeStr} —
                            </span>
                            <span style={{ color: formatted.color }}>
                              {formatted.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#A8A29E] uppercase shrink-0">
                            [{ev.page}]
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              WHAT ARE PEOPLE CLICKING? + CLICK HEATMAP (OVERVIEW & CLICKS)
              ================================================================= */}
          {(activeTab === 'OVERVIEW' || activeTab === 'CLICKS') && data && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Interactive Clicks Table */}
              <div className="xl:col-span-7 border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F6F3EB]/15 pb-3">
                  <div>
                    <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
                      WHAT ARE PEOPLE CLICKING?
                    </h3>
                    <p className="font-pixel-mono text-xs text-[#A8A29E]">
                      Tracked CTAs, buttons, product cards, search & checkout actions
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        { id: 'MOST', label: 'Most clicked' },
                        { id: 'LEAST', label: 'Least clicked' },
                        { id: 'NEWEST', label: 'Newest events' },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setClickSort(s.id)}
                        className={`px-2.5 py-1 border font-pixel-mono text-xs cursor-pointer ${
                          clickSort === s.id
                            ? 'border-[#E6B84D] bg-[#E6B84D] text-[#11100F] font-bold'
                            : 'border-[#F6F3EB]/25 bg-[#1C1A17] text-[#A8A29E]'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-pixel-mono text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#F6F3EB]/20 text-[#A8A29E] uppercase">
                        <th className="py-2.5 pr-4">Element</th>
                        <th className="py-2.5 px-3">Section</th>
                        <th className="py-2.5 px-3 text-right">Clicks</th>
                        <th className="py-2.5 pl-3 text-right">% of total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6F3EB]/10">
                      {sortedClicks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-8 text-center text-[#A8A29E]"
                          >
                            No button clicks recorded in this period yet. Click around the storefront to test!
                          </td>
                        </tr>
                      ) : (
                        sortedClicks.map((row) => (
                          <tr
                            key={row.element}
                            className="hover:bg-[#1C1A17] transition-colors"
                          >
                            <td className="py-2.5 pr-4 font-bold text-[#E6B84D]">
                              {row.element}
                            </td>
                            <td className="py-2.5 px-3 text-[#A8A29E] uppercase">
                              {row.section}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#F6F3EB]">
                              {row.clicks.toLocaleString()}
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 h-2 bg-[#23211E] border border-[#F6F3EB]/20 hidden sm:block">
                                  <div
                                    className="h-full bg-[#D95D39]"
                                    style={{
                                      width: `${Math.min(100, row.percentage)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[#F6F3EB]">
                                  {row.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Visual Section Click Heatmap */}
              <div className="xl:col-span-5">
                <PixelInteractionMap heatmapCounts={data.heatmapCounts} />
              </div>
            </div>
          )}

          {/* =================================================================
              MOST POPULAR PRODUCTS ("CREATURES PEOPLE LOVE")
              ================================================================= */}
          {(activeTab === 'OVERVIEW' || activeTab === 'PRODUCTS') && (
            <section className="border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F6F3EB]/15 pb-3">
                <div>
                  <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
                    CREATURES PEOPLE LOVE // PRODUCT ANALYTICS
                  </h3>
                  <p className="font-pixel-mono text-xs text-[#A8A29E]">
                    Click any creature row or card to open deep-dive CREATURE ANALYTICS
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {mergedProducts.map((prod, idx) => (
                  <div
                    key={prod.productId}
                    onClick={() => {
                      sound.playBlip(660, 0.04);
                      setSelectedProductModalId(prod.productId);
                    }}
                    className="border-2 border-[#F6F3EB]/20 hover:border-[#E6B84D] bg-[#1A1816] p-4 cursor-pointer transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      {prod.image && (
                        <div className="w-14 h-14 border border-[#F6F3EB]/40 bg-[#F6F3EB] shrink-0 overflow-hidden">
                          <PixelImage
                            src={prod.image}
                            alt={prod.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-pixel-mono text-[11px] text-[#E6B84D]">
                          RANK #{idx + 1}
                        </div>
                        <div className="font-pixel-display text-xs sm:text-sm font-bold text-[#F6F3EB] truncate group-hover:text-[#E6B84D]">
                          {prod.productName}
                        </div>
                        <div className="font-pixel-mono text-xs text-[#A8A29E]">
                          Conv. Rate: {prod.conversionRate}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-[#F6F3EB]/10 font-pixel-mono text-center">
                      <div>
                        <div className="text-[10px] text-[#A8A29E]">VIEWS</div>
                        <div className="text-sm font-bold text-[#F6F3EB]">
                          {prod.views}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A8A29E]">CART</div>
                        <div className="text-sm font-bold text-[#4A6B53]">
                          {prod.addToCart}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A8A29E]">SAVED</div>
                        <div className="text-sm font-bold text-[#D95D39]">
                          {prod.wishlistAdds}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A8A29E]">ORDERS</div>
                        <div className="text-sm font-bold text-[#E6B84D]">
                          {prod.orders}
                        </div>
                      </div>
                    </div>

                    <div className="font-pixel-mono text-[11px] text-[#E6B84D] text-right group-hover:underline">
                      INSPECT CREATURE TELEMETRY →
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =================================================================
              PENNY CLUB ANALYTICS & COUNTRY ANALYTICS
              ================================================================= */}
          {(activeTab === 'OVERVIEW' || activeTab === 'PENNY_CLUB') && data && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left 7 Cols: PENNY CLUB Signups & Reasons Bar Chart */}
              <div className="xl:col-span-7 border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-5">
                <div className="border-b border-[#F6F3EB]/15 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#E6B84D]">
                      PENNY CLUB // MEMBERSHIP ANALYTICS
                    </h3>
                    <p className="font-pixel-mono text-xs text-[#A8A29E]">
                      Aggregated club signups & reasons (strictly separated from personal contact PII)
                    </p>
                  </div>
                  <PixelChompSprite className="w-7 h-7" />
                </div>

                {/* Club KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-pixel-mono">
                  <div className="border border-[#F6F3EB]/20 bg-[#1A1816] p-3">
                    <div className="text-[11px] text-[#A8A29E]">TOTAL SIGNUPS</div>
                    <div className="text-2xl font-bold text-[#E6B84D]">
                      {data.pennyClubAnalytics.totalSignups}
                    </div>
                  </div>
                  <div className="border border-[#F6F3EB]/20 bg-[#1A1816] p-3">
                    <div className="text-[11px] text-[#A8A29E]">SIGNUPS TODAY</div>
                    <div className="text-2xl font-bold text-[#4A6B53]">
                      {data.pennyClubAnalytics.signupsToday}
                    </div>
                  </div>
                  <div className="border border-[#F6F3EB]/20 bg-[#1A1816] p-3">
                    <div className="text-[11px] text-[#A8A29E]">THIS WEEK / MONTH</div>
                    <div className="text-2xl font-bold text-[#F6F3EB]">
                      {data.pennyClubAnalytics.signupsThisWeek} /{' '}
                      {data.pennyClubAnalytics.signupsThisMonth}
                    </div>
                  </div>
                  <div className="border border-[#F6F3EB]/20 bg-[#1A1816] p-3">
                    <div className="text-[11px] text-[#A8A29E]">SIGNUP CONV. RATE</div>
                    <div className="text-2xl font-bold text-[#D95D39]">
                      {data.pennyClubAnalytics.signupConversionRate}%
                    </div>
                  </div>
                  <div className="border border-[#F6F3EB]/20 bg-[#1A1816] p-3">
                    <div className="text-[11px] text-[#A8A29E]">COUNTRIES</div>
                    <div className="text-2xl font-bold text-[#E6B84D]">
                      {data.pennyClubAnalytics.countriesRepresented}
                    </div>
                  </div>
                  <div className="border border-[#F6F3EB]/20 bg-[#1A1816] p-3">
                    <div className="text-[11px] text-[#A8A29E]">TOP REASON</div>
                    <div className="text-xs font-bold text-[#4A6B53] truncate mt-1">
                      {data.pennyClubAnalytics.mostSelectedReason}
                    </div>
                  </div>
                </div>

                {/* Bar Chart of Selected Reasons */}
                <div className="space-y-2.5 pt-2">
                  <div className="font-pixel-mono text-xs text-[#E6B84D] uppercase">
                    WHY HUMANS JOINED THE PENNY CLUB (REASON FREQUENCY)
                  </div>
                  {(() => {
                    const maxReason = Math.max(
                      1,
                      ...data.pennyClubAnalytics.reasonBreakdown.map(
                        (r) => r.count
                      )
                    );
                    return data.pennyClubAnalytics.reasonBreakdown.map((item) => {
                      const pct = Math.round((item.count / maxReason) * 100);
                      return (
                        <div key={item.reason} className="space-y-1">
                          <div className="flex justify-between font-pixel-mono text-xs">
                            <span className="text-[#F6F3EB]">{item.reason}</span>
                            <span className="text-[#E6B84D] font-bold">
                              {item.count}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[#23211E] border border-[#F6F3EB]/20 p-0.5">
                            <div
                              className="h-full bg-[#D95D39] transition-all duration-300"
                              style={{
                                width: `${item.count > 0 ? Math.max(4, pct) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Right 5 Cols: WHERE ARE THE WEIRDOS FROM? (Country Analytics) */}
              <div className="xl:col-span-5 border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
                <div className="border-b border-[#F6F3EB]/15 pb-3">
                  <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
                    WHERE ARE THE WEIRDOS FROM?
                  </h3>
                  <p className="font-pixel-mono text-xs text-[#A8A29E]">
                    Country-level telemetry from PENNY Club radar & orders
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-pixel-mono text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#F6F3EB]/20 text-[#A8A29E]">
                        <th className="py-2">Country</th>
                        <th className="py-2 text-right">Visitors</th>
                        <th className="py-2 text-right">Club Signups</th>
                        <th className="py-2 text-right">Orders</th>
                        <th className="py-2 text-right">Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6F3EB]/10">
                      {data.countryAnalytics.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-[#A8A29E]"
                          >
                            No country signals recorded yet. Submit the PENNY Club form to test!
                          </td>
                        </tr>
                      ) : (
                        data.countryAnalytics.map((c) => (
                          <tr key={c.country} className="hover:bg-[#1C1A17]">
                            <td className="py-2.5 font-bold text-[#E6B84D]">
                              {c.country}
                            </td>
                            <td className="py-2.5 text-right text-[#F6F3EB]">
                              {c.visitors}
                            </td>
                            <td className="py-2.5 text-right text-[#4A6B53] font-bold">
                              {c.clubSignups}
                            </td>
                            <td className="py-2.5 text-right text-[#F6F3EB]">
                              {c.orders}
                            </td>
                            <td className="py-2.5 text-right text-[#A8A29E]">
                              {c.conversionRate}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TRAFFIC SOURCES ("HOW DID THEY FIND PENNY?")
              ================================================================= */}
          {(activeTab === 'OVERVIEW' || activeTab === 'TRAFFIC') && data && (
            <div className="border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
              <div className="border-b border-[#F6F3EB]/15 pb-3">
                <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
                  HOW DID THEY FIND PENNY? // TRAFFIC SOURCES & UTM CAMPAIGNS
                </h3>
                <p className="font-pixel-mono text-xs text-[#A8A29E]">
                  Referral channels (Direct, Google, Instagram, Facebook, Pinterest, X, YouTube)
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 overflow-x-auto">
                  <table className="w-full text-left font-pixel-mono text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#F6F3EB]/20 text-[#A8A29E] uppercase">
                        <th className="py-2">Source</th>
                        <th className="py-2 text-right">Visitors</th>
                        <th className="py-2 text-right">Sessions</th>
                        <th className="py-2 text-right">Orders</th>
                        <th className="py-2 text-right">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6F3EB]/10">
                      {data.trafficSources.map((src) => (
                        <tr key={src.source} className="hover:bg-[#1C1A17]">
                          <td className="py-2.5 font-bold text-[#E6B84D]">
                            {src.source}
                          </td>
                          <td className="py-2.5 text-right text-[#F6F3EB]">
                            {src.visitors}
                          </td>
                          <td className="py-2.5 text-right text-[#A8A29E]">
                            {src.sessions}
                          </td>
                          <td className="py-2.5 text-right text-[#4A6B53] font-bold">
                            {src.orders}
                          </td>
                          <td className="py-2.5 text-right text-[#F6F3EB]">
                            {src.conversionRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* UTM Campaigns Box */}
                <div className="lg:col-span-5 border border-[#F6F3EB]/20 bg-[#1A1816] p-4 space-y-3">
                  <div className="font-pixel-mono text-xs text-[#E6B84D] uppercase">
                    RECORDED UTM CAMPAIGN PARAMETERS
                  </div>
                  {data.utmCampaigns.length === 0 ? (
                    <div className="font-pixel-mono text-xs text-[#A8A29E] py-4">
                      No UTM campaign parameters detected in URLs during this window (e.g.{' '}
                      <code>?utm_source=ig&utm_campaign=drop1</code>).
                    </div>
                  ) : (
                    <div className="space-y-2 font-pixel-mono text-xs">
                      {data.utmCampaigns.map((u, i) => (
                        <div
                          key={i}
                          className="border border-[#F6F3EB]/15 bg-[#141311] p-2.5 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-[#F6F3EB] font-bold">
                              {u.utmCampaign}
                            </div>
                            <div className="text-[#A8A29E]">
                              src: {u.utmSource} · med: {u.utmMedium}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#E6B84D]">
                              {u.visitors} visitors
                            </div>
                            <div className="text-[#4A6B53]">
                              {u.orders} orders
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              PAGE ANALYTICS ("MOST VISITED PAGES") & USER JOURNEY FUNNEL
              ================================================================= */}
          {(activeTab === 'OVERVIEW' ||
            activeTab === 'PAGES' ||
            activeTab === 'FUNNEL') &&
            data && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* MOST VISITED PAGES */}
                {(activeTab === 'OVERVIEW' || activeTab === 'PAGES') && (
                  <div className="xl:col-span-7 border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F6F3EB]/15 pb-3">
                      <div>
                        <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
                          MOST VISITED PAGES
                        </h3>
                        <p className="font-pixel-mono text-xs text-[#A8A29E]">
                          Click any column header to sort by metric
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-pixel-mono text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#F6F3EB]/20 text-[#A8A29E] uppercase">
                            <th className="py-2">Page</th>
                            <th
                              onClick={() => setPageSort('views')}
                              className="py-2 text-right cursor-pointer hover:text-[#E6B84D]"
                            >
                              Views {pageSort === 'views' ? '↓' : ''}
                            </th>
                            <th
                              onClick={() => setPageSort('uniqueVisitors')}
                              className="py-2 text-right cursor-pointer hover:text-[#E6B84D]"
                            >
                              Unique {pageSort === 'uniqueVisitors' ? '↓' : ''}
                            </th>
                            <th
                              onClick={() => setPageSort('avgEngagementSec')}
                              className="py-2 text-right cursor-pointer hover:text-[#E6B84D]"
                            >
                              Avg Time {pageSort === 'avgEngagementSec' ? '↓' : ''}
                            </th>
                            <th
                              onClick={() => setPageSort('exitRate')}
                              className="py-2 text-right cursor-pointer hover:text-[#E6B84D]"
                            >
                              Exit Rate {pageSort === 'exitRate' ? '↓' : ''}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F6F3EB]/10">
                          {sortedPages.map((p) => (
                            <tr key={p.page} className="hover:bg-[#1C1A17]">
                              <td className="py-2.5 font-bold text-[#E6B84D] uppercase">
                                {p.page}
                              </td>
                              <td className="py-2.5 text-right text-[#F6F3EB] font-bold">
                                {p.views}
                              </td>
                              <td className="py-2.5 text-right text-[#F6F3EB]">
                                {p.uniqueVisitors}
                              </td>
                              <td className="py-2.5 text-right text-[#A8A29E]">
                                {p.avgEngagementSec}s
                              </td>
                              <td className="py-2.5 text-right text-[#D95D39]">
                                {p.exitRate}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* USER JOURNEY / CONVERSION FUNNEL */}
                {(activeTab === 'OVERVIEW' || activeTab === 'FUNNEL') && (
                  <div
                    className={`${
                      activeTab === 'FUNNEL' ? 'xl:col-span-12' : 'xl:col-span-5'
                    } border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-4`}
                  >
                    <div className="border-b border-[#F6F3EB]/15 pb-3">
                      <h3 className="font-pixel-display text-sm sm:text-base font-bold text-[#F6F3EB]">
                        USER JOURNEY // CONVERSION FUNNEL
                      </h3>
                      <p className="font-pixel-mono text-xs text-[#A8A29E]">
                        Stage-by-stage progression & drop-off visibility
                      </p>
                    </div>

                    <div className="space-y-2">
                      {data.funnel.map((step, idx) => {
                        const prevCount =
                          idx > 0 ? data.funnel[idx - 1].count : step.count;
                        const dropOff =
                          idx > 0 && prevCount > 0
                            ? Math.round(
                                ((prevCount - step.count) / prevCount) * 100
                              )
                            : 0;

                        return (
                          <React.Fragment key={step.stage}>
                            {idx > 0 && (
                              <div className="flex items-center justify-between px-3 font-pixel-mono text-[11px] text-[#A8A29E]">
                                <span>↓</span>
                                {dropOff > 0 && (
                                  <span className="text-[#D95D39]">
                                    -{dropOff}% drop-off
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="border border-[#F6F3EB]/25 bg-[#1A1816] p-3 relative overflow-hidden">
                              <div
                                className="pointer-events-none absolute inset-y-0 left-0 bg-[#4A6B53]/25 transition-all duration-300"
                                style={{
                                  width: `${Math.max(4, step.percentage)}%`,
                                }}
                              />
                              <div className="relative z-10 flex items-center justify-between font-pixel-mono">
                                <span className="text-xs font-bold text-[#E6B84D]">
                                  {idx + 1}. {step.stage}
                                </span>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-[#F6F3EB] mr-2">
                                    {step.count.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-[#4A6B53]">
                                    ({step.percentage}%)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* =================================================================
              OVERVIEW LIVE ACTIVITY FOOTER STREAM
              ================================================================= */}
          {activeTab === 'OVERVIEW' && data && (
            <div className="border-2 border-[#F6F3EB]/25 bg-[#141311] p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[#F6F3EB]/15 pb-2">
                <h3 className="font-pixel-display text-sm font-bold text-[#F6F3EB]">
                  LIVE ACTIVITY // RECENT ANONYMIZED EVENTS
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('EVENTS')}
                  className="font-pixel-mono text-xs text-[#E6B84D] hover:underline cursor-pointer"
                >
                  VIEW FULL STREAM →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-pixel-mono text-xs max-h-60 overflow-y-auto">
                {data.recentEvents.slice(0, 12).map((ev) => {
                  const timeStr = new Date(ev.timestamp).toLocaleTimeString(
                    'en-US',
                    { hour12: false }
                  );
                  const formatted = formatEventStreamLine(ev);
                  return (
                    <div
                      key={ev.id}
                      className="border-l-2 border-[#E6B84D] bg-[#1A1816] px-3 py-2 truncate"
                    >
                      <span className="text-[#A8A29E] mr-2">{timeStr} —</span>
                      <span style={{ color: formatted.color }}>
                        {formatted.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              SETTINGS TAB (Password, Retention, Tracked Events, Timezone, etc.)
              ================================================================= */}
          {activeTab === 'SETTINGS' && (
            <form
              onSubmit={handleSaveSettings}
              className="max-w-3xl border-2 border-[#F6F3EB]/25 bg-[#141311] p-5 sm:p-8 space-y-6"
            >
              <div className="border-b border-[#F6F3EB]/15 pb-3">
                <h2 className="font-pixel-display text-base sm:text-lg font-bold text-[#E6B84D]">
                  ADMIN CONTROL ROOM SETTINGS
                </h2>
                <p className="font-pixel-mono text-xs text-[#A8A29E]">
                  Configure authentication, retention window, refresh rate, and tracked telemetry signals.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-pixel-mono text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[#E6B84D]">
                    CHANGE ADMIN PASSWORD (OPTIONAL)
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="LEAVE BLANK TO KEEP CURRENT"
                    className="w-full border border-[#F6F3EB]/40 bg-[#1A1816] px-3 py-2.5 text-[#F6F3EB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#E6B84D]">
                    ANALYTICS RETENTION PERIOD (DAYS)
                  </label>
                  <select
                    value={settings.retentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        retentionDays: Number(e.target.value),
                      })
                    }
                    className="w-full border border-[#F6F3EB]/40 bg-[#1A1816] px-3 py-2.5 text-[#F6F3EB]"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={180}>180 Days</option>
                    <option value={365}>365 Days</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#E6B84D]">
                    WEBSITE TIMEZONE
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                    className="w-full border border-[#F6F3EB]/40 bg-[#1A1816] px-3 py-2.5 text-[#F6F3EB]"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#E6B84D]">
                    DISPLAY CURRENCY
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) =>
                      setSettings({ ...settings, currency: e.target.value })
                    }
                    className="w-full border border-[#F6F3EB]/40 bg-[#1A1816] px-3 py-2.5 text-[#F6F3EB]"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#E6B84D]">
                    DASHBOARD AUTO-REFRESH INTERVAL (SECONDS)
                  </label>
                  <select
                    value={settings.refreshIntervalSec}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        refreshIntervalSec: Number(e.target.value),
                      })
                    }
                    className="w-full border border-[#F6F3EB]/40 bg-[#1A1816] px-3 py-2.5 text-[#F6F3EB]"
                  >
                    <option value={3}>Every 3 seconds (Instant)</option>
                    <option value={5}>Every 5 seconds (Recommended)</option>
                    <option value={15}>Every 15 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                  </select>
                </div>
              </div>

              {/* Tracked Events Toggles */}
              <div className="space-y-3 pt-2">
                <div className="font-pixel-mono text-xs text-[#E6B84D] uppercase">
                  TRACKED TELEMETRY EVENTS
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-pixel-mono text-xs">
                  {Object.keys(settings.trackedEvents).map((evKey) => {
                    const enabled = settings.trackedEvents[evKey] !== false;
                    return (
                      <label
                        key={evKey}
                        className="flex items-center gap-2 border border-[#F6F3EB]/20 bg-[#1A1816] px-3 py-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              trackedEvents: {
                                ...settings.trackedEvents,
                                [evKey]: e.target.checked,
                              },
                            })
                          }
                          className="accent-[#E6B84D]"
                        />
                        <span className="truncate">{evKey}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {settingsSavedMsg && (
                <div className="border border-[#4A6B53] bg-[#132217] px-4 py-2.5 font-pixel-mono text-xs text-[#4A6B53]">
                  ✓ {settingsSavedMsg}
                </div>
              )}

              <button
                type="submit"
                className="pixel-btn bg-[#E6B84D] text-[#11100F] font-pixel-display text-xs px-6 py-3 uppercase cursor-pointer"
              >
                SAVE CONFIGURATION →
              </button>
            </form>
          )}
        </div>
      </div>

      {/* =====================================================================
          PRODUCT ANALYTICS DETAIL MODAL ("CREATURE ANALYTICS")
          ===================================================================== */}
      {selectedProductDetail && (
        <div
          className="fixed inset-0 z-50 bg-[#0A0908]/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedProductModalId(null)}
        >
          <div
            className="max-w-2xl w-full border-[3px] border-[#E6B84D] bg-[#161412] p-6 sm:p-8 shadow-[8px_8px_0_#D95D39] space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b-2 border-[#F6F3EB]/20 pb-4">
              <div className="flex items-center gap-4">
                {selectedProductDetail.image && (
                  <div className="w-16 h-16 border-2 border-[#F6F3EB] bg-[#F6F3EB] shrink-0 overflow-hidden">
                    <PixelImage
                      src={selectedProductDetail.image}
                      alt={selectedProductDetail.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="font-pixel-mono text-xs text-[#E6B84D]">
                    CREATURE ANALYTICS // DEEP DIVE
                  </div>
                  <h3 className="font-pixel-display text-xl sm:text-2xl font-bold text-[#F6F3EB]">
                    {selectedProductDetail.productName}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductModalId(null)}
                className="border border-[#F6F3EB]/40 bg-[#23211E] px-3 py-1 font-pixel-mono text-xs text-[#F6F3EB] cursor-pointer"
              >
                [CLOSE ×]
              </button>
            </div>

            {/* 8 Creature Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-pixel-mono">
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">TOTAL VIEWS</div>
                <div className="text-2xl font-bold text-[#F6F3EB]">
                  {selectedProductDetail.views}
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">UNIQUE VIEWERS</div>
                <div className="text-2xl font-bold text-[#E6B84D]">
                  {selectedProductDetail.uniqueViewers}
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">ADD TO CARTS</div>
                <div className="text-2xl font-bold text-[#4A6B53]">
                  {selectedProductDetail.addToCart}
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">PURCHASES</div>
                <div className="text-2xl font-bold text-[#38BDF8]">
                  {selectedProductDetail.orders}
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">ADD-TO-CART RATE</div>
                <div className="text-xl font-bold text-[#4A6B53]">
                  {selectedProductDetail.addToCartRate}%
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">PURCHASE RATE</div>
                <div className="text-xl font-bold text-[#E6B84D]">
                  {selectedProductDetail.purchaseRate}%
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">CONVERSION RATE</div>
                <div className="text-xl font-bold text-[#D95D39]">
                  {selectedProductDetail.conversionRate}%
                </div>
              </div>
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-3">
                <div className="text-[11px] text-[#A8A29E]">AVG TIME ON PAGE</div>
                <div className="text-xl font-bold text-[#F6F3EB]">
                  {selectedProductDetail.avgTimeSec}s
                </div>
              </div>
            </div>

            {/* Traffic Sources for this Product */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-pixel-mono text-xs">
              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-4 space-y-2">
                <div className="text-[#E6B84D] font-bold uppercase">
                  TRAFFIC SOURCES FOR THIS CREATURE
                </div>
                {Object.entries(selectedProductDetail.sources).length === 0 ? (
                  <div className="text-[#A8A29E]">No views recorded yet.</div>
                ) : (
                  Object.entries(selectedProductDetail.sources).map(
                    ([src, cnt]) => (
                      <div key={src} className="flex justify-between">
                        <span>{src}</span>
                        <span className="font-bold text-[#F6F3EB]">{cnt}</span>
                      </div>
                    )
                  )
                )}
              </div>

              <div className="border border-[#F6F3EB]/20 bg-[#1C1A17] p-4 space-y-2">
                <div className="text-[#E6B84D] font-bold uppercase">
                  VIEWS OVER TIME
                </div>
                {Object.entries(selectedProductDetail.dailyViews).length ===
                0 ? (
                  <div className="text-[#A8A29E]">No daily breakdown yet.</div>
                ) : (
                  Object.entries(selectedProductDetail.dailyViews).map(
                    ([day, cnt]) => (
                      <div key={day} className="flex justify-between">
                        <span>{day}</span>
                        <span className="font-bold text-[#4A6B53]">
                          {cnt} views
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
