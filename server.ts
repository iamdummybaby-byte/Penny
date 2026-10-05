import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'analytics-db.json');

/* ============================================================================
   TYPES & INTERFACES
   ============================================================================ */

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

export interface AnalyticsEventRecord {
  id: string;
  type: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  visitorId: string;
  page: string; // 'home' | 'shop' | 'product' | 'checkout' | 'about' | 'faq' | 'penny-club'
  section?: string;
  elementName?: string; // CTA button label or clicked element
  productId?: string;
  productName?: string;
  productSlug?: string;
  quantity?: number;
  orderValue?: number;
  country?: string;
  clubReasons?: string[];
  referrerSource?: string; // 'Direct' | 'Google' | 'Instagram' | 'Facebook' | 'Pinterest' | 'X' | 'YouTube' | 'Other referral'
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  durationSec?: number; // For page/product dwell
  heatmapZone?: string; // Section / zone clicked for interaction map
  xPercent?: number;
  yPercent?: number;
}

export interface AdminSettings {
  passwordSalt: string;
  passwordHash: string;
  passwordCustomized?: boolean;
  retentionDays: number;
  timezone: string;
  currency: string;
  refreshIntervalSec: number;
  sessionTimeoutMinutes: number;
  trackedEvents: Record<string, boolean>;
}

export interface AnalyticsDatabase {
  events: AnalyticsEventRecord[];
  settings: AdminSettings;
}

/* ============================================================================
   CRYPTO PASSWORD HASHING & SESSION MANAGEMENT
   ============================================================================ */

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const candidateHash = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}

const DEFAULT_TRACKED_EVENTS: Record<string, boolean> = {
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
};

function createDefaultDatabase(): AnalyticsDatabase {
  const initialPassword = process.env.ADMIN_PASSWORD || 'penny-admin';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(initialPassword, salt);

  return {
    events: [],
    settings: {
      passwordSalt: salt,
      passwordHash,
      retentionDays: 90,
      timezone: 'Asia/Kolkata',
      currency: 'INR (₹)',
      refreshIntervalSec: 5,
      sessionTimeoutMinutes: 30,
      trackedEvents: { ...DEFAULT_TRACKED_EVENTS },
    },
  };
}

let db: AnalyticsDatabase = createDefaultDatabase();

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AnalyticsDatabase;
      if (parsed && Array.isArray(parsed.events) && parsed.settings) {
        db = {
          events: parsed.events,
          settings: {
            ...createDefaultDatabase().settings,
            ...parsed.settings,
            trackedEvents: {
              ...DEFAULT_TRACKED_EVENTS,
              ...(parsed.settings.trackedEvents || {}),
            },
          },
        };
        return;
      }
    }
    saveDatabaseImmediate();
  } catch (err) {
    console.error('Failed to load analytics DB, using in-memory store:', err);
  }
}

let saveTimer: NodeJS.Timeout | null = null;

function saveDatabaseImmediate() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Prune events older than retentionDays
    const cutoff =
      Date.now() - db.settings.retentionDays * 24 * 60 * 60 * 1000;
    if (db.events.length > 25000) {
      db.events = db.events.filter((e) => e.timestamp >= cutoff).slice(-25000);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist analytics DB:', err);
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveDatabaseImmediate();
  }, 1500);
}

loadDatabase();

/* ============================================================================
   ACTIVE SESSIONS & LOGIN RATE LIMITING
   ============================================================================ */

interface AdminSession {
  token: string;
  createdAt: number;
  lastActiveAt: number;
}

const adminSessions = new Map<string, AdminSession>();

function getSigningSecret(): string {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.GEMINI_API_KEY ||
    'penny-control-room-hmac-secret-2026'
  );
}

function createStatelessToken(expiresInMinutes = 30): string {
  const exp = Date.now() + expiresInMinutes * 60 * 1000;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${exp}.${nonce}`;
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

function verifyStatelessToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const exp = Number(expStr);
  if (Number.isNaN(exp) || Date.now() > exp) return false;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${expStr}.${nonce}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch {
    return false;
  }
}

// Live visitor tracking: visitorId -> { lastSeen, page, sessionId }
const liveVisitors = new Map<
  string,
  { lastSeen: number; page: string; sessionId: string }
>();

// Rate limit login attempts per IP
const loginAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED: Missing admin session token.' });
    return;
  }
  const token = authHeader.slice(7).trim();

  // Accept stateless HMAC token OR active in-memory session
  if (verifyStatelessToken(token)) {
    next();
    return;
  }

  const session = adminSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'SESSION EXPIRED OR INVALID. PLEASE LOG IN AGAIN.' });
    return;
  }

  const timeoutMs = (db.settings.sessionTimeoutMinutes || 30) * 60 * 1000;
  if (Date.now() - session.lastActiveAt > timeoutMs) {
    adminSessions.delete(token);
    res.status(401).json({ error: 'INACTIVE SESSION EXPIRED. PLEASE UNLOCK AGAIN.' });
    return;
  }

  session.lastActiveAt = Date.now();
  next();
}

/* ============================================================================
   ANALYTICS AGGREGATION HELPERS
   ============================================================================ */

function getDateRangeBounds(
  range: string,
  customStart?: string,
  customEnd?: string
): { startMs: number; endMs: number; prevStartMs: number; prevEndMs: number } {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  let startMs = todayMs - 7 * oneDay;
  let endMs = now;

  switch (range) {
    case 'TODAY':
      startMs = todayMs;
      endMs = now;
      break;
    case 'YESTERDAY':
      startMs = todayMs - oneDay;
      endMs = todayMs - 1;
      break;
    case '7_DAYS':
      startMs = now - 7 * oneDay;
      endMs = now;
      break;
    case '30_DAYS':
      startMs = now - 30 * oneDay;
      endMs = now;
      break;
    case '90_DAYS':
      startMs = now - 90 * oneDay;
      endMs = now;
      break;
    case 'ALL_TIME': {
      const oldest = db.events.length > 0 ? db.events[0].timestamp : now - 30 * oneDay;
      startMs = Math.min(oldest, now - oneDay);
      endMs = now;
      break;
    }
    case 'CUSTOM':
      if (customStart) {
        const parsedStart = new Date(customStart).getTime();
        if (!Number.isNaN(parsedStart)) startMs = parsedStart;
      }
      if (customEnd) {
        const parsedEnd = new Date(customEnd);
        parsedEnd.setHours(23, 59, 59, 999);
        if (!Number.isNaN(parsedEnd.getTime())) endMs = parsedEnd.getTime();
      }
      break;
    default:
      startMs = now - 7 * oneDay;
      endMs = now;
  }

  const span = Math.max(oneDay, endMs - startMs);
  const prevEndMs = startMs - 1;
  const prevStartMs = prevEndMs - span;

  return { startMs, endMs, prevStartMs, prevEndMs };
}

function calcPercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function computeSummaryMetrics(eventsSubset: AnalyticsEventRecord[]) {
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  let pageViews = 0;
  let productsViewed = 0;
  let addToCart = 0;
  let checkoutsStarted = 0;
  let orders = 0;
  const orderingVisitors = new Set<string>();

  for (const ev of eventsSubset) {
    if (ev.type === 'heartbeat') continue;
    if (ev.visitorId) visitors.add(ev.visitorId);
    if (ev.sessionId) sessions.add(ev.sessionId);

    if (ev.type === 'page_view') pageViews++;
    if (ev.type === 'product_view') productsViewed++;
    if (ev.type === 'add_to_cart') addToCart += ev.quantity || 1;
    if (ev.type === 'checkout_start') checkoutsStarted++;
    if (ev.type === 'purchase' || ev.type === 'checkout_complete') {
      orders++;
      if (ev.visitorId) orderingVisitors.add(ev.visitorId);
    }
  }

  const visitorCount = visitors.size;
  const sessionCount = sessions.size;
  const conversionRate =
    visitorCount > 0
      ? Number(((orderingVisitors.size / visitorCount) * 100).toFixed(2))
      : 0;

  return {
    visitors: visitorCount,
    sessions: sessionCount,
    pageViews,
    productsViewed,
    addToCart,
    checkoutsStarted,
    orders,
    conversionRate,
  };
}

function getActiveLiveVisitorCount(): {
  count: number;
  activePages: Record<string, number>;
} {
  const now = Date.now();
  const activeThresholdMs = 90 * 1000; // Active within last 90 seconds
  const activePages: Record<string, number> = {};
  let count = 0;

  for (const [visitorId, info] of liveVisitors.entries()) {
    if (now - info.lastSeen <= activeThresholdMs) {
      count++;
      const p = info.page || 'home';
      activePages[p] = (activePages[p] || 0) + 1;
    } else {
      liveVisitors.delete(visitorId);
    }
  }

  return { count, activePages };
}

/* ============================================================================
   EXPRESS SERVER & ROUTES
   ============================================================================ */

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '512kb' }));

  // --------------------------------------------------------------------------
  // 1. PUBLIC NON-BLOCKING EVENT COLLECTION ENDPOINT
  // --------------------------------------------------------------------------
  app.post('/api/analytics/collect', (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const eventsInput = Array.isArray(body.events) ? body.events : [body];
      const now = Date.now();

      for (const raw of eventsInput) {
        if (!raw || typeof raw.type !== 'string') continue;
        const evType = raw.type as AnalyticsEventType;

        const visitorId = String(raw.visitorId || 'anon').slice(0, 64);
        const sessionId = String(raw.sessionId || 'sess').slice(0, 64);
        const page = String(raw.page || 'home').slice(0, 64);

        // Update live visitor presence on every event or heartbeat
        liveVisitors.set(visitorId, {
          lastSeen: now,
          page,
          sessionId,
        });

        // Do not store raw heartbeats in the persistent event log
        if (evType === 'heartbeat') continue;

        // Check if admin disabled tracking for this event type
        if (
          evType !== 'product_dwell' &&
          db.settings.trackedEvents[evType] === false
        ) {
          continue;
        }

        // Strict PII sanitization: never accept name, email, phone, or address
        const cleanEvent: AnalyticsEventRecord = {
          id: crypto.randomBytes(8).toString('hex'),
          type: evType,
          timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : now,
          sessionId,
          visitorId,
          page,
          section: raw.section ? String(raw.section).slice(0, 80) : undefined,
          elementName: raw.elementName
            ? String(raw.elementName).slice(0, 100)
            : undefined,
          productId: raw.productId
            ? String(raw.productId).slice(0, 64)
            : undefined,
          productName: raw.productName
            ? String(raw.productName).slice(0, 100)
            : undefined,
          productSlug: raw.productSlug
            ? String(raw.productSlug).slice(0, 100)
            : undefined,
          quantity:
            typeof raw.quantity === 'number'
              ? Math.max(1, Math.min(99, raw.quantity))
              : undefined,
          orderValue:
            typeof raw.orderValue === 'number' ? raw.orderValue : undefined,
          country: raw.country
            ? String(raw.country).toUpperCase().slice(0, 64)
            : undefined,
          clubReasons: Array.isArray(raw.clubReasons)
            ? raw.clubReasons.map((r: unknown) => String(r).slice(0, 80))
            : undefined,
          referrerSource: raw.referrerSource
            ? String(raw.referrerSource).slice(0, 64)
            : undefined,
          utmSource: raw.utmSource
            ? String(raw.utmSource).slice(0, 64)
            : undefined,
          utmMedium: raw.utmMedium
            ? String(raw.utmMedium).slice(0, 64)
            : undefined,
          utmCampaign: raw.utmCampaign
            ? String(raw.utmCampaign).slice(0, 64)
            : undefined,
          durationSec:
            typeof raw.durationSec === 'number'
              ? Math.max(0, Math.min(3600, raw.durationSec))
              : undefined,
          heatmapZone: raw.heatmapZone
            ? String(raw.heatmapZone).slice(0, 80)
            : undefined,
          xPercent:
            typeof raw.xPercent === 'number'
              ? Math.max(0, Math.min(100, Math.round(raw.xPercent)))
              : undefined,
          yPercent:
            typeof raw.yPercent === 'number'
              ? Math.max(0, Math.min(100, Math.round(raw.yPercent)))
              : undefined,
        };

        db.events.push(cleanEvent);
      }

      scheduleSave();
      res.status(202).json({ ok: true });
    } catch (err) {
      console.error('Error recording analytics event:', err);
      res.status(202).json({ ok: false });
    }
  });

  // --------------------------------------------------------------------------
  // 2. ADMIN AUTHENTICATION ENDPOINTS
  // --------------------------------------------------------------------------
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (record && record.lockedUntil > now) {
      const waitSec = Math.ceil((record.lockedUntil - now) / 1000);
      res.status(429).json({
        error: `TOO MANY FAILED ATTEMPTS. LOCKED FOR ${waitSec}s.`,
      });
      return;
    }

    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'PASSWORD REQUIRED.' });
      return;
    }

    const cleanInput = password.trim();
    const envPassword = (process.env.ADMIN_PASSWORD || '').trim();

    let isValid =
      verifyPassword(
        cleanInput,
        db.settings.passwordSalt,
        db.settings.passwordHash
      ) ||
      verifyPassword(
        password,
        db.settings.passwordSalt,
        db.settings.passwordHash
      );

    // Always allow ADMIN_PASSWORD from environment if configured
    if (!isValid && envPassword && cleanInput === envPassword) {
      isValid = true;
    }

    // If the admin has not explicitly customized the password in Settings yet,
    // adopt the entered password on first login so the owner never gets locked out
    if (!isValid && !db.settings.passwordCustomized && cleanInput.length >= 1) {
      const newSalt = crypto.randomBytes(16).toString('hex');
      db.settings.passwordSalt = newSalt;
      db.settings.passwordHash = hashPassword(cleanInput, newSalt);
      db.settings.passwordCustomized = true;
      saveDatabaseImmediate();
      isValid = true;
    }

    if (!isValid) {
      const nextCount = (record?.count || 0) + 1;
      const lockedUntil = nextCount >= 10 ? now + 30 * 1000 : 0;
      loginAttempts.set(ip, { count: nextCount, lockedUntil });
      res.status(401).json({
        error: 'ACCESS DENIED // INVALID ADMIN PASSWORD.',
      });
      return;
    }

    loginAttempts.delete(ip);
    const token = createStatelessToken(db.settings.sessionTimeoutMinutes || 30);
    adminSessions.set(token, {
      token,
      createdAt: now,
      lastActiveAt: now,
    });

    res.json({
      ok: true,
      token,
      expiresInMinutes: db.settings.sessionTimeoutMinutes || 30,
    });
  });

  app.post(
    '/api/admin/logout',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        adminSessions.delete(token);
      }
      res.json({ ok: true });
    }
  );

  app.get(
    '/api/admin/session',
    requireAdminAuth,
    (_req: Request, res: Response) => {
      res.json({
        ok: true,
        settings: {
          retentionDays: db.settings.retentionDays,
          timezone: db.settings.timezone,
          currency: db.settings.currency,
          refreshIntervalSec: db.settings.refreshIntervalSec,
          sessionTimeoutMinutes: db.settings.sessionTimeoutMinutes,
          trackedEvents: db.settings.trackedEvents,
        },
      });
    }
  );

  // --------------------------------------------------------------------------
  // 3. PROTECTED ADMIN ANALYTICS DASHBOARD DATA ENDPOINT
  // --------------------------------------------------------------------------
  app.get(
    '/api/admin/analytics',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const range = String(req.query.range || '7_DAYS');
      const customStart = req.query.start ? String(req.query.start) : undefined;
      const customEnd = req.query.end ? String(req.query.end) : undefined;

      const { startMs, endMs, prevStartMs, prevEndMs } = getDateRangeBounds(
        range,
        customStart,
        customEnd
      );

      const currentEvents = db.events.filter(
        (e) => e.timestamp >= startMs && e.timestamp <= endMs
      );
      const prevEvents = db.events.filter(
        (e) => e.timestamp >= prevStartMs && e.timestamp <= prevEndMs
      );

      // 1. Summary Cards + Comparison
      const currentSummary = computeSummaryMetrics(currentEvents);
      const prevSummary = computeSummaryMetrics(prevEvents);

      const summaryCards = {
        visitors: {
          value: currentSummary.visitors,
          change: calcPercentageChange(
            currentSummary.visitors,
            prevSummary.visitors
          ),
        },
        sessions: {
          value: currentSummary.sessions,
          change: calcPercentageChange(
            currentSummary.sessions,
            prevSummary.sessions
          ),
        },
        pageViews: {
          value: currentSummary.pageViews,
          change: calcPercentageChange(
            currentSummary.pageViews,
            prevSummary.pageViews
          ),
        },
        productsViewed: {
          value: currentSummary.productsViewed,
          change: calcPercentageChange(
            currentSummary.productsViewed,
            prevSummary.productsViewed
          ),
        },
        addToCart: {
          value: currentSummary.addToCart,
          change: calcPercentageChange(
            currentSummary.addToCart,
            prevSummary.addToCart
          ),
        },
        checkoutsStarted: {
          value: currentSummary.checkoutsStarted,
          change: calcPercentageChange(
            currentSummary.checkoutsStarted,
            prevSummary.checkoutsStarted
          ),
        },
        orders: {
          value: currentSummary.orders,
          change: calcPercentageChange(currentSummary.orders, prevSummary.orders),
        },
        conversionRate: {
          value: currentSummary.conversionRate,
          change: calcPercentageChange(
            currentSummary.conversionRate,
            prevSummary.conversionRate
          ),
        },
      };

      // 2. Live Visitors Right Now
      const liveStatus = getActiveLiveVisitorCount();

      // 3. Time-Series Graph Data
      const spanMs = Math.max(1, endMs - startMs);
      const isHourly = spanMs <= 48 * 60 * 60 * 1000;
      const bucketCount = isHourly ? 24 : Math.min(30, Math.max(7, Math.ceil(spanMs / (24 * 60 * 60 * 1000))));
      const bucketSize = Math.max(1, Math.floor(spanMs / bucketCount));

      const timeSeries = Array.from({ length: bucketCount }, (_, i) => {
        const bStart = startMs + i * bucketSize;
        const bEnd = i === bucketCount - 1 ? endMs + 1 : bStart + bucketSize;
        const slice = currentEvents.filter(
          (e) => e.timestamp >= bStart && e.timestamp < bEnd
        );
        const vSet = new Set<string>();
        const sSet = new Set<string>();
        let pViews = 0;
        let ordCount = 0;

        for (const ev of slice) {
          if (ev.visitorId) vSet.add(ev.visitorId);
          if (ev.sessionId) sSet.add(ev.sessionId);
          if (ev.type === 'page_view') pViews++;
          if (ev.type === 'purchase' || ev.type === 'checkout_complete')
            ordCount++;
        }

        const dateObj = new Date(bStart);
        const label = isHourly
          ? dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

        return {
          timestamp: bStart,
          label,
          visitors: vSet.size,
          sessions: sSet.size,
          pageViews: pViews,
          orders: ordCount,
        };
      });

      // 4. What Are People Clicking? (Interactive Clicks Table)
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
          const label =
            ev.elementName ||
            (ev.type === 'add_to_cart'
              ? 'ADD TO CART'
              : ev.type === 'product_click'
              ? 'CREATURE PRODUCT CARDS'
              : ev.type === 'cart_view'
              ? 'CART'
              : ev.type === 'checkout_start'
              ? 'CHECKOUT'
              : ev.type === 'search'
              ? 'SEARCH'
              : ev.type === 'club_signup'
              ? 'LET ME IN'
              : ev.type.toUpperCase());

          totalClicks++;
          const existing = clickMap.get(label);
          if (existing) {
            existing.clicks++;
            if (ev.timestamp > existing.lastClickedAt) {
              existing.lastClickedAt = ev.timestamp;
            }
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

      const clicksTable = Array.from(clickMap.values()).map((item) => ({
        ...item,
        percentage:
          totalClicks > 0
            ? Number(((item.clicks / totalClicks) * 100).toFixed(1))
            : 0,
      }));

      // 5. Click Heatmap / Section Interaction Density
      const heatmapCounts: Record<
        string,
        Record<string, { zone: string; clicks: number }>
      > = {
        home: {},
        shop: {},
        product: {},
        checkout: {},
      };

      for (const ev of currentEvents) {
        const targetPage =
          ev.page === 'shop'
            ? 'shop'
            : ev.page === 'product'
            ? 'product'
            : ev.page === 'checkout'
            ? 'checkout'
            : 'home';
        const zone = ev.heatmapZone || ev.section || ev.elementName || 'main';
        if (!heatmapCounts[targetPage][zone]) {
          heatmapCounts[targetPage][zone] = { zone, clicks: 0 };
        }
        heatmapCounts[targetPage][zone].clicks++;
      }

      // 6. Product Analytics (Creatures People Love + Deep Dive)
      const productStatsMap = new Map<
        string,
        {
          productId: string;
          productName: string;
          productSlug: string;
          views: number;
          uniqueViewers: Set<string>;
          addToCart: number;
          wishlistAdds: number;
          orders: number;
          totalDwellSec: number;
          dwellCount: number;
          sources: Record<string, number>;
          dailyViews: Record<string, number>;
        }
      >();

      for (const ev of currentEvents) {
        if (!ev.productId && !ev.productName) continue;
        const pid = ev.productId || ev.productName || 'unknown';
        let pStat = productStatsMap.get(pid);
        if (!pStat) {
          pStat = {
            productId: pid,
            productName: ev.productName || pid,
            productSlug: ev.productSlug || pid,
            views: 0,
            uniqueViewers: new Set<string>(),
            addToCart: 0,
            wishlistAdds: 0,
            orders: 0,
            totalDwellSec: 0,
            dwellCount: 0,
            sources: {},
            dailyViews: {},
          };
          productStatsMap.set(pid, pStat);
        }

        if (ev.type === 'product_view' || ev.type === 'product_click') {
          pStat.views++;
          if (ev.visitorId) pStat.uniqueViewers.add(ev.visitorId);
          const src = ev.referrerSource || 'Direct';
          pStat.sources[src] = (pStat.sources[src] || 0) + 1;
          const dayKey = new Date(ev.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          pStat.dailyViews[dayKey] = (pStat.dailyViews[dayKey] || 0) + 1;
        } else if (ev.type === 'add_to_cart') {
          pStat.addToCart += ev.quantity || 1;
        } else if (ev.type === 'wishlist_add') {
          pStat.wishlistAdds++;
        } else if (ev.type === 'purchase') {
          pStat.orders += ev.quantity || 1;
        } else if (ev.type === 'product_dwell' && ev.durationSec) {
          pStat.totalDwellSec += ev.durationSec;
          pStat.dwellCount++;
        }
      }

      const productAnalytics = Array.from(productStatsMap.values()).map((p) => {
        const uniqueCount = p.uniqueViewers.size;
        const convRate =
          p.views > 0 ? Number(((p.orders / p.views) * 100).toFixed(1)) : 0;
        const atcRate =
          p.views > 0 ? Number(((p.addToCart / p.views) * 100).toFixed(1)) : 0;
        const purchaseRate =
          p.addToCart > 0
            ? Number(((p.orders / p.addToCart) * 100).toFixed(1))
            : 0;
        const avgTimeSec =
          p.dwellCount > 0 ? Math.round(p.totalDwellSec / p.dwellCount) : 0;

        return {
          productId: p.productId,
          productName: p.productName,
          productSlug: p.productSlug,
          views: p.views,
          uniqueViewers: uniqueCount,
          addToCart: p.addToCart,
          wishlistAdds: p.wishlistAdds,
          orders: p.orders,
          conversionRate: convRate,
          addToCartRate: atcRate,
          purchaseRate,
          avgTimeSec,
          sources: p.sources,
          dailyViews: p.dailyViews,
        };
      });

      // 7. PENNY CLUB Analytics (All-time & Range)
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfWeek = now - 7 * 24 * 60 * 60 * 1000;
      const startOfMonth = now - 30 * 24 * 60 * 60 * 1000;

      const allClubSignups = db.events.filter((e) => e.type === 'club_signup');
      const rangeClubSignups = currentEvents.filter(
        (e) => e.type === 'club_signup'
      );

      const signupsToday = allClubSignups.filter(
        (e) => e.timestamp >= startOfToday.getTime()
      ).length;
      const signupsThisWeek = allClubSignups.filter(
        (e) => e.timestamp >= startOfWeek
      ).length;
      const signupsThisMonth = allClubSignups.filter(
        (e) => e.timestamp >= startOfMonth
      ).length;

      const clubReasonCounts: Record<string, number> = {
        'I NEED A PEN HOLDER': 0,
        'I WANT A WEIRDO': 0,
        'I COLLECT STRANGE THINGS': 0,
        "I'M BUYING A GIFT": 0,
        "I'M JUST CURIOUS": 0,
        'I WANT TO SEE WHAT COMES NEXT': 0,
      };

      const clubCountriesSet = new Set<string>();
      for (const ev of rangeClubSignups) {
        if (ev.country) clubCountriesSet.add(ev.country);
        if (Array.isArray(ev.clubReasons)) {
          for (const reason of ev.clubReasons) {
            const upper = reason.toUpperCase();
            if (clubReasonCounts[upper] !== undefined) {
              clubReasonCounts[upper]++;
            } else {
              clubReasonCounts[upper] = (clubReasonCounts[upper] || 0) + 1;
            }
          }
        }
      }

      const sortedReasons = Object.entries(clubReasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      const clubSignupConversionRate =
        currentSummary.visitors > 0
          ? Number(
              ((rangeClubSignups.length / currentSummary.visitors) * 100).toFixed(
                1
              )
            )
          : 0;

      const pennyClubAnalytics = {
        totalSignups: allClubSignups.length,
        rangeSignups: rangeClubSignups.length,
        signupsToday,
        signupsThisWeek,
        signupsThisMonth,
        signupConversionRate: clubSignupConversionRate,
        countriesRepresented: clubCountriesSet.size,
        mostSelectedReason:
          sortedReasons[0] && sortedReasons[0].count > 0
            ? sortedReasons[0].reason
            : 'NONE YET',
        reasonBreakdown: sortedReasons,
      };

      // 8. Country Analytics ("WHERE ARE THE WEIRDOS FROM?")
      const countryMap = new Map<
        string,
        {
          country: string;
          visitors: Set<string>;
          clubSignups: number;
          orders: number;
        }
      >();

      for (const ev of currentEvents) {
        const c = ev.country || 'UNKNOWN';
        if (c === 'UNKNOWN' && ev.type !== 'club_signup' && ev.type !== 'purchase') {
          continue;
        }
        let entry = countryMap.get(c);
        if (!entry) {
          entry = {
            country: c,
            visitors: new Set<string>(),
            clubSignups: 0,
            orders: 0,
          };
          countryMap.set(c, entry);
        }
        if (ev.visitorId) entry.visitors.add(ev.visitorId);
        if (ev.type === 'club_signup') entry.clubSignups++;
        if (ev.type === 'purchase' || ev.type === 'checkout_complete')
          entry.orders++;
      }

      const countryAnalytics = Array.from(countryMap.values())
        .map((item) => {
          const vCount = Math.max(
            item.visitors.size,
            item.clubSignups + item.orders
          );
          return {
            country: item.country,
            visitors: vCount,
            clubSignups: item.clubSignups,
            orders: item.orders,
            conversionRate:
              vCount > 0 ? Number(((item.orders / vCount) * 100).toFixed(1)) : 0,
          };
        })
        .sort((a, b) => b.visitors - a.visitors || b.clubSignups - a.clubSignups);

      // 9. Traffic Sources ("HOW DID THEY FIND PENNY?")
      const sourceMap = new Map<
        string,
        {
          source: string;
          visitors: Set<string>;
          sessions: Set<string>;
          orders: number;
        }
      >();

      const utmCampaignsMap = new Map<
        string,
        {
          utmSource: string;
          utmMedium: string;
          utmCampaign: string;
          visitors: Set<string>;
          orders: number;
        }
      >();

      for (const ev of currentEvents) {
        const src = ev.referrerSource || 'Direct';
        let sEntry = sourceMap.get(src);
        if (!sEntry) {
          sEntry = {
            source: src,
            visitors: new Set<string>(),
            sessions: new Set<string>(),
            orders: 0,
          };
          sourceMap.set(src, sEntry);
        }
        if (ev.visitorId) sEntry.visitors.add(ev.visitorId);
        if (ev.sessionId) sEntry.sessions.add(ev.sessionId);
        if (ev.type === 'purchase' || ev.type === 'checkout_complete') {
          sEntry.orders++;
        }

        if (ev.utmSource || ev.utmCampaign || ev.utmMedium) {
          const key = `${ev.utmSource || '-'}|${ev.utmMedium || '-'}|${
            ev.utmCampaign || '-'
          }`;
          let uEntry = utmCampaignsMap.get(key);
          if (!uEntry) {
            uEntry = {
              utmSource: ev.utmSource || '-',
              utmMedium: ev.utmMedium || '-',
              utmCampaign: ev.utmCampaign || '-',
              visitors: new Set<string>(),
              orders: 0,
            };
            utmCampaignsMap.set(key, uEntry);
          }
          if (ev.visitorId) uEntry.visitors.add(ev.visitorId);
          if (ev.type === 'purchase' || ev.type === 'checkout_complete') {
            uEntry.orders++;
          }
        }
      }

      const trafficSources = Array.from(sourceMap.values())
        .map((s) => ({
          source: s.source,
          visitors: s.visitors.size,
          sessions: s.sessions.size,
          orders: s.orders,
          conversionRate:
            s.visitors.size > 0
              ? Number(((s.orders / s.visitors.size) * 100).toFixed(1))
              : 0,
        }))
        .sort((a, b) => b.visitors - a.visitors);

      const utmCampaigns = Array.from(utmCampaignsMap.values()).map((u) => ({
        utmSource: u.utmSource,
        utmMedium: u.utmMedium,
        utmCampaign: u.utmCampaign,
        visitors: u.visitors.size,
        orders: u.orders,
      }));

      // 10. Page Analytics ("MOST VISITED PAGES")
      const pageMap = new Map<
        string,
        {
          page: string;
          views: number;
          visitors: Set<string>;
          totalDurationSec: number;
          durationCount: number;
          sessionsLastPage: number;
          totalSessionsTouchingPage: Set<string>;
        }
      >();

      // Track last page per session to compute exit rate accurately
      const sessionLastPage = new Map<string, string>();
      for (const ev of currentEvents) {
        if (ev.type === 'page_view' && ev.sessionId && ev.page) {
          sessionLastPage.set(ev.sessionId, ev.page);
        }
      }

      for (const ev of currentEvents) {
        const pName = ev.page || 'home';
        let pEntry = pageMap.get(pName);
        if (!pEntry) {
          pEntry = {
            page: pName,
            views: 0,
            visitors: new Set<string>(),
            totalDurationSec: 0,
            durationCount: 0,
            sessionsLastPage: 0,
            totalSessionsTouchingPage: new Set<string>(),
          };
          pageMap.set(pName, pEntry);
        }

        if (ev.type === 'page_view') {
          pEntry.views++;
          if (ev.visitorId) pEntry.visitors.add(ev.visitorId);
          if (ev.sessionId) pEntry.totalSessionsTouchingPage.add(ev.sessionId);
        }
        if (ev.durationSec) {
          pEntry.totalDurationSec += ev.durationSec;
          pEntry.durationCount++;
        }
      }

      for (const [, lastPage] of sessionLastPage.entries()) {
        const pEntry = pageMap.get(lastPage);
        if (pEntry) pEntry.sessionsLastPage++;
      }

      const pageAnalytics = Array.from(pageMap.values())
        .map((p) => {
          const sessCount = p.totalSessionsTouchingPage.size;
          return {
            page: p.page,
            views: p.views,
            uniqueVisitors: p.visitors.size,
            avgEngagementSec:
              p.durationCount > 0
                ? Math.round(p.totalDurationSec / p.durationCount)
                : 0,
            exitRate:
              sessCount > 0
                ? Number(((p.sessionsLastPage / sessCount) * 100).toFixed(1))
                : 0,
          };
        })
        .sort((a, b) => b.views - a.views);

      // 11. User Journey / Funnel
      const funnelVisitors = {
        visit: new Set<string>(),
        explore: new Set<string>(),
        viewProduct: new Set<string>(),
        addToCart: new Set<string>(),
        checkout: new Set<string>(),
        purchase: new Set<string>(),
      };

      for (const ev of currentEvents) {
        const vid = ev.visitorId;
        if (!vid) continue;
        funnelVisitors.visit.add(vid);
        if (
          ev.type === 'cta_click' ||
          ev.type === 'search' ||
          ev.type === 'faq_open' ||
          ev.type === 'product_click' ||
          ev.type === 'product_view' ||
          ev.section === 'shop-section'
        ) {
          funnelVisitors.explore.add(vid);
        }
        if (ev.type === 'product_view' || ev.type === 'product_click') {
          funnelVisitors.viewProduct.add(vid);
          funnelVisitors.explore.add(vid);
        }
        if (ev.type === 'add_to_cart') {
          funnelVisitors.addToCart.add(vid);
          funnelVisitors.viewProduct.add(vid);
          funnelVisitors.explore.add(vid);
        }
        if (ev.type === 'checkout_start') {
          funnelVisitors.checkout.add(vid);
          funnelVisitors.addToCart.add(vid);
          funnelVisitors.viewProduct.add(vid);
          funnelVisitors.explore.add(vid);
        }
        if (ev.type === 'purchase' || ev.type === 'checkout_complete') {
          funnelVisitors.purchase.add(vid);
          funnelVisitors.checkout.add(vid);
          funnelVisitors.addToCart.add(vid);
          funnelVisitors.viewProduct.add(vid);
          funnelVisitors.explore.add(vid);
        }
      }

      const topCount = funnelVisitors.visit.size;
      const funnel = [
        {
          stage: 'VISIT',
          count: topCount,
          percentage: topCount > 0 ? 100 : 0,
        },
        {
          stage: 'EXPLORE',
          count: funnelVisitors.explore.size,
          percentage:
            topCount > 0
              ? Number(
                  ((funnelVisitors.explore.size / topCount) * 100).toFixed(1)
                )
              : 0,
        },
        {
          stage: 'VIEW PRODUCT',
          count: funnelVisitors.viewProduct.size,
          percentage:
            topCount > 0
              ? Number(
                  ((funnelVisitors.viewProduct.size / topCount) * 100).toFixed(1)
                )
              : 0,
        },
        {
          stage: 'ADD TO CART',
          count: funnelVisitors.addToCart.size,
          percentage:
            topCount > 0
              ? Number(
                  ((funnelVisitors.addToCart.size / topCount) * 100).toFixed(1)
                )
              : 0,
        },
        {
          stage: 'CHECKOUT',
          count: funnelVisitors.checkout.size,
          percentage:
            topCount > 0
              ? Number(
                  ((funnelVisitors.checkout.size / topCount) * 100).toFixed(1)
                )
              : 0,
        },
        {
          stage: 'PURCHASE',
          count: funnelVisitors.purchase.size,
          percentage:
            topCount > 0
              ? Number(
                  ((funnelVisitors.purchase.size / topCount) * 100).toFixed(1)
                )
              : 0,
        },
      ];

      // 12. Real-Time Anonymized Event Stream (Last 60 events)
      const recentEvents = db.events
        .slice(-60)
        .reverse()
        .map((ev) => ({
          id: ev.id,
          type: ev.type,
          timestamp: ev.timestamp,
          page: ev.page,
          section: ev.section,
          elementName: ev.elementName,
          productName: ev.productName,
          country: ev.country,
          referrerSource: ev.referrerSource,
        }));

      res.json({
        ok: true,
        lastUpdated: Date.now(),
        range,
        summaryCards,
        liveStatus,
        timeSeries,
        clicksTable,
        heatmapCounts,
        productAnalytics,
        pennyClubAnalytics,
        countryAnalytics,
        trafficSources,
        utmCampaigns,
        pageAnalytics,
        funnel,
        recentEvents,
      });
    }
  );

  // --------------------------------------------------------------------------
  // 4. ADMIN SETTINGS UPDATE ENDPOINT
  // --------------------------------------------------------------------------
  app.put(
    '/api/admin/settings',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const body = req.body || {};

      if (body.newPassword && typeof body.newPassword === 'string') {
        if (body.newPassword.trim().length < 4) {
          res
            .status(400)
            .json({ error: 'NEW PASSWORD MUST BE AT LEAST 4 CHARACTERS.' });
          return;
        }
        const newSalt = crypto.randomBytes(16).toString('hex');
        db.settings.passwordSalt = newSalt;
        db.settings.passwordHash = hashPassword(body.newPassword.trim(), newSalt);
        db.settings.passwordCustomized = true;
      }

      if (typeof body.retentionDays === 'number') {
        db.settings.retentionDays = Math.max(
          7,
          Math.min(365, body.retentionDays)
        );
      }
      if (typeof body.timezone === 'string') {
        db.settings.timezone = body.timezone.slice(0, 64);
      }
      if (typeof body.currency === 'string') {
        db.settings.currency = body.currency.slice(0, 32);
      }
      if (typeof body.refreshIntervalSec === 'number') {
        db.settings.refreshIntervalSec = Math.max(
          2,
          Math.min(60, body.refreshIntervalSec)
        );
      }
      if (typeof body.sessionTimeoutMinutes === 'number') {
        db.settings.sessionTimeoutMinutes = Math.max(
          5,
          Math.min(240, body.sessionTimeoutMinutes)
        );
      }
      if (body.trackedEvents && typeof body.trackedEvents === 'object') {
        db.settings.trackedEvents = {
          ...db.settings.trackedEvents,
          ...body.trackedEvents,
        };
      }

      saveDatabaseImmediate();

      res.json({
        ok: true,
        settings: {
          retentionDays: db.settings.retentionDays,
          timezone: db.settings.timezone,
          currency: db.settings.currency,
          refreshIntervalSec: db.settings.refreshIntervalSec,
          sessionTimeoutMinutes: db.settings.sessionTimeoutMinutes,
          trackedEvents: db.settings.trackedEvents,
        },
      });
    }
  );

  // --------------------------------------------------------------------------
  // 5. VITE MIDDLEWARE (DEVELOPMENT) OR STATIC SERVING (PRODUCTION)
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PENNY Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
