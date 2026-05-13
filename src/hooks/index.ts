import { useState, useEffect, useRef, useCallback } from 'react';

import { get as idbGet, set as idbSet } from 'idb-keyval';

import { getMasterKey, encryptData, decryptData } from '../utils/cryptoEngine';

// Hook para Persistência Híbrida (IDB + LS) com suporte a Encriptação Zero Trust
export function useLS<T>(key: string, def: T, validator?: any): [T, (val: T | ((prev: T) => T)) => void] {
    const [v, sv] = useState<T>(def);

    useEffect(() => {
        const load = async () => {
            try {
                const mk = getMasterKey();
                let rawStr = localStorage.getItem(key);
                
                const idbVal = await idbGet(key);
                if (idbVal !== undefined) rawStr = idbVal;

                if (!rawStr) return;

                let jsonStr = rawStr;
                if (mk) {
                    try {
                        jsonStr = await decryptData(mk, rawStr);
                    } catch (e) {
                        // Poderá não estar encriptado (legacy), ou corrompido
                        if (!rawStr.startsWith('{') && !rawStr.startsWith('[')) {
                           console.warn(`Dados corrompidos ou chave inválida para ${key}`);
                           return;
                        }
                    }
                }

                let parsed = JSON.parse(jsonStr);
                
                if (validator) {
                    const res = validator.safeParse(parsed);
                    if (!res.success) {
                        console.error(`Validação Zod falhou para ${key}`, res.error);
                        return; // Zero Trust: Rejeita se não cumpre o esquema
                    }
                    parsed = res.data;
                }
                
                sv(parsed);
            } catch (err) {
                console.error("useLS load error:", err);
            }
        };
        load();
    }, [key, validator]);

    const set = useCallback((val: T | ((prev: T) => T)) => {
        sv(prev => {
            const next = val instanceof Function ? val(prev) : val;
            
            // Background persist
            setTimeout(async () => {
                try {
                    let toSave = JSON.stringify(next);
                    const mk = getMasterKey();
                    if (mk) {
                        toSave = await encryptData(mk, toSave);
                    }
                    localStorage.setItem(key, toSave);
                    idbSet(key, toSave).catch(() => {});
                } catch (e) {
                    console.error("Save error", e);
                }
            }, 0);
            
            return next;
        });
    }, [key]);
    return [v, set];
}

// Hook para manter o ecrã ligado no ginásio
export function useWakeLock(on: boolean) {
    const r = useRef<any>(null);
    useEffect(() => {
        if (!on) { r.current?.release?.(); r.current = null; return; }
        if (!("wakeLock" in navigator)) return;
        navigator.wakeLock.request("screen").then((l: any) => { r.current = l; }).catch(() => { });
        return () => { r.current?.release?.(); r.current = null; };
    }, [on]);
}

// Hook de Beep para o temporizador
export function useBeep() {
    const ctx = useRef<AudioContext | null>(null);
    const beep = useCallback((f = 880, d = 0.13, v = 0.3) => {
        try {
            if (!ctx.current) ctx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const o = ctx.current.createOscillator(), g = ctx.current.createGain();
            o.connect(g); g.connect(ctx.current.destination);
            o.frequency.value = f; g.gain.value = v; o.start(); o.stop(ctx.current.currentTime + d);
        } catch { }
    }, []);

    const done = useCallback(() => {
        setTimeout(() => beep(1046, 0.1), 0);
        setTimeout(() => beep(1046, 0.1), 160);
        setTimeout(() => beep(698, 0.22), 330);
    }, [beep]);

    return { beep, done };
}

// Hook de cronômetro
export function useStopwatch() {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(t);
    }, []);
    return elapsed;
}