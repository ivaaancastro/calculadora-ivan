function calculateNP(watts, time) {
    if (!watts || !time || watts.length < 2) return 0;
    
    const activeWatts = [];
    let lastTime = time[0];
    
    for (let i = 0; i < time.length; i++) {
        const t = time[i];
        const w = watts[i];
        
        let gap = t - lastTime;
        if (gap > 10) gap = 1; // It's a physical pause, ignore the elapsed time gap
        
        const count = i === 0 ? 1 : Math.max(1, gap);
        for (let j = 0; j < count; j++) {
            activeWatts.push(w);
        }
        lastTime = t;
    }
    
    let sumNp = 0;
    let validCount = 0;
    let sum = 0;
    
    for (let i = 0; i < activeWatts.length; i++) {
        sum += activeWatts[i];
        if (i >= 29) {
            if (i > 29) {
                sum -= activeWatts[i - 30];
            }
            const rollingAvg = sum / 30;
            sumNp += Math.pow(rollingAvg, 4);
            validCount++;
        }
    }
    
    if (validCount === 0) return 0;
    return Math.pow(sumNp / validCount, 0.25);
}

const time = [0, 1, 2, 3, 300, 301, 302, 303 ]; // 300 is a pause
// 100 watts for 3 sec, pause, then 100 watts for 3 sec.
// total active time is 8 seconds.
// Let's test with 30 seconds
const time2 = [];
const watts2 = [];
for (let i=0; i<30; i++) { time2.push(i); watts2.push(200); }
// Add a pause
for (let i=30; i<60; i++) { time2.push(i+300); watts2.push(200); }

console.log("NP:", calculateNP(watts2, time2)); // Should be 200

