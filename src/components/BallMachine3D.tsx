import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { colors } from '../design-system/tokens/colors';

function LotteryBall({ index, active }: { index: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const palette = useMemo(() => [colors.violet, colors.magenta, colors.cyan, colors.yellow, colors.orange, colors.green], []);
  const seed = useMemo(() => ({
    x: ((index * 37) % 100) / 50 - 1,
    y: ((index * 61) % 100) / 55 - .7,
    z: ((index * 83) % 100) / 50 - 1,
    speed: .55 + (index % 5) * .09,
  }), [index]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * seed.speed;
    const energy = active ? 1 : .18;
    ref.current.position.x = seed.x * 1.1 + Math.sin(t * 2.2 + index) * .55 * energy;
    ref.current.position.y = seed.y + Math.cos(t * 2.8 + index * .7) * .7 * energy;
    ref.current.position.z = seed.z * .75 + Math.sin(t * 2.4 + index * .35) * .45 * energy;
    ref.current.rotation.x += active ? .045 : .008;
    ref.current.rotation.y += active ? .06 : .01;
  });

  return (
    <mesh ref={ref} scale={.23}>
      <sphereGeometry args={[1, 28, 28]} />
      <meshPhysicalMaterial color={palette[index % palette.length]} roughness={.28} metalness={.12} clearcoat={1} clearcoatRoughness={.16} />
    </mesh>
  );
}

function Machine({ active }: { active: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  const chamber = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.y += delta * (active ? 1.95 : .24);
    if (chamber.current) chamber.current.rotation.z = Math.sin(_.clock.elapsedTime * 0.7) * 0.045;
  });

  return (
    <group position={[0, -.15, 0]}>
      <ambientLight intensity={1.45} />
      <spotLight position={[4, 6, 5]} intensity={24} angle={.38} penumbra={1} color={colors.magenta} />
      <pointLight position={[-3, 1, 3]} intensity={12} color={colors.cyan} />
      <pointLight position={[0, 2.6, 0]} intensity={9} color={colors.yellow} />
      <Float speed={1.1} rotationIntensity={.12} floatIntensity={.15}>
        <mesh position={[0, .1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.1, .065, 20, 90]} />
          <meshStandardMaterial color={colors.magenta} metalness={.9} roughness={.15} emissive={colors.violet} emissiveIntensity={.55} />
        </mesh>
      </Float>
      <group ref={rotor}>
        {Array.from({ length: 24 }, (_, i) => <LotteryBall key={i} index={i} active={active} />)}
      </group>
      <mesh ref={chamber}>
        <sphereGeometry args={[2.1, 56, 56]} />
        <meshPhysicalMaterial transparent opacity={.22} roughness={0} transmission={.9} thickness={.16} clearcoat={1} color={colors.textPrimary} />
      </mesh>
      <mesh position={[0, -2.3, 0]}>
        <cylinderGeometry args={[1.32, 1.62, .62, 48]} />
        <meshStandardMaterial color={colors.panelStrong} metalness={.74} roughness={.24} />
      </mesh>
      <mesh position={[0, -2.65, 0]}>
        <cylinderGeometry args={[1.75, 1.9, .24, 48]} />
        <meshStandardMaterial color={colors.violet} metalness={.92} roughness={.18} />
      </mesh>
      <mesh position={[0, -2.02, 1.23]}>
        <boxGeometry args={[1.35, .4, .12]} />
        <meshStandardMaterial color={colors.cyan} metalness={.82} roughness={.2} />
      </mesh>
      <mesh position={[0, -.95, 0]}>
        <cylinderGeometry args={[.72, .84, .22, 36]} />
        <meshStandardMaterial color={colors.yellow} metalness={.7} roughness={.16} />
      </mesh>
      <Environment preset="city" />
    </group>
  );
}

export default function BallMachine3D({ active }: { active: boolean }) {
  return (
    <div className="machine-3d" aria-label="Bolillero 3D animado">
      <Canvas camera={{ position: [0, .2, 7.6], fov: 42 }} dpr={[1, 1.4]} gl={{ antialias: true, powerPreference: 'high-performance' }} performance={{ min: .65 }}>
        <Machine active={active} />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 2.45} maxPolarAngle={Math.PI / 1.85} autoRotate={!active} autoRotateSpeed={.35} />
      </Canvas>
    </div>
  );
}
