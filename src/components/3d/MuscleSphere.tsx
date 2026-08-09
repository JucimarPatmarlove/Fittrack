// @ts-nocheck
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MuscleSphere = ({ 
    position, args, intensity = 0, name, 
    isCylinder = false, isBox = false, fallbackColor = '#1e2832'
}: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (meshRef.current && intensity > 0.5) {
            // Pulsação cyborg baseada na intensidade
            meshRef.current.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02 * intensity;
            meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02 * intensity;
        }
    });

    const getColor = () => {
        if (hovered) return '#ffffff';
        if (intensity <= 0) return fallbackColor;
        // Cyberpunk colors: Low fatigue = yellow/greenish. High fatigue = red/neon pink
        if (intensity < 0.3) return '#e8c84a'; // Amarelo
        if (intensity < 0.7) return '#f48c06'; // Laranja
        return '#dc2f02'; // Vermelho intenso
    };

    return (
        <mesh 
            ref={meshRef} 
            position={position}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
            onPointerOut={() => setHover(false)}
        >
            {isBox ? (
                <boxGeometry args={args} />
            ) : isCylinder ? (
                <cylinderGeometry args={args} />
            ) : (
                <sphereGeometry args={args} />
            )}
            
            <meshStandardMaterial 
                color={getColor()} 
                roughness={0.2} 
                metalness={0.8}
                emissive={getColor()}
                emissiveIntensity={intensity > 0 ? intensity * 0.8 : 0}
            />
        </mesh>
    );
};
