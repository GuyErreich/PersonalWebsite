import re

with open('/home/opsxe/Development/PersonalWebsite/src/components/backgrounds/three/hero/ConstellationWeb.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''export const ConstellationWeb = ({ orbitsInfo }: { orbitsInfo: { ref: React.RefObject<THREE.Group | null>, shapes: any[], opacity?: number }[] }) => {''',
    '''export const ConstellationWeb = ({ 
  orbitsInfo,
  maxConnections = 600,
  customThreshold = undefined
}: { 
  orbitsInfo: { ref: React.RefObject<THREE.Group | null>, shapes: any[], opacity?: number, color?: string }[],
  maxConnections?: number,
  customThreshold?: number
}) => {'''
)

content = content.replace(
    '''  const MAX_CONNECTIONS = 600; 
  const positions = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), []);''',
    '''  const MAX_CONNECTIONS = maxConnections; 
  const positions = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), [MAX_CONNECTIONS]);
  const colors = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), [MAX_CONNECTIONS]);'''
)

content = content.replace(
    '''    const baseThreshold = 6.0;
    // Increased the breathing reach to make it sweep through the whole system
    const pulsingThreshold = baseThreshold + Math.sin(t * 0.5) * 1.5; ''',
    '''    const baseThreshold = customThreshold ?? 6.0;
    // Increased the breathing reach to make it sweep through the whole system (unless custom threshold is used which is static)
    const pulsingThreshold = customThreshold ?? (baseThreshold + Math.sin(t * 0.5) * 1.5); '''
)

content = content.replace(
    '''       // Map orbit index colors identically across the tracks
       let trackColor = new THREE.Color("#ffffff");
       if (index === 0) trackColor = new THREE.Color("#3b82f6"); // Cube Track Blue
       else if (index === 1) trackColor = new THREE.Color("#10b981"); // Shard Track Emerald
       else if (index === 2) trackColor = new THREE.Color("#8b5cf6"); // Sphere Track Purple''',
    '''       // Map orbit index colors identically across the tracks
       let trackColor = new THREE.Color("#ffffff");
       if (orbit.color) trackColor = new THREE.Color(orbit.color); // Use custom color if provided
       else if (index === 0) trackColor = new THREE.Color("#3b82f6"); // Cube Track Blue
       else if (index === 1) trackColor = new THREE.Color("#10b981"); // Shard Track Emerald
       else if (index === 2) trackColor = new THREE.Color("#8b5cf6"); // Sphere Track Purple'''
)


with open('/home/opsxe/Development/PersonalWebsite/src/components/backgrounds/three/hero/ConstellationWeb.tsx', 'w') as f:
    f.write(content)
