const fs = require('fs');

const path = '/home/opsxe/Development/PersonalWebsite/src/components/backgrounds/three/hero/StarParticles.tsx';
let txt = fs.readFileSync(path, 'utf8');

const oldStr = `  const fragmentShader = \`
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
      
      // Compute two rotating overlapping wave frequencies using the random seeds
      // This causes flares to mathematically collide, meaning they constantly appear and disappear at DIFFERENT ANGLES!
      float rot1 = angle + uTime * (0.3 + vAngleSeed * 1.5);
      float rot2 = angle - uTime * (0.5 + vSizeSeed * 1.2);
      
      // Determine randomly how many ray prongs this specific star has (3 to 7)
      float freq = floor(vAngleSeed * 5.0) + 3.0; 
      
      float wave1 = sin(rot1 * freq);
      float wave2 = sin(rot2 * (freq + vSizeSeed * 0.5) + vSizeSeed * 10.0);
      
      // Flares uniquely form where the sine waves intersect cleanly (Constructive Interference)
      float breakage = max(0.0, wave1 * wave2);
      
      // Thin out and sharpen the colliding flares into actual streaks
      breakage = pow(breakage, 6.0);
      
      // Scale out the flare strength logarithmically against the billboard's distance
      float spikeFlare = breakage * exp(-dist * 9.0) * 5.0;
      
      // Blend everything cleanly into an alpha channel
      float finalAlpha = core + spikeFlare;
      
      // Give a smooth boundary to eliminate rough cuts at the absolute edges
      finalAlpha *= smoothstep(0.5, 0.4, dist);
      
      gl_FragColor = vec4(vColor, finalAlpha);
    }
  \`;`;

const newStr = `  const fragmentShader = \`
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

      // 2. Static angles with pulsating scales (Star flares)
      float angle = atan(uv.y, uv.x);
      
      // Rotate the entire lens flare by a fixed random amount per star so they aren't all uniform
      angle += vAngleSeed * 6.28318;
      
      // Create angular masks for 4 primary rays (cross) and 4 diagonal rays
      // pow(abs(cos)) creates sharp, thin lines at specific angles
      float ray1 = pow(abs(cos(angle)), 40.0); // X axis
      float ray2 = pow(abs(sin(angle)), 40.0); // Y axis
      float ray3 = pow(abs(cos(angle + 0.78539)), 40.0); // Diagonal 1
      float ray4 = pow(abs(sin(angle + 0.78539)), 40.0); // Diagonal 2
      
      // Assign an independent pulsing sine wave to each line to make them individually grow and shrink
      float pulse1 = sin(uTime * (2.0 + vSizeSeed * 2.0) + vAngleSeed * 10.0) * 0.5 + 0.5;
      float pulse2 = sin(uTime * (1.5 + vAngleSeed * 3.0) + vSizeSeed * 15.0) * 0.5 + 0.5;
      float pulse3 = sin(uTime * (2.5 + vSizeSeed * 1.5) + vAngleSeed * 5.0) * 0.5 + 0.5;
      float pulse4 = sin(uTime * (1.8 + vAngleSeed * 2.2) + vSizeSeed * 8.0) * 0.5 + 0.5;
      
      // Make the light fade out smoothly as it travels along the line
      float falloff = exp(-dist * 10.0);
      
      // Combine all rays. Primary rays are brighter and longer than diagonal rays
      float flares = (
        ray1 * (0.2 + pulse1 * 3.0) + 
        ray2 * (0.2 + pulse2 * 3.0) + 
        ray3 * (0.0 + pulse3 * 1.0) + 
        ray4 * (0.0 + pulse4 * 1.0)
      ) * falloff * 2.5;
      
      // Blend the core and the flares safely into an alpha channel
      float finalAlpha = core + flares;
      finalAlpha *= smoothstep(0.5, 0.4, dist); // Smooth edges
      
      gl_FragColor = vec4(vColor, clamp(finalAlpha, 0.0, 1.0));
    }
  \`;`;

txt = txt.replace(oldStr, newStr);
fs.writeFileSync(path, txt, 'utf8');

