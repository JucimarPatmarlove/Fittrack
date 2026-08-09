// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { C } from '../../data/constants';
import { useWorkerPoseDetection } from '../../hooks/useWorkerPoseDetection';
import { usePoseCounter } from '../../hooks/usePoseCounter';

export const SmartCamera = ({ onLandmarks }: { onLandmarks: (landmarks: any) => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<'idle' | 'active' | 'blocked'>('idle');
    const [mode, setMode] = useState<'squat' | 'push'>('squat');
    const stopRef = useRef(false);
    const { detectPose } = useWorkerPoseDetection();
    const { reps, feedback, processLandmarks, resetReps } = usePoseCounter(mode);

    const processFrame = useCallback(async () => {
        if (!videoRef.current || stopRef.current) return;
        
        try {
            const result: any = await detectPose(videoRef.current);
            if (result && result.landmarks && result.landmarks.length > 0) {
                const poseLandmarks = result.landmarks[0]; // tasks-vision devolve arrays
                
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.save();
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.globalAlpha = 0.4;
                        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.globalAlpha = 1.0;
                        
                        for (const pt of poseLandmarks) {
                            ctx.beginPath();
                            ctx.arc(pt.x * canvasRef.current.width, pt.y * canvasRef.current.height, 4, 0, 2*Math.PI);
                            ctx.fillStyle = C.accent;
                            ctx.fill();
                        }
                        ctx.restore();
                    }
                }
                
                // Formato de tasks-vision é ligeiramente diferente mas serve de array
                onLandmarks(poseLandmarks);
                processLandmarks(poseLandmarks);
            }
        } catch (e) {
            console.error("Worker error", e);
        }
        
        if (!stopRef.current) {
            requestAnimationFrame(processFrame);
        }
    }, [detectPose, onLandmarks, processLandmarks]);

    useEffect(() => {
        if (cameraActive) {
            if (!window.isSecureContext) {
                alert("Smart Camera requer uma ligação segura (HTTPS).");
                setCameraActive(false);
                return;
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("O teu browser não suporta acesso à câmara.");
                setCameraActive(false);
                return;
            }
            stopRef.current = false;
            navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                        videoRef.current.onloadeddata = () => {
                            setCameraStatus('active');
                            processFrame();
                        };
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera", err);
                    setCameraActive(false);
                    setCameraStatus('blocked');
                });
        }

        return () => {
            stopRef.current = true;
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraActive, processFrame]);

    return (
        <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 'bold', color: C.accent }}>📸 SMART CAM (Live Counter)</span>
                
                {cameraActive && (
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                            onClick={() => setMode('squat')}
                            style={{ background: mode === 'squat' ? C.accent : C.surface, color: mode === 'squat' ? '#000' : C.muted, border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            AGACHAMENTO
                        </button>
                        <button 
                            onClick={() => setMode('push')}
                            style={{ background: mode === 'push' ? C.accent : C.surface, color: mode === 'push' ? '#000' : C.muted, border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            PUSH (PEITO)
                        </button>
                        <button 
                            onClick={resetReps}
                            style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 9, cursor: 'pointer' }}
                            title="Reset Reps"
                        >
                            🔄
                        </button>
                    </div>
                )}

                <button 
                    onClick={() => setCameraActive(!cameraActive)}
                    style={{ background: cameraActive ? C.red : C.accentLow, color: cameraActive ? '#fff' : C.accent, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {cameraActive ? "DESATIVAR" : "ATIVAR CÂMARA"}
                </button>
            </div>
            
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', display: cameraActive ? 'block' : 'none' }}>
                <video ref={videoRef} style={{ display: 'none' }} playsInline />
                <canvas ref={canvasRef} width={480} height={360} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* HUD Overlay de Repetições */}
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.7)', border: `1px solid ${C.accent}`, borderRadius: 8, padding: '4px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: C.accent, fontFamily: "'DM Mono'" }}>REPS DETETADAS</span>
                    <span style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', fontFamily: "'Bebas Neue'" }}>{reps}</span>
                </div>

                {feedback && (
                    <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: feedback.includes('✓') ? C.green : C.card, border: `1px solid ${feedback.includes('✓') ? '#fff' : C.border}`, borderRadius: 20, padding: '4px 12px', color: feedback.includes('✓') ? '#000' : C.text, fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        {feedback}
                    </div>
                )}
            </div>

            {cameraStatus === 'blocked' && (
                <div style={{ background: '#1e2832', border: `2px dashed ${C.border}`, borderRadius: 12, padding: 24, textAlign: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📹🚫</div>
                    <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>Câmara Bloqueada</h3>
                    <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
                        O teu navegador impediu o acesso à câmara ou não há permissão. Podes continuar o teu treino normalmente utilizando o registo manual de repetições nas tabelas.
                    </p>
                    <button onClick={() => setCameraStatus('idle')} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 'bold' }}>
                        Mudar para Registo Manual
                    </button>
                </div>
            )}
        </div>
    );
};
