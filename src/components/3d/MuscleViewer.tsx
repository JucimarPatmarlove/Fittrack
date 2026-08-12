import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import type React from 'react';
import { Suspense, useRef } from 'react';
import type * as THREE from 'three';
import { C } from '../../data/constants';
import { MuscleSphere } from './MuscleSphere';

const PoseRig = ({
  fatigueStats,
  landmarksRef,
}: { fatigueStats: Record<string, number>; landmarksRef?: React.MutableRefObject<any[]> }) => {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (landmarksRef && landmarksRef.current && landmarksRef.current.length > 0) {
      const landmarks = landmarksRef.current;
      // Mapping MediaPipe to 3D Rotations (simplified)
      // Left Shoulder (11), Left Elbow (13), Left Wrist (15)
      // Right Shoulder (12), Right Elbow (14), Right Wrist (16)
      try {
        if (leftArmRef.current) {
          leftArmRef.current.position.y = 4.8 - landmarks[11].y * 2;
          leftArmRef.current.position.x = -1.2 + landmarks[11].x * 2;
        }
        if (rightArmRef.current) {
          rightArmRef.current.position.y = 4.8 - landmarks[12].y * 2;
          rightArmRef.current.position.x = 1.2 - landmarks[12].x * 2;
        }
      } catch (_e) { /* Silently handle missing landmark data */ }
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* CABEÇA */}
      <MuscleSphere
        name="Head"
        position={[0, 6, 0]}
        args={[0.5, 32, 32]}
        intensity={0}
        fallbackColor="#333"
      />

      {/* PESCOÇO */}
      <MuscleSphere
        name="Neck"
        position={[0, 5.2, 0]}
        args={[0.2, 0.4, 32]}
        isCylinder
        intensity={0}
        fallbackColor="#333"
      />

      {/* OMBROS E BRAÇOS DENTRO DE GRUPOS ANIMADOS */}
      <group ref={leftArmRef} position={[-1.2, 4.8, 0]}>
        <MuscleSphere
          name="LeftShoulder"
          position={[0, 0, 0]}
          args={[0.6, 32, 32]}
          intensity={fatigueStats['Ombros'] || 0}
        />
        <MuscleSphere
          name="LeftBicep"
          position={[-0.2, -1.3, 0.2]}
          args={[0.3, 1.2, 32]}
          isCylinder
          intensity={fatigueStats['Bíceps'] || 0}
        />
        <MuscleSphere
          name="LeftForearm"
          position={[-0.2, -3.0, 0]}
          args={[0.25, 1.5, 32]}
          isCylinder
          intensity={0}
          fallbackColor="#333"
        />
      </group>

      <group ref={rightArmRef} position={[1.2, 4.8, 0]}>
        <MuscleSphere
          name="RightShoulder"
          position={[0, 0, 0]}
          args={[0.6, 32, 32]}
          intensity={fatigueStats['Ombros'] || 0}
        />
        <MuscleSphere
          name="RightBicep"
          position={[0.2, -1.3, 0.2]}
          args={[0.3, 1.2, 32]}
          isCylinder
          intensity={fatigueStats['Bíceps'] || 0}
        />
        <MuscleSphere
          name="RightForearm"
          position={[0.2, -3.0, 0]}
          args={[0.25, 1.5, 32]}
          isCylinder
          intensity={0}
          fallbackColor="#333"
        />
      </group>

      {/* PEITO E COSTAS (Tronco Upper) */}
      <MuscleSphere
        name="Peito"
        position={[0, 4.2, 0.3]}
        args={[1.2, 1.2, 0.4]}
        isBox
        intensity={fatigueStats['Peito'] || 0}
      />
      <MuscleSphere
        name="Costas"
        position={[0, 4.2, -0.3]}
        args={[1.2, 1.2, 0.4]}
        isBox
        intensity={fatigueStats['Costas'] || 0}
      />

      {/* CORE / ABD */}
      <MuscleSphere
        name="Core"
        position={[0, 2.7, 0]}
        args={[0.9, 1.4, 0.6]}
        isBox
        intensity={fatigueStats['Core'] || 0}
      />

      {/* PERNAS - COXAS E PANTURRILHA */}
      <MuscleSphere
        name="LeftLeg"
        position={[-0.5, 1, 0]}
        args={[0.4, 2, 32]}
        isCylinder
        intensity={fatigueStats['Pernas'] || 0}
      />
      <MuscleSphere
        name="RightLeg"
        position={[0.5, 1, 0]}
        args={[0.4, 2, 32]}
        isCylinder
        intensity={fatigueStats['Pernas'] || 0}
      />

      <MuscleSphere
        name="LeftCalf"
        position={[-0.5, -1.2, 0]}
        args={[0.3, 2, 32]}
        isCylinder
        intensity={fatigueStats['Pernas'] || 0}
      />
      <MuscleSphere
        name="RightCalf"
        position={[0.5, -1.2, 0]}
        args={[0.3, 2, 32]}
        isCylinder
        intensity={fatigueStats['Pernas'] || 0}
      />
    </group>
  );
};

export const MuscleViewer = ({
  fatigueStats,
  landmarksRef,
}: { fatigueStats: Record<string, number>; landmarksRef?: React.MutableRefObject<any[]> }) => {
  // fatigueStats: Record do nome do músculo para intensity (0.0 a 1.0)

  // Core Cyberpunk android geometry mapped to Fittrack muscles
  return (
    <div
      style={{
        height: 350,
        width: '100%',
        background: 'linear-gradient(180deg, #05070a 0%, #0e1318 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none', zIndex: 10 }}>
        <p style={{ fontFamily: "'Bebas Neue'", color: C.accent, fontSize: 16 }}>
          MODELO BIOMÉTRICO
        </p>
        <p style={{ color: C.muted, fontSize: 10 }}>Rodar Rato/Touch 360º</p>
      </div>
      <Suspense
        fallback={
          <div style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>
            Carregando 3D...
          </div>
        }
      >
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <PoseRig fatigueStats={fatigueStats} landmarksRef={landmarksRef} />

          <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={10} blur={2} far={4} />
          <Environment preset="city" />
          <OrbitControls
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 4}
            enableZoom={true}
            autoRotate
            autoRotateSpeed={2}
          />
        </Canvas>
      </Suspense>
    </div>
  );
};
