#!/bin/bash
urls=(
"https://raw.githubusercontent.com/devicons/devicon/master/icons/unity/unity-original.svg"
"https://raw.githubusercontent.com/devicons/devicon/master/icons/unrealengine/unrealengine-original.svg"
"https://raw.githubusercontent.com/devicons/devicon/master/icons/godot/godot-original.svg"
"https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/gamepad-2.svg"
"https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/ghost.svg"
)
for url in "${urls[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  echo "$code $url"
done
