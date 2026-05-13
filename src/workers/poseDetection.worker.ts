import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let landmarker: PoseLandmarker | null = null;
let lastY: number | null = null;
let lastTime: number | null = null;
let peakVelocity = 0;

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  if (type === 'init') {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/models/pose_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1
    });
    self.postMessage({ type: 'ready' });
  }
  
  if (type === 'detect' && landmarker) {
    // Processamento pesado focado nesta thread
    const result = landmarker.detectForVideo(data.videoFrame, data.timestamp);
    
    // FASE 2: VBT (Velocity-Based Training)
    let vbtWarning = false;
    if (result && result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0];
        // Average wrist height (y axis in image coordinates)
        const currentY = (landmarks[15].y + landmarks[16].y) / 2;
        const currentTime = data.timestamp;
        
        if (lastY !== null && lastTime !== null) {
            const dy = lastY - currentY; // positive if hands are moving up
            const dt = currentTime - lastTime;
            
            if (dt > 0) {
                const velocity = dy / dt;
                
                // Track peak concentric velocity of the set
                if (velocity > 0.001) { // Threshold for concentric movement
                    if (velocity > peakVelocity) {
                        peakVelocity = velocity;
                    } else if (peakVelocity > 0 && velocity < peakVelocity * 0.8) {
                        // Velocity dropped by more than 20% compared to peak
                        vbtWarning = true;
                    }
                }
            }
        }
        
        lastY = currentY;
        lastTime = currentTime;
    }

    self.postMessage({ type: 'result', data: result, vbtWarning });
  }
});
