'use client';
import {Canvas,useFrame,ThreeEvent} from '@react-three/fiber';
import {Environment,Float} from '@react-three/drei';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';

function Knot(){
 const group=useRef<THREE.Group>(null);const pointer=useRef({x:0,y:0});const dragging=useRef(false);const previous=useRef({x:0,y:0});const angles=useRef({x:0,y:0});const [reduced,setReduced]=useState(false);
 useEffect(()=>{const mq=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(mq.matches);sync();mq.addEventListener('change',sync);return()=>mq.removeEventListener('change',sync)},[]);
 useFrame((state,delta)=>{if(!group.current||reduced)return;const smooth=Math.min(1,delta*3);const t=state.clock.elapsedTime;const idle=dragging.current?0:t*.08;group.current.rotation.y=THREE.MathUtils.lerp(group.current.rotation.y,angles.current.y+pointer.current.x*.35+idle,smooth);group.current.rotation.x=THREE.MathUtils.lerp(group.current.rotation.x,angles.current.x-pointer.current.y*.22,smooth);group.current.rotation.z=Math.sin(t*.17)*.06});
 const down=(e:ThreeEvent<PointerEvent>)=>{dragging.current=true;previous.current={x:e.clientX,y:e.clientY};(e.target as Element).setPointerCapture?.(e.pointerId)};
 const move=(e:ThreeEvent<PointerEvent>)=>{if(dragging.current){angles.current.y+=(e.clientX-previous.current.x)*.008;angles.current.x+=(e.clientY-previous.current.y)*.006;previous.current={x:e.clientX,y:e.clientY}}else{pointer.current.x=e.pointer.x;pointer.current.y=e.pointer.y}};
 const up=()=>{dragging.current=false};
 return <group ref={group} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
 <mesh rotation={[.28,.2,.2]}><torusKnotGeometry args={[1.15,.32,260,24,2,5]}/><meshPhysicalMaterial color="#d6d7de" metalness={1} roughness={.13} clearcoat={1} clearcoatRoughness={.09} envMapIntensity={2.2}/></mesh>
 <mesh rotation={[1.15,.65,.7]} scale={.79}><torusKnotGeometry args={[1.1,.13,200,16,3,4]}/><meshPhysicalMaterial color="#a7aab5" metalness={1} roughness={.18} envMapIntensity={2}/></mesh>
 </group>
}
export default function Sculpture(){return <div className="h-[340px] w-full cursor-grab active:cursor-grabbing sm:h-[480px] lg:h-[620px]" aria-label="Интерактивна абстрактна хромирана 3D скулптура"><Canvas camera={{position:[0,0,5.4],fov:42}} dpr={[1,1.75]} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div>3D визуализацията не се поддържа от този браузър.</div>}><ambientLight intensity={.7}/><directionalLight position={[4,5,6]} intensity={4} color="#ffffff"/><directionalLight position={[-4,-2,3]} intensity={2} color="#ff6847"/><Float speed={1} rotationIntensity={.04} floatIntensity={.1}><Knot/></Float><Environment preset="city"/></Canvas></div>}
