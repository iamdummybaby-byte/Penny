// Non-blocking, privacy-preserving real-time analytics tracking client for PENNY

export type AnalyticsEventType =
  | 'page_view'
  | 'session_start'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_view'
  | 'checkout_start'
  | 'checkout_complete'
  | 'purchase'
  | 'search'
  | 'search_result_click'
  | 'club_form_start'
  | 'club_signup'
  | 'cta_click'
  | 'faq_open'
  | 'wishlist_add'
  | 'external_link_click'
  | 'heartbeat'
  | 'product_dwell';

export interface TrackEventPayload {
  type: AnalyticsEventType;
  page?: string;
  section?: string;
  elementName?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  quantity?: number;
  orderValue?: number;
  country?: string;
  clubReasons?: string[];
  durationSec?: number;
  heatmapZone?: string;
  xPercent?: number;
  yPercent?: number;
}

const VISITOR_KEY = 'penny_anon_vid_v1';
const SESSION_KEY = 'penny_anon_sid_v1';
const SESSION_TS_KEY = 'penny_anon_sid_ts_v1';
const LOCAL_FALLBACK_EVENTS_KEY = 'penny_analytics_local_events_v1';

function generateRandomId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36).slice(-5);
  return `${prefix}_${randomPart}${timePart}`;
}

export function getAnonymousVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_KEY);
    if (!vid) {
      vid = generateRandomId('v');
      localStorage.setItem(VISITOR_KEY, vid);
    }
    return vid;
  } catch {
    return 'v_ephemeral';
  }
}

export function getAnonymousSessionId(): { sessionId: string; isNewSession: boolean } {
  try {
    const now = Date.now();
    const lastActive = Number(sessionStorage.getItem(SESSION_TS_KEY) || '0');
    let sid = sessionStorage.getItem(SESSION_KEY);
    const thirtyMin = 30 * 60 * 1000;

    if (!sid || now - lastActive > thirtyMin) {
      sid = generateRandomId('s');
      sessionStorage.setItem(SESSION_KEY, sid);
      sessionStorage.setItem(SESSION_TS_KEY, String(now));
      return { sessionId: sid, isNewSession: true };
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return { sessionId: sid, isNewSession: false };
  } catch {
    return { sessionId: 's_ephemeral', isNewSession: false };
  }
}

export function detectTrafficSource(): {
  referrerSource: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || undefined;
    const utmMedium = params.get('utm_medium') || undefined;
    const utmCampaign = params.get('utm_campaign') || undefined;

    if (utmSource) {
      const lower = utmSource.toLowerCase();
      if (lower.includes('google')) return { referrerSource: 'Google', utmSource, utmMedium, utmCampaign };
      if (lower.includes('ig') || lower.includes('instagram')) return { referrerSource: 'Instagram', utmSource, utmMedium, utmCampaign };
      if (lower.includes('fb') || lower.includes('facebook')) return { referrerSource: 'Facebook', utmSource, utmMedium, utmCampaign };
      if (lower.includes('pin')) return { referrerSource: 'Pinterest', utmSource, utmMedium, utmCampaign };
      if (lower.includes('twitter') || lower === 'x') return { referrerSource: 'X', utmSource, utmMedium, utmCampaign };
      if (lower.includes('yt') || lower.includes('youtube')) return { referrerSource: 'YouTube', utmSource, utmMedium, utmCampaign };
      return { referrerSource: 'Other referral', utmSource, utmMedium, utmCampaign };
    }

    const ref = (document.referrer || '').toLowerCase();
    if (!ref || ref.includes(window.location.hostname)) {
      return { referrerSource: 'Direct' };
    }
    if (ref.includes('google.')) return { referrerSource: 'Google' };
    if (ref.includes('instagram.com')) return { referrerSource: 'Instagram' };
    if (ref.includes('facebook.com') || ref.includes('fb.com')) return { referrerSource: 'Facebook' };
    if (ref.includes('pinterest.com')) return { referrerSource: 'Pinterest' };
    if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return { referrerSource: 'X' };
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) return { referrerSource: 'YouTube' };
    return { referrerSource: 'Other referral' };
  } catch {
    return { referrerSource: 'Direct' };
  }
}

let currentPageName = 'home';

export function setAnalyticsCurrentPage(page: string) {
  currentPageName = page;
}

function appendToLocalFallback(fullEvent: Record<string, unknown>) {
  try {
    if (fullEvent.type === 'heartbeat') return;
    const raw = localStorage.getItem(LOCAL_FALLBACK_EVENTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({
      ...fullEvent,
      id: generateRandomId('ev'),
    });
    if (list.length > 1500) {
      list.splice(0, list.length - 1500);
    }
    localStorage.setItem(LOCAL_FALLBACK_EVENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

export function getLocalFallbackEvents(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Non-blocking asynchronous event transmission.
 * Never blocks UI clicks, navigation, or animations.
 */
export function trackEvent(payload: TrackEventPayload): void {
  // Schedule on next microtask/idle frame so UI thread is 100% unblocked
  setTimeout(() => {
    try {
      const visitorId = getAnonymousVisitorId();
      const { sessionId } = getAnonymousSessionId();
      const traffic = detectTrafficSource();

      const eventRecord = {
        ...payload,
        timestamp: Date.now(),
        visitorId,
        sessionId,
        page: payload.page || currentPageName,
        referrerSource: traffic.referrerSource,
        utmSource: traffic.utmSource,
        utmMedium: traffic.utmMedium,
        utmCampaign: traffic.utmCampaign,
      };

      // Save a local mirror so even static-only preview environments have real recorded events
      appendToLocalFallback(eventRecord);

      const bodyStr = JSON.stringify(eventRecord);

      fetch('/api/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true,
      }).catch(() => {
        // Silently ignore network errors so customer experience is never affected
      });
    } catch {
      // Never throw inside analytics
    }
  }, 0);
}

/**
 * Convenience helper for CTA & button clicks
 */
export function trackCtaClick(
  elementName: string,
  section: string,
  page?: string,
  heatmapZone?: string
): void {
  trackEvent({
    type: 'cta_click',
    elementName,
    section,
    page: page || currentPageName,
    heatmapZone: heatmapZone || section,
  });
}
