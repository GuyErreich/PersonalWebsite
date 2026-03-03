const canvas = document.createElement('canvas');
canvas.width = 64;
canvas.height = 64;
// wait, we can just use useMemo to generate the texture so we don't need external files.
