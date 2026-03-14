const fs = require('fs');
let content = fs.readFileSync('src/components/Hero.tsx', 'utf8');

// 1. Add import
if (!content.includes('RocketReplayButton')) {
    content = content.replace(
      "import { HyperspaceLever } from \"./HyperspaceLever\";",
      "import { HyperspaceLever } from \"./HyperspaceLever\";\nimport { RocketReplayButton } from \"./RocketReplayButton\";"
    );
}

// 2. Remove states. In the last state it didn't inject isMobileHovering so I just replace isMobileLaunching.
const searchStr = "const [hasCookie] = useState(() => !!Cookies.get('hero_visited'));";
content = content.replace(
  "const [hasCookie] = useState(() => !!Cookies.get('hero_visited'));\n  const [isMobileLaunching, setIsMobileLaunching] = useState(false);",
  "const [hasCookie] = useState(() => !!Cookies.get('hero_visited'));"
);
content = content.replace(
  "const [isMobileLaunching, setIsMobileLaunching] = useState(false);\n  const [isMobileHovering, setIsMobileHovering] = useState(false);\n  const hoverAudioRef = useRef<any>(null);",
  ""
);

// 3. Replace button block.
const startStr = '<motion.button\n                id="replay-button-phone"';
const endStr = '</motion.button>';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex === -1) {
    console.log("Could not find button");
    process.exit(1);
}

const replacement = `<RocketReplayButton onReplay={handleReplay} />`;
content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync('src/components/Hero.tsx', content);
console.log("Success");
