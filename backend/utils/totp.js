const crypto = require('crypto');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function generateSecret(bytes = 20) {
  const data = crypto.randomBytes(bytes); let bits = 0, value = 0, out = '';
  for (const byte of data) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
function decodeBase32(secret) {
  let bits = 0, value = 0; const out = [];
  for (const ch of String(secret).toUpperCase().replace(/=|\s/g, '')) { const idx = alphabet.indexOf(ch); if (idx < 0) continue; value = (value << 5) | idx; bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}
function codeAt(secret, counter) {
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(msg).digest();
  const offset = digest[digest.length - 1] & 15;
  const number = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return String(number).padStart(6, '0');
}
function verifyCode(secret, code) {
  if (!/^\d{6}$/.test(String(code || ''))) return false;
  const now = Math.floor(Date.now() / 30000);
  return [-1, 0, 1].some(delta => crypto.timingSafeEqual(Buffer.from(codeAt(secret, now + delta)), Buffer.from(String(code))));
}
module.exports = { generateSecret, verifyCode };
