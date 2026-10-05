import crypto from 'crypto';
import {
  getServerlessStore,
  verifyPassword,
  hashPassword,
  createStatelessToken,
} from '../_store.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const body =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const password = body.password;

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'PASSWORD REQUIRED.' });
    return;
  }

  const { settings } = getServerlessStore();
  const cleanInput = password.trim();
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();

  let isValid =
    verifyPassword(cleanInput, settings.passwordSalt, settings.passwordHash) ||
    verifyPassword(password, settings.passwordSalt, settings.passwordHash);

  if (!isValid && envPassword && cleanInput === envPassword) {
    isValid = true;
  }

  if (!isValid && !settings.passwordCustomized && cleanInput.length >= 1) {
    const newSalt = crypto.randomBytes(16).toString('hex');
    settings.passwordSalt = newSalt;
    settings.passwordHash = hashPassword(cleanInput, newSalt);
    settings.passwordCustomized = true;
    isValid = true;
  }

  if (!isValid) {
    res.status(401).json({
      error: 'ACCESS DENIED // INVALID ADMIN PASSWORD.',
    });
    return;
  }

  const token = createStatelessToken(settings.sessionTimeoutMinutes || 30);
  res.status(200).json({
    ok: true,
    token,
    expiresInMinutes: settings.sessionTimeoutMinutes || 30,
  });
}
