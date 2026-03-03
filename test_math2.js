function test() {
  for (let t=6.10; t<6.5; t+=0.1) {
    let allDone = true;
    for (let i=0; i<4; i++) {
      const ringLifeT = t - (i * 0.15);
      if (ringLifeT < 0 || ringLifeT >= 6) {
          
      } else {
          allDone = false;
          const progress = Math.min(1, ringLifeT / 6);
          const fadeProgress = Math.max(0, (progress - 0.2) / 0.8);
          console.log(`t: ${t.toFixed(2)}, ring: ${i}, ringLifeT: ${ringLifeT.toFixed(2)}, opacity: ${Math.max(0, Math.pow(1 - fadeProgress, 3)).toFixed(4)}`)
      }
    }
  }
}
test();
