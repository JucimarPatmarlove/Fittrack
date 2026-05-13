import { useEffect, useRef, useCallback } from 'react';

export const useWorkerPoseDetection = () => {
  const workerRef = useRef<Worker | null>(null);
  
  useEffect(() => {
    // Inicializa o worker apontando para o ficheiro criado
    workerRef.current = new Worker(new URL('../workers/poseDetection.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.postMessage({ type: 'init' });
    
    return () => workerRef.current?.terminate();
  }, []);
  
  const detectPose = useCallback((videoFrame: HTMLVideoElement) => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
          resolve(null);
          return;
      }
      
      const onMessage = (event: MessageEvent) => {
        if (event.data.type === 'result') {
          workerRef.current?.removeEventListener('message', onMessage);
          resolve(event.data.data);
        }
      };
      workerRef.current.addEventListener('message', onMessage);
      
      // Enviar imagem atual para ser rasgada pelo tensor (O videoFrame precisaria de ser serializado num blob/imagebitmap para performance real, mas em WebWorker viajas normalmente com postMessage normal)
      // Nota: o melhor caminho para performar é extrair o Frame para createImageBitmap(videoFrame) e enviar os dados
      createImageBitmap(videoFrame).then(bitmap => {
          workerRef.current?.postMessage({
              type: 'detect',
              data: { videoFrame: bitmap, timestamp: performance.now() }
          }, [bitmap]); // Transferable object
      }).catch(() => resolve(null));
      
    });
  }, []);
  
  return { detectPose };
};
