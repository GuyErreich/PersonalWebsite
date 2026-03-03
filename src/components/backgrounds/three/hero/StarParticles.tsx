import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const StarParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Dense particle count to engulf the 3 orbit tracks effectively
  const particleCount = 3500;
  
  const [initialPositions, speeds, offsets, colors, noiseDirections, angleSeeds, sizeSeeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    const offs = new Float32Array(particleCount);
    const cols = new Float32Array(particleCount * 3);
    const noiseDir = new Float32Array(particleCount * 3);
    const aSeeds = new Float32Array(particleCount);
    const sSeeds = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const r = 1.0 + Math.random() * 14.0;
        const theta = 2 * Math.PI * Math.random();
        
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = (Math.random() - 0.5) * 5.0 * Math.exp(-(r - 5) * (r - 5) / 50);
        
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        
        spd[i] = Math.random() * 0.05 + 0.02; 
        offs[i] = Math.random() * Math.PI * 2;
        
        noiseDir[i * 3] = (Math.random() - 0.5) * 2;     
        noiseDir[i * 3 + 1] = (Math.random() - 0.5) * 2; 
        noiseDir[i * 3 + 2] = (Math.random() - 0.5) * 2; 

        // Base star color/brightness
        const brightness = Math.random() * 0.5 + 0.5; 
        cols[i * 3] = brightness;
        cols[i * 3 + 1] = brightness;
        cols[i * 3 + 2] = brightness;
        
        aSeeds[i] = Math.random(); // Used for angular flare animations
        sSeeds[i] = Math.random(); // Used for size variations & frequencies
    }
    
    return [pos, spd, offs, cols, noiseDir, aSeeds, sSeeds];
  }, [particleCount]);

  const positions = useMemo(() => new Float32Array(initialPositions), [initialPositions]);
  
  // Custom GPU Shader to mathematically calculate rotating light breakage & flickering spikes
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  const vertexShader = `
    uniform float uTime;
    attribute float angleSeed;
    attribute float sizeSeed;
    varying vec3 vColor;
    varying float vAngleSeed;
    varying float vSizeSeed;
    
    void main() {
      vColor = color;
      vAngleSeed = angleSeed;
      vSizeSeed = sizeSeed;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size distribution logic perfectly mapped to a 1 - 10 conceptual scale:
      // 95% of the stars map to sizes between 1.0 and 6.5
      // The top 5% of stars map to sizes between 7.5 and 10.0
      float conceptualSize = (vSizeSeed < 0.95) 
          ? (1.0 + (vSizeSeed / 0.95) * 5.5) 
          : (7.5 + ((vSizeSeed - 0.95) / 0.05) * 2.5);
          
      // Convert the 1-10 size into a multiplier that fits the 3D screen rendering
      float randomScale = conceptualSize * 0.15;
      
      float twinkle = randomScale * (0.8 + 0.2 * sin(uTime * 3.0 + vAngleSeed * 10.0));
      
      // Re-enable camera depth attenuation so 3D panning works, but multiply by our massive random scale variance
      gl_PointSize = 150.0 * (1.0 / -mvPosition.z) * twinkle;
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec3 vColor;
    varying float vAngleSeed;
    varying float vSizeSeed;

    void main() {
      // Standardize coordinates so center of the billboard is 0,0
      vec2 uv = gl_PointCoord.xy - vec2(0.5);
      float dist = length(uv);
      
      // Cut off edges mathematically
      if (dist > 0.5) discard;

      // 1. Core Glowing Body
      float core = exp(-dist * 12.0) * 0.8; 
      core += exp(-dist * 25.0) * 1.5; // Burning hot center point

      // 2. Animated Radiating Spikes (Light Breakage)
      float angle = atan(uv.y, uv.x);
      
      // Give them a massive continuous variety of base prongs (from 2 to 14!)
      // By using two distinct integer prongs, they will mathematically destruct and form infinite new shapes
      float prongs1 = floor(vAngleSeed * 12.0) + 2.0; 
      float prongs2 = floor(vSizeSeed * 8.0) + 2.0; 
      
      // Give each star a totally unique, continuous rotation speed and direction
      float rot1 = angle + uTime * (0.1 + vAngleSeed * 0.4);
      float rot2 = angle - uTime * (0.1 + vSizeSeed * 0.4);
      
      // Calculate overlapping wrap-safe sine waves
      float wave1 = sin(rot1 * prongs1);
      float wave2 = sin(rot2 * prongs2);
      
      // The flares ONLY appear where wave 1 and wave 2 collide (Constructive Interference)
      // This makes flares appear and disappear organically around the star
      float breakage = max(0.0, wave1 * wave2);
      
      // Randomly scale each individual ray independently to create a rapid micro-flicker on the spikes
      // By locking the phase index to the ROTATING wave (rot1 * prongs1) instead of the static screen angle,
      // the ray doesn't "cross" static boundaries which was causing chaotic stuttering.
      // This guarantees every single ray on every star pulses at EXACTLY the same mathematical speed (uTime * 3.0).
      float rayIndex = floor((rot1 * prongs1) / 3.14159);
      float randomPhase = fract(sin(rayIndex * 12.9898 + vSizeSeed * 78.233) * 43758.5453);
      float rayFlicker = 0.7 + 0.3 * sin(uTime * 3.0 + randomPhase * 10.0);
      breakage *= rayFlicker;
      
      // Continuously randomize the thickness/sharpness of the beams per star
      // Some will have fat glowing streaks, others will have razor-thin laser needles
      float sharpness = 2.0 + (vAngleSeed * 8.0);
      breakage = pow(breakage, sharpness);
      
      // Continuously vary the length of the spikes so they aren't bound in a uniform circle
      float lengthFalloff = 4.0 + (vSizeSeed * 12.0); 
      float spikeFlare = breakage * exp(-dist * lengthFalloff) * (4.0 + vAngleSeed * 8.0);
      
      // Blend everything cleanly into an alpha channel
      float finalAlpha = core + spikeFlare;
      
      // Give a smooth boundary to eliminate rough cuts at the absolute edges
      finalAlpha *= smoothstep(0.5, 0.4, dist);
      
      // Multiply color by an emissive factor (2.5) to make the stars "glow" via HDR tone mapping over-saturation.
      gl_FragColor = vec4(vColor * 2.5, finalAlpha);
    }
  `;

  useFrame(({ clock }) => {
    // We deploy the starry void *before* the main explosion!
    // The implosion finishes at 7.8s. We give it a brief tiny gap, 
    // then spawn the stars at 8.2s out of the silence, 
    // leading up to the main Big Bang explosion at 8.6s!
    const t = Math.max(0, clock.elapsedTime - 8.6);
    
    // Update GPU uniform (we pass real clock time for the glimmer so they animate even while invisible)
    if (materialRef.current) {
        // Continue to pass the un-delayed elapsed time to the shaders so their pulse maths stay consistent
        materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }

    if (!particlesRef.current) return;
    
    // Stay hidden at scale 0 until t begins to tick upward
    if (t === 0) {
      particlesRef.current.visible = false;
      return; // Skip calculating CPU noise when totally invisible
    } else {
      particlesRef.current.visible = true;
    }

    // Deploy very fast so they fill the screen just before the 8.6s bang!
    const progress = Math.min(1, t / 1.5);
    const ease = 1 - Math.pow(1 - progress, 5); // very snappy quintic ease out
    
    particlesRef.current.scale.set(ease * 1.0 + 0.01, ease * 1.0 + 0.01, ease * 1.0 + 0.01);
    particlesRef.current.rotation.y = t * 0.015; 
    
    const geom = particlesRef.current.geometry;
    const positionAttr = geom.attributes.position;
    
    // Only physical bobbing remains on CPU, calculating 3500 points
    // (Notice that Color-flickering has been fully offloaded to the GPU!)
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const noiseAmt = Math.sin(t * speeds[i] + offsets[i]);
        const floatRadius = 0.2; 
        
        positionAttr.array[i3] = initialPositions[i3] + (noiseDirections[i3] * noiseAmt * floatRadius);
        positionAttr.array[i3 + 1] = initialPositions[i3 + 1] + (noiseDirections[i3 + 1] * noiseAmt * floatRadius);
        positionAttr.array[i3 + 2] = initialPositions[i3 + 2] + (noiseDirections[i3 + 2] * noiseAmt * floatRadius);
    }
    
    positionAttr.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef} visible={false}>
      <bufferGeometry>
        <bufferAttribute 
            attach="attributes-position" 
            count={particleCount} 
            array={positions} 
            itemSize={3}
            args={[positions, 3]} 
        />
        <bufferAttribute 
            attach="attributes-color" 
            count={particleCount} 
            array={colors} 
            itemSize={3}
            args={[colors, 3]} 
        />
        <bufferAttribute 
            attach="attributes-angleSeed" 
            count={particleCount} 
            array={angleSeeds} 
            itemSize={1}
            args={[angleSeeds, 1]} 
        />
        <bufferAttribute 
            attach="attributes-sizeSeed" 
            count={particleCount} 
            array={sizeSeeds} 
            itemSize={1}
            args={[sizeSeeds, 1]} 
        />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
};
