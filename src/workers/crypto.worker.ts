// @ts-nocheck
const getKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

self.onmessage = async (e: MessageEvent) => {
  const data = e.data;
  
  // Retrocompatibilidade com o cryptoEngine antigo
  if (!data.type && data.pin && data.salt && data.iterations) {
    try {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(data.pin), 'PBKDF2', false, ['deriveBits']);
      const saltBuffer = typeof data.salt === 'string' ? enc.encode(data.salt) : data.salt;
      const rawKey = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBuffer, iterations: data.iterations, hash: 'SHA-256' },
        keyMaterial,
        256
      );
      self.postMessage({ success: true, rawKey });
    } catch (err) {
      self.postMessage({ success: false, error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  // Novo formato sugerido
  const { type, pin, salt, iv, data: payloadData } = data;
  try {
    if (type === 'derive') {
      const key = await getKey(pin, new Uint8Array(salt));
      self.postMessage({ type: 'key', key });
    } else if (type === 'encrypt') {
      const key = await getKey(pin, new Uint8Array(salt));
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new TextEncoder().encode(payloadData));
      self.postMessage({ type: 'encrypted', encrypted });
    } else if (type === 'decrypt') {
      const key = await getKey(pin, new Uint8Array(salt));
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, payloadData);
      self.postMessage({ type: 'decrypted', decrypted: new TextDecoder().decode(decrypted) });
    }
  } catch (err) {
    self.postMessage({ type: 'error', error: err instanceof Error ? err.message : String(err) });
  }
};
