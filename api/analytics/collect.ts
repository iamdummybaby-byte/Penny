import crypto from 'crypto';
import { getServerlessStore } from '../_store.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : req.body || {};
    const eventsInput = Array.isArray(body.events) ? body.events : [body];
    const now = Date.now();
    const { events, settings, liveVisitors } = getServerlessStore();

    for (const raw of eventsInput) {
      if (!raw || typeof raw.type !== 'string') continue;
      const evType = raw.type;
      const visitorId = String(raw.visitorId || 'anon').slice(0, 64);
      const sessionId = String(raw.sessionId || 'sess').slice(0, 64);
      const page = String(raw.page || 'home').slice(0, 64);

      liveVisitors.set(visitorId, { lastSeen: now, page, sessionId });
      if (evType === 'heartbeat') continue;
      if (evType !== 'product_dwell' && settings.trackedEvents[evType] === false) {
        continue;
      }

      events.push({
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
        productId: raw.productId ? String(raw.productId).slice(0, 64) : undefined,
        productName: raw.productName
          ? String(raw.productName).slice(0, 100)
          : undefined,
        productSlug: raw.productSlug
          ? String(raw.productSlug).slice(0, 100)
          : undefined,
        quantity: typeof raw.quantity === 'number' ? raw.quantity : undefined,
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
        utmSource: raw.utmSource ? String(raw.utmSource).slice(0, 64) : undefined,
        utmMedium: raw.utmMedium ? String(raw.utmMedium).slice(0, 64) : undefined,
        utmCampaign: raw.utmCampaign
          ? String(raw.utmCampaign).slice(0, 64)
          : undefined,
        durationSec:
          typeof raw.durationSec === 'number' ? raw.durationSec : undefined,
        heatmapZone: raw.heatmapZone
          ? String(raw.heatmapZone).slice(0, 80)
          : undefined,
      });

      if (events.length > 10000) {
        events.splice(0, events.length - 10000);
      }
    }

    res.status(202).json({ ok: true });
  } catch {
    res.status(202).json({ ok: false });
  }
}
