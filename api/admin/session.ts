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

  const { settings } = getServerlessStore();
  res.status(200).json({
    ok: true,
    settings: {
      retentionDays: settings.retentionDays,
      timezone: settings.timezone,
      currency: settings.currency,
      refreshIntervalSec: settings.refreshIntervalSec,
      sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
      trackedEvents: settings.trackedEvents,
    },
  });
}
