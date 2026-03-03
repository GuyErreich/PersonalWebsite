const makePointsContext = () => {};
function test() {
  let allDone;
  let isDone = false;
  for (let t=5.0; t<6.6; t+=0.01) {
    allDone = true;
    for (let i=0; i<4; i++) {
      const ringLifeT = t - (i * 0.15);
      if (ringLifeT < 0) continue;
      if (ringLifeT >= 6) continue;
      allDone = false;
    }
    let sysProgress = Math.min(1, t / 6);
    let globalFadeProgress = Math.max(0, (sysProgress - 0.2) / 0.8);
    let webOpacity = Math.pow(1 - globalFadeProgress, 3);
    
    if (allDone && !isDone) {
      console.log("Unmounted at t=" + t + " with webOpacity=" + webOpacity);
      isDone = true;
    }
  }
}
test();
