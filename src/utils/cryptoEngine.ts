const SALT = "fit_track_v7_salt";
const ITERATIONS = 100000;

export async function deriveKey(pin: string): Promise<CryptoKey> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url), { type: 'module' });
        
        worker.onmessage = async (e) => {
            if (e.data.success) {
                try {
                    // Import raw key into a non-extractable CryptoKey in Main Thread (Zero Trust principle)
                    const key = await crypto.subtle.importKey(
                        'raw',
                        e.data.rawKey,
                        { name: 'AES-GCM', length: 256 },
                        false, // Non-extractable in main thread!
                        ['encrypt', 'decrypt']
                    );
                    resolve(key);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error(e.data.error));
            }
            worker.terminate();
        };
        
        worker.onerror = (err) => {
            reject(err);
            worker.terminate();
        };
        
        worker.postMessage({ pin, salt: SALT, iterations: ITERATIONS });
    });
}

let masterKey: CryptoKey | null = null;
export function setMasterKey(key: CryptoKey) { masterKey = key; }
export function getMasterKey() { return masterKey; }

export async function encryptData(key: CryptoKey, data: string): Promise<string> {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(data)
    );
    const buffer = new Uint8Array(iv.length + encrypted.byteLength);
    buffer.set(iv, 0);
    buffer.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...buffer));
}

export async function decryptData(key: CryptoKey, base64Data: string): Promise<string> {
    try {
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        const iv = bytes.slice(0, 12);
        const data = bytes.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        throw new Error("Invalid PIN or corrupted data");
    }
}
