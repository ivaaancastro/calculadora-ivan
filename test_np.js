function calculateNP(watts, time) {
    if (!watts || !time || watts.length < 2) return 0;
    
    // Create 1Hz array
    const duration = time[time.length - 1] - time[0];
    if (duration <= 0) return 0;
    
    const secWatts = new Float32Array(duration + 1);
    let streamIdx = 0;
    for (let t = 0; t <= duration; t++) {
        const currentTime = time[0] + t;
        while (streamIdx < time.length - 1 && time[streamIdx + 1] <= currentTime) {
            streamIdx++;
        }
        secWatts[t] = watts[streamIdx];
    }
    
    // 30s rolling average
    const rollingAvg = new Float32Array(duration + 1);
    let sum = 0;
    let count = 0;
    for (let t = 0; t <= duration; t++) {
        sum += secWatts[t];
        count++;
        if (count > 30) {
            sum -= secWatts[t - 30];
            count = 30;
        }
        rollingAvg[t] = sum / count;
    }
    
    // NP
    let sumNp = 0;
    for (let t = 0; t <= duration; t++) {
        sumNp += Math.pow(rollingAvg[t], 4);
    }
    const avgNp = sumNp / (duration + 1);
    return Math.pow(avgNp, 0.25);
}

const time = [0, 10, 20, 30, 40, 50, 60, 70];
const watts = [150, 200, 250, 150, 200, 300, 100, 150];
console.log(calculateNP(watts, time));
