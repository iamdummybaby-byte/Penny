import crypto from 'crypto';

// Shared in-memory store across warm Vercel serverless invocations
const globalStore = globalThis as unknown as {
  __pennyEvents?: any[];
  __pennySettings?: {
    passwordSalt: string;
    passwordHash: string;
    passwordCustomized: boolean;
    retentionDays: number;
    timezone: string;
    currency: string;
    refreshIntervalSec: number;
    sessionTimeoutMinutes: number;
    trackedEvents: Record<string, boolean>;
  };
  __pennyLiveVisitors?: Map<string, { lastSeen: number; page: string; sessionId: string }>;
};

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): boolean {
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

export function getSigningSecret(): string {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.GEMINI_API_KEY ||
    'penny-control-room-hmac-secret-2026'
  );
}

export function createStatelessToken(expiresInMinutes = 30): string {
  const exp = Date.now() + expiresInMinutes * 60 * 1000;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${exp}.${nonce}`;
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

export function verifyStatelessToken(token: string): boolean {
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

export function getServerlessStore() {
  if (!globalStore.__pennyEvents) {
    globalStore.__pennyEvents = [];
  }
  if (!globalStore.__pennyLiveVisitors) {
    globalStore.__pennyLiveVisitors = new Map();
  }
  if (!globalStore.__pennySettings) {
    const initialPassword = (process.env.ADMIN_PASSWORD || 'penny-admin').trim();
    const salt = crypto.randomBytes(16).toString('hex');
    globalStore.__pennySettings = {
      passwordSalt: salt,
      passwordHash: hashPassword(initialPassword, salt),
      passwordCustomized: false,
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
    };
  }

  return {
    events: globalStore.__pennyEvents,
    settings: globalStore.__pennySettings,
    liveVisitors: globalStore.__pennyLiveVisitors,
  };
}
