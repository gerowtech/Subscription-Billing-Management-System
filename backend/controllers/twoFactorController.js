const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

const key = () => crypto.createHash('sha256').update(String(process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET || 'development-only-change-me')).digest();
function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
}
function decrypt(value) {
  const [iv, tag, data] = String(value || '').split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
function verifyCode(secret, code) {
  const clean = String(code || '').replace(/\s/g, '');
  return /^\d{6}$/.test(clean) && speakeasy.totp.verify({ secret, encoding: 'base32', token: clean, window: 1 });
}
exports.status = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select('+totpSecretEncrypted');
    if (!user || user.role !== 'admin' || !user.isActive) return res.status(401).json({ message: 'Admin account not available.' });
    res.set('Cache-Control', 'no-store');
    res.json({ enabled: !!user.totpEnabled });
  } catch (e) { next(e); }
};
exports.setup = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select('+totpSecretEncrypted +totpPendingSecretEncrypted');
    if (!user || user.role !== 'admin' || !user.isActive) return res.status(401).json({ message: 'Admin account not available.' });
    if (user.totpEnabled) return res.status(409).json({ message: 'Two-factor authentication is already enabled.' });
    const secret = speakeasy.generateSecret({ name: `StrafeMC (${user.email})`, issuer: 'StrafeMC', length: 20 });
    user.totpPendingSecretEncrypted = encrypt(secret.base32);
    user.totpPendingExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    const qrCode = await QRCode.toDataURL(secret.otpauth_url, { errorCorrectionLevel: 'M', margin: 2, width: 240 });
    res.set('Cache-Control', 'no-store');
    res.json({ qrCode, secret: secret.base32, accountName: user.email, expiresInSeconds: 600 });
  } catch (e) { next(e); }
};
exports.confirm = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select('+totpPendingSecretEncrypted');
    if (!user || user.role !== 'admin' || !user.isActive) return res.status(401).json({ message: 'Admin account not available.' });
    if (user.totpEnabled) return res.status(409).json({ message: 'Two-factor authentication is already enabled.' });
    if (!user.totpPendingSecretEncrypted || !user.totpPendingExpiresAt || user.totpPendingExpiresAt < new Date()) return res.status(400).json({ message: 'Setup expired. Click Enable to generate a new QR code.' });
    const secret = decrypt(user.totpPendingSecretEncrypted);
    if (!verifyCode(secret, req.body?.code)) return res.status(400).json({ message: 'Invalid authenticator code. Check your device time and try again.' });
    user.totpSecretEncrypted = encrypt(secret);
    user.totpEnabled = true;
    user.totpPendingSecretEncrypted = undefined;
    user.totpPendingExpiresAt = undefined;
    await user.save();
    res.json({ message: 'Two-factor authentication enabled successfully.', enabled: true });
  } catch (e) { next(e); }
};
exports.disable = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select('+totpSecretEncrypted');
    if (!user || user.role !== 'admin' || !user.isActive) return res.status(401).json({ message: 'Admin account not available.' });
    if (!user.totpEnabled || !user.totpSecretEncrypted) return res.status(400).json({ message: 'Two-factor authentication is not enabled.' });
    if (!verifyCode(decrypt(user.totpSecretEncrypted), req.body?.code)) return res.status(400).json({ message: 'Invalid authenticator code.' });
    user.totpEnabled = false;
    user.totpSecretEncrypted = undefined;
    user.totpPendingSecretEncrypted = undefined;
    user.totpPendingExpiresAt = undefined;
    await user.save();
    res.json({ message: 'Two-factor authentication disabled.', enabled: false });
  } catch (e) { next(e); }
};
exports.verifyLogin = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const challenge = String(req.body?.challengeToken || '');
    let claims;
    try { claims = jwt.verify(challenge, process.env.JWT_SECRET || 'development-only-change-me'); }
    catch { return res.status(401).json({ message: 'Login challenge expired. Sign in again.' }); }
    if (claims.purpose !== 'admin-2fa-challenge' || claims.role !== 'admin' || !claims.sub) return res.status(401).json({ message: 'Invalid login challenge.' });
    const user = await User.findById(claims.sub).select('+totpSecretEncrypted');
    if (!user || !user.isActive || user.role !== 'admin' || !user.totpEnabled || !user.totpSecretEncrypted) return res.status(401).json({ message: 'Two-factor login is not available for this account.' });
    if (!verifyCode(decrypt(user.totpSecretEncrypted), req.body?.code)) return res.status(401).json({ message: 'Invalid authenticator code.' });
    const token = jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '8h' });
    res.json({ token, user: { email: user.email, username: user.username, role: user.role } });
  } catch (e) { next(e); }
};
