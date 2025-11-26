
'use client';

import React, { useRef, useMemo, Suspense, Component } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Cylinder, Text, useTexture, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';

// Error Boundary
interface TextureErrorBoundaryProps {
  children?: React.ReactNode;
  fallback: React.ReactNode;
}
export class TextureErrorBoundary extends React.Component<TextureErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export const CanvasLoader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-2" />
        <div className="text-sm font-bold text-gray-600">{progress.toFixed(0)}%</div>
      </div>
    </Html>
  );
};

export const MusicVisualizer = () => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * 3;
    groupRef.current.children.forEach((child, i) => {
       const mesh = child as THREE.Mesh;
       const material = mesh.material as THREE.MeshBasicMaterial;
       const offset = i * 1.5;
       const cycle = (t + offset) % 5; 
       const scale = 0.5 + (cycle / 5) * 1.5; 
       mesh.scale.setScalar(scale);
       const opacity = Math.max(0, 1.0 - (cycle / 5));
       material.opacity = opacity * 0.6; 
    });
  });
  return (
    <group ref={groupRef} rotation={[Math.PI/2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}><torusGeometry args={[0.15, 0.02, 16, 32]} /><meshBasicMaterial color="#4ade80" transparent toneMapped={false} /></mesh>
      ))}
    </group>
  );
};

export const SeedsVisualizer = () => {
    const positions = useMemo(() => {
        const arr = [];
        for(let i=0; i<80; i++) {
            arr.push([(Math.random() - 0.5) * 3.5, 0.78, (Math.random() - 0.5) * 2.5] as [number, number, number]);
        }
        return arr;
    }, []);
    return (
        <group>
            {positions.map((pos, i) => (
                <mesh key={i} position={pos} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} castShadow receiveShadow>
                    <capsuleGeometry args={[0.02, 0.05, 4]} /><meshStandardMaterial color="#f59e0b" roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
};

export const FanVisualizer = () => {
    const bladesRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => { if (bladesRef.current) bladesRef.current.rotation.z += delta * 10; });
    return (
        <group>
            <RoundedBox args={[0.6, 0.6, 0.15]} radius={0.05} castShadow receiveShadow>
                <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </RoundedBox>
            <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.08]}><circleGeometry args={[0.28, 32]} /><meshBasicMaterial color="#0f172a" /></mesh>
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, -0.08]}><circleGeometry args={[0.28, 32]} /><meshBasicMaterial color="#0f172a" /></mesh>
            <group ref={bladesRef} position={[0, 0, 0]}>
                 <Cylinder args={[0.1, 0.1, 0.1]} rotation={[Math.PI/2, 0, 0]}><meshStandardMaterial color="#334155" /></Cylinder>
                 {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 7]} position={[0, 0, 0]}>
                        <boxGeometry args={[0.25, 0.05, 0.02]} />
                        <meshStandardMaterial color="#475569" />
                    </mesh>
                 ))}
            </group>
        </group>
    );
};

export const PumpVisualizer = () => {
    return (
        <group>
            <RoundedBox args={[0.5, 0.6, 0.4]} radius={0.05} castShadow receiveShadow><meshStandardMaterial color="#3b82f6" roughness={0.4} /></RoundedBox>
            <Cylinder args={[0.08, 0.08, 0.1]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.1, 0.2]} castShadow><meshStandardMaterial color="#1d4ed8" /></Cylinder>
            <group position={[0, 0.3, 0]}>
                <Cylinder args={[0.04, 0.04, 0.8]} position={[0, 0.4, 0]} castShadow><meshPhysicalMaterial color="#93c5fd" transmission={0.5} roughness={0.2} transparent opacity={0.8} /></Cylinder>
            </group>
        </group>
    );
};

export const HeaterVisualizer = () => (
    <group position={[0, 0.02, 0]}>
        <RoundedBox args={[3.6, 0.05, 2.6]} radius={0.1} receiveShadow>
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </RoundedBox>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.03, 0]}><planeGeometry args={[3.4, 2.4]} /><meshBasicMaterial color="#dc2626" transparent opacity={0.1} /></mesh>
        <RoundedBox args={[0.3, 0.08, 0.2]} position={[1.6, 0.04, 0]} radius={0.02}><meshStandardMaterial color="#000" /></RoundedBox>
    </group>
);

export const ControllerVisualizer = () => (
    <group>
         <RoundedBox args={[0.6, 0.9, 0.25]} radius={0.05} castShadow><meshStandardMaterial color="#f8fafc" roughness={0.5} /></RoundedBox>
        <mesh position={[0, 0.2, 0.13]}><planeGeometry args={[0.4, 0.3]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} /></mesh>
        <group position={[0, -0.2, 0.13]}><circleGeometry args={[0.05, 16]} /><meshStandardMaterial color="#cbd5e1" /></group>
        <Cylinder args={[0.01, 0.01, 0.3]} position={[0.2, 0.45, 0]}><meshStandardMaterial color="#1e293b" /></Cylinder>
    </group>
);

export const CameraVisualizer = () => (
    <group>
        <RoundedBox args={[0.4, 0.3, 0.2]} radius={0.05} castShadow><meshStandardMaterial color="#0f172a" roughness={0.5} /></RoundedBox>
        <Cylinder args={[0.12, 0.12, 0.1]} rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.11]}><meshStandardMaterial color="#1e293b" /></Cylinder>
        <mesh position={[0, 0, 0.165]} rotation={[Math.PI/2, 0, 0]}><ringGeometry args={[0.08, 0.1, 32]} /><meshBasicMaterial color="#ef4444" /></mesh>
        <Cylinder args={[0.01, 0.01, 0.5]} position={[0.15, 0.3, 0]}><meshStandardMaterial color="#000" /></Cylinder>
    </group>
);

export const TempSensorVisualizer = () => (
  <group>
    <Cylinder args={[0.01, 0.01, 0.5]} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} /></Cylinder>
    <RoundedBox args={[0.08, 0.12, 0.08]} position={[0, 0.5, 0]} castShadow radius={0.02}><meshStandardMaterial color="#f87171" /></RoundedBox>
  </group>
);

export const HumiditySensorVisualizer = () => (
  <group>
    <RoundedBox args={[0.12, 0.25, 0.04]} position={[0, 0.3, 0]} castShadow radius={0.02}><meshStandardMaterial color="#0ea5e9" /></RoundedBox>
    <group position={[0, 0.1, 0]}>
       <Cylinder args={[0.006, 0.002, 0.3]} position={[-0.03, 0, 0]}><meshStandardMaterial color="#cbd5e1" metalness={0.5} /></Cylinder>
       <Cylinder args={[0.006, 0.002, 0.3]} position={[0.03, 0, 0]}><meshStandardMaterial color="#cbd5e1" metalness={0.5} /></Cylinder>
    </group>
    <Text position={[0, 0.35, 0.021]} fontSize={0.06} color="white" rotation={[0, 0, 0]}>H₂O</Text>
  </group>
);

export const LightSensorVisualizer = () => (
    <group>
        <Cylinder args={[0.08, 0.08, 0.04]} rotation={[Math.PI/2, 0, 0]} castShadow><meshStandardMaterial color="#facc15" /></Cylinder>
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0.021]}><circleGeometry args={[0.06, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
    </group>
);

export const TimerVisualizer = () => (
    <group>
        <RoundedBox args={[0.15, 0.25, 0.05]} radius={0.02} castShadow><meshStandardMaterial color="#94a3b8" /></RoundedBox>
        <mesh position={[0, 0.05, 0.026]}><circleGeometry args={[0.05, 16]} /><meshBasicMaterial color="#000" /></mesh>
         <mesh position={[0, 0.05, 0.027]}><planeGeometry args={[0.01, 0.04]} /><meshBasicMaterial color="#ef4444" /></mesh>
    </group>
);

export const VentVisualizer = ({ isDomed }: { isDomed: boolean }) => {
    const ventColor = "#334155";
    const yPos = isDomed ? 1.0 : 0.1;
    return (
      <group>
        <group position={[-2.01, yPos, 0]} rotation={[0, 0, Math.PI/2]}>
           <Cylinder args={[isDomed ? 0.3 : 0.05, isDomed ? 0.3 : 0.05, 0.05]} rotation={[0,0,0]}><meshStandardMaterial color={ventColor} /></Cylinder>
        </group>
        <group position={[2.01, yPos, 0]} rotation={[0, 0, Math.PI/2]}>
           <Cylinder args={[isDomed ? 0.3 : 0.05, isDomed ? 0.3 : 0.05, 0.05]} rotation={[0,0,0]}><meshStandardMaterial color={ventColor} /></Cylinder>
        </group>
      </group>
    );
};

export const SubstrateLayer: React.FC<{ type: string }> = ({ type }) => {
    const textureUrl = type === 'coco' 
        ? 'https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&q=80&w=512' 
        : 'https://images.unsplash.com/photo-1523293836414-f04e712e1f3b?auto=format&fit=crop&q=80&w=512';
    const texture = useTexture(textureUrl);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    return (
        <RoundedBox args={[3.8, 0.1, 2.8]} position={[0, 0.7, 0]} receiveShadow>
             <meshStandardMaterial map={texture} color={type === 'coco' ? '#6d4c41' : '#e0e0e0'} roughness={0.9} bumpMap={texture} bumpScale={0.05} />
        </RoundedBox>
    );
};
