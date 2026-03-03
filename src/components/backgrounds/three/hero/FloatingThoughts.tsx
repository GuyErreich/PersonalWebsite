import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const FloatingThoughts = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  const thoughts = [
    "Strong foundations create smooth experiences.",
    "Building the foundation. Shaping the experience.",
    "Turning complexity into smooth experiences.",
    "From cloud platforms to player moments — built to feel right.",
    "I build things that just work — and feel great."
  ];

  // Five known, spread-out positions
  const textItems = useMemo(() => {
    // Pushed Y coordinates significantly further apart, utilizing the full vertical space
    // Increased X widths heavily so they span the left and right edges 
    const basePositions = [
      { x: -3.0, y:  3.2, z: -2.5 }, // Top-Left
      { x:  3.0, y:  1.6, z: -1.5 }, // Mid-Right
      { x: -2.8, y:  0.0, z: -1.0 }, // Center-Left
      { x:  3.0, y: -1.6, z: -1.5 }, // Lower-Right
      { x: -3.0, y: -3.2, z: -2.5 }, // Bottom-Left
    ];
    // Shuffle the array of positions so the text to position mapping is random
    const shuffledPositions = [...basePositions].sort(() => Math.random() - 0.5);

    return thoughts.map((text, i) => {
      const { x, y, z } = shuffledPositions[i];

      // Use the blue-to-emerald gradient colors to match the hero text
      const colors = ["#60a5fa", "#34d399", "#38bdf8", "#2dd4bf", "#4ade80"];

      return {
        text,
        x, y, z,
        color: colors[i % colors.length],
        ref: React.createRef<THREE.Group>(),
        textRef: React.createRef<any>(),
        delay: i * 0.6 // Increased stagger spacing to give readers more time per sentence
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    
    // The delay between the thoughts appearing, to when they get sucked in. 
    // We added 1.0s to the old timing mapping. So the collapse triggers at 4.0s now.
    
    textItems.forEach((item, i) => {
      const group = item.ref.current;
      const textMesh = item.textRef.current;
      if (!group || !textMesh) return;

      // 1. Appearance Phase (0 - 4.0s)
      if (t < item.delay) {
        group.visible = false;
        return;
      }
      group.visible = true;

      const activeT = t - item.delay;
      
      // Gentle floating animation based on active time
      // Reduced movement scale dramatically from 0.2 down to 0.05 so they are easy to read
      const floatX = Math.sin(activeT * 1.5 + i) * 0.05;
      const floatY = Math.cos(activeT * 1.0 + i) * 0.05;
      
      let currentX = item.x + floatX;
      let currentY = item.y + floatY;
      let currentZ = item.z;
      
      // Calculate a bouncy "pop in" scale when they first appear
      let introScale = 1.0;
      if (activeT < 0.8) {
        const x = activeT / 0.8; 
        const c1 = 1.70158;
        const c3 = c1 + 1;
        // Standard easeOutBack math for a bouncy overshoot
        introScale = Math.max(0, 1.0 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2));
      }

      let scale = introScale;

      // Fade in linearly starting only at its specific delay, up to a max of 0.8
      // Then hold it at that target opacity so it doesn't wash out instantly to blinding white
      const targetOpacity = 0.85; 
      let opacity = Math.min(targetOpacity, (activeT / 0.8) * targetOpacity); 

      // 2. Collapse Phase (4.0s - 5.0s)
      if (t > 4.0) {
        const collapseProgress = Math.min(1, (t - 4.0) / 1.0);
        // Exponential ease-in for the suck-in effect
        const suckEase = Math.pow(collapseProgress, 3);
        
        // Lerp towards 0,0,0
        currentX = THREE.MathUtils.lerp(currentX, 0, suckEase);
        currentY = THREE.MathUtils.lerp(currentY, 0, suckEase);
        currentZ = THREE.MathUtils.lerp(currentZ, 0, suckEase);
        
        // Scale down to 0 at the very end
        scale = 1.0 - suckEase;
        
        // Fade out slightly at the collision point
        opacity *= (1.0 - collapseProgress * 0.5);
      }

      group.position.set(currentX, currentY, currentZ);
      group.scale.setScalar(scale);
      
      // Update text material opacity natively
      if (textMesh.material) {
        textMesh.material.transparent = true;
        textMesh.material.opacity = opacity;
      }
    });

    // Make the entire group slightly drift
    if (groupRef.current) {
        groupRef.current.position.y = Math.sin(t) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {textItems.map((item, i) => (
        <group key={i} ref={item.ref} visible={false}>
          <Text
            ref={item.textRef}
            fontSize={0.25} // Punchier font size to match hero subtitle feel
            maxWidth={3.5}  // Widened so text comfortably spans 1-2 lines instead of stacking
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color={item.color}
            fontWeight="bold"
            letterSpacing={-0.05} // Matches "tracking-tight"
          >
            {item.text}
          </Text>
        </group>
      ))}
    </group>
  );
};
