# Sound Feedback Implementation

## Interactive button example

```tsx
import { motion } from "framer-motion";
import { playHoverSound, playClickSound } from "../lib/sound/interactionSounds";

export const InteractiveButton = () => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={playHoverSound}
      onClick={playClickSound}
      className="p-2 bg-blue-500 rounded text-white"
    >
      Click Me
    </motion.button>
  );
};
```

## Required wiring per element

| Element | Required |
|---|---|
| Button / link / menu item | `whileHover` + `whileTap` via `motion.*` |
| Button / link / menu item | `onMouseEnter={playHoverSound}` |
| Button / link / menu item | `onClick={playClickSound}` (plus the primary handler) |
| Icon-only button | `aria-label` |
| Menu / modal | `playMenuOpenSound` on open |

## Dismiss-path checklist (menus/modals)

Every dismiss path must fire `playMenuCloseSound`:

- [ ] Close button
- [ ] Backdrop / overlay click
- [ ] Navigation link clicks that close the menu
- [ ] Any programmatic close triggered by user action
