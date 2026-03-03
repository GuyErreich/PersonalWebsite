import re

with open('/home/opsxe/Development/PersonalWebsite/src/components/backgrounds/three/hero/ConstellationWeb.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''export const ConstellationWeb = ({ orbitsInfo }: { orbitsInfo: { ref: React.RefObject<THREE.Group | null>, shapes: any[] }[] }) => {''',
    '''export const ConstellationWeb = ({ orbitsInfo }: { orbitsInfo: { ref: React.RefObject<THREE.Group | null>, shapes: any[], opacity?: number }[] }) => {'''
)

content = content.replace(
    '''    const allPoints: { pos: THREE.Vector3, color: THREE.Color }[] = [];''',
    '''    const allPoints: { pos: THREE.Vector3, color: THREE.Color, opacity: number }[] = [];'''
)

content = content.replace(
    '''    orbitsInfo.forEach((orbit, index) => {
       const group = orbit.ref.current!;''',
    '''    orbitsInfo.forEach((orbit, index) => {
       const group = orbit.ref.current!;
       if (grouped = {group: [] for group in patterns.keys()} || !group.visible) return;'''
)

content = content.replace(
    '''       orbit.shapes.forEach((pos) => {
         const v = new THREE.Vector3(pos.x, 0, pos.z);
         v.applyEuler(group.rotation);
         v.multiplyScalar(group.scale.x); 
         allPoints.push({ pos: v, color: trackColor });
       });''',
    '''       orbit.shapes.forEach((pos: any) => {
         const v = new THREE.Vector3(pos.x, 0, pos.z);
         v.applyEuler(group.rotation);
         v.multiplyScalar(group.scale.x); 
         allPoints.push({ pos: v, color: trackColor, opacity: orbit.opacity !== undefined ? orbit.opacity : 1 });
       });'''
)

content = content.replace(
    '''                // Color lines by dynamically blending the color of shape A and shape B based on distance
                const brightness = alpha * 0.8; // Boost the brightness so colors show

                // Blend the color of node i with node j
                const mixedColor = allPoints[i].color.clone().lerp(allPoints[j].color, 0.5);
                
                const r = mixedColor.r * brightness; 
                const g = mixedColor.g * brightness;
                const b = mixedColor.b * brightness;''',
    '''                // Color lines by dynamically blending the color of shape A and shape B based on distance
                const mixedOpacity = Math.min(allPoints[i].opacity, allPoints[j].opacity);
                const brightness = alpha * 0.8 * mixedOpacity; // Boost the brightness so colors show, taking opacity into account

                // Blend the color of node i with node j
                const mixedColor = allPoints[i].color.clone().lerp(allPoints[j].color, 0.5);
                
                const r = mixedColor.r * brightness; 
                const g = mixedColor.g * brightness;
                const b = mixedColor.b * brightness;'''
)

with open('/home/opsxe/Development/PersonalWebsite/src/components/backgrounds/three/hero/ConstellationWeb.tsx', 'w') as f:
    f.write(content)
