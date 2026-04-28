
function getPeakPower(wattsData, timeData, windowSecs) {
    if (!wattsData || !timeData || wattsData.length === 0) return 0;
    
    let maxAvg = 0;
    let startIdx = 0;
    let currentEnergy = 0;

    for (let endIdx = 1; endIdx < timeData.length; endIdx++) {
        const dt = timeData[endIdx] - timeData[endIdx - 1];
        // Treat gaps larger than 5s as pauses (0 vatios en el hueco)
        const energyContribution = dt > 5 ? 0 : wattsData[endIdx] * dt;
        currentEnergy += energyContribution;

        while (timeData[endIdx] - timeData[startIdx] > windowSecs) {
            const dtStart = timeData[startIdx + 1] - timeData[startIdx];
            const energyToRemove = dtStart > 5 ? 0 : wattsData[startIdx + 1] * dtStart;
            currentEnergy -= energyToRemove;
            startIdx++;
        }

        const windowDuration = timeData[endIdx] - timeData[startIdx];
        if (windowDuration >= windowSecs * 0.98) {
            const avg = currentEnergy / windowSecs; 
            if (avg > maxAvg) maxAvg = avg;
        }
    }
    return maxAvg;
}

// TEST 1: Constant 200W, no gaps, 10s window
const w1 = [200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200];
const t1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("Test 1 (Perfect):", getPeakPower(w1, t1, 10)); // Should be 200

// TEST 2: Gap of 5s in a 10s window. 5 samples of 200W, 5s gap.
// 0, 1, 2, 7, 8, 9, 10
const w2 = [200, 200, 200, 200, 200, 200, 200];
const t2 = [0, 1, 2, 7, 8, 9, 10]; 
// dt: 1, 1, 5(gap), 1, 1, 1
// Energy: 200*1 + 200*1 + 0*5 + 200*1 + 200*1 + 200*1 = 1000
// Window: 10s. Avg: 1000 / 10 = 100
console.log("Test 2 (Gap 5s):", getPeakPower(w2, t2, 10)); // Should be 100

// TEST 3: Original issue - Sample count average
// If we used count average: (200 * 6) / 6 = 200W.
// My new logic should show 100W.
