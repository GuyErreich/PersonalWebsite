const fs = require('fs');
const content = fs.readFileSync('src/components/Hero.tsx', 'utf8');

let newContent = content.replace(
  "const [playAnimation, setPlayAnimation] = useState(true);",
  "const [playAnimation, setPlayAnimation] = useState(() => !Cookies.get('hasSeenHeroAnimation'));"
);

newContent = newContent.replace(
  /useEffect\(\(\) => \{\n    const hasSeenAnimation = Cookies\.get\('hasSeenHeroAnimation'\);\n    if \(hasSeenAnimation\) \{\n      setPlayAnimation\(false\);\n    \} else \{\n      Cookies\.set\('hasSeenHeroAnimation', 'true', \{ expires: 7 \}\); \/\/ Expires in 7 days\n    \}\n  \}, \[\]\);/g,
  `useEffect(() => {
    if (!Cookies.get('hasSeenHeroAnimation')) {
      Cookies.set('hasSeenHeroAnimation', 'true', { expires: 7 }); // Expires in 7 days
    }
  }, []);`
);

newContent = newContent.replace(
  /\{\/\* Three\.js Background \*\/\}\n      <AnimatePresence mode="wait">\n        \{playAnimation && \(\n          <motion\.div\n            key=\{`three-bg-\$\{animationKey\}`\}\n            initial=\{\{ opacity: 0 \}\}\n            animate=\{\{ opacity: 1 \}\}\n            exit=\{\{ opacity: 0, transition: \{ duration: 0\.5 \} \}\}\n            className="absolute inset-0 z-0 h-full w-full pointer-events-none"\n          >\n            <Canvas camera=\{\{ position: \[0, 0, 5\], fov: 60 \}\}>\n              <ThreeHeroBackground playAnimation=\{playAnimation\} \/>\n            <\/Canvas>\n          <\/motion\.div>\n        \)\}\n      <\/AnimatePresence>/g,
  `{/* Three.js Background */}
      <motion.div
        key={\`three-bg-\$\{animationKey\}\`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        className="absolute inset-0 z-0 h-full w-full pointer-events-none"
      >
        <Canvas key={\`canvas-\$\{animationKey\}\`} camera={{ position: [0, 0, 5], fov: 60 }}>
          <ThreeHeroBackground playAnimation={playAnimation} />
        </Canvas>
      </motion.div>`
);

fs.writeFileSync('src/components/Hero.tsx', newContent);
