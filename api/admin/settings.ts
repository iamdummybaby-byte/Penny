import crypto from 'crypto';
import {
  getServerlessStore,
  verifyStatelessToken,
  hashPassword,
} from '../_store.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const authHeader = req.headers?.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!verifyStatelessToken(token)) {
    res.status(401).json({ error: 'SESSION EXPIRED OR INVALID.' });
    return;
  }

  const body =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { settings } = getServerlessStore();

  if (body.newPassword && typeof body.newPassword === 'string') {
    if (body.newPassword.trim().length < 4) {
      res
        .status(400)
        .json({ error: 'NEW PASSWORD MUST BE AT LEAST 4 CHARACTERS.' });
      return;
    }
    const newSalt = crypto.randomBytes(16).toString('hex');
    settings.passwordSalt = newSalt;
    settings.passwordHash = hashPassword(body.newPassword.trim(), newSalt);
    settings.passwordCustomized = true;
  }

  if (typeof body.retentionDays === 'number') {
    settings.retentionDays = Math.max(7, Math.min(365, body.retentionDays));
  }
  if (typeof body.timezone === 'string') {
    settings.timezone = body.timezone.slice(0, 64);
  }
  if (typeof body.currency === 'string') {
    settings.currency = body.currency.slice(0, 32);
  }
  if (typeof body.refreshIntervalSec === 'number') {
    settings.refreshIntervalSec = Math.max(
      2,
      Math.min(60, body.refreshIntervalSec)
    );
  }
  if (body.trackedEvents && typeof body.trackedEvents === 'object') {
    settings.trackedEvents = {
      ...settings.trackedEvents,
      ...body.trackedEvents,
    };
  }

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
