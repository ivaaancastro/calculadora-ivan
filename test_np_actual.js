import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('activities')
    .select('id, name, duration, watts_avg, streams_data, type')
    .eq('type', 'Ciclismo')
    .not('streams_data', 'is', null)
    .order('date', { ascending: false })
    .limit(1);
    
  if (error || !data || data.length === 0) {
      console.log("No data", error);
      return;
  }
  
  const act = data[0];
  console.log(`Activity: ${act.name}, duration: ${act.duration}, watts_avg: ${act.watts_avg}`);
  
  const watts = act.streams_data?.watts?.data;
  const time = act.streams_data?.time?.data;
  
  if (!watts || !time) {
      console.log("No watts stream");
      return;
  }
  
  console.log(`Time points: ${time.length}`);
  
  function calcNPMine(wArr, tArr) {
      const activeWatts = [];
      let lastTime = tArr[0];
      for (let i = 0; i < tArr.length; i++) {
          const t = tArr[i];
          const w = wArr[i] || 0;
          let gap = t - lastTime;
          if (gap > 10) gap = 1;
          const count = i === 0 ? 1 : Math.max(1, gap);
          for (let j = 0; j < count; j++) {
              activeWatts.push(w);
          }
          lastTime = t;
      }
      let sumNp = 0, validCount = 0, sum = 0;
      for (let i = 0; i < activeWatts.length; i++) {
          sum += activeWatts[i];
          if (i >= 29) {
              if (i > 29) sum -= activeWatts[i - 30];
              sumNp += Math.pow(sum / 30, 4);
              validCount++;
          }
      }
      return validCount === 0 ? 0 : Math.pow(sumNp / validCount, 0.25);
  }
  
  function calcNPStandard(wArr, tArr) {
      // Just step through the array and use time gaps
      const activeWatts = [];
      for(let i=1; i<tArr.length; i++){
          let gap = tArr[i] - tArr[i-1];
          let w = wArr[i];
          if(gap > 10) gap = 0; // ignore completely
          for(let j=0; j<gap; j++) activeWatts.push(wArr[i-1]); // use previous watt!
      }
      let sumNp = 0, validCount = 0, sum = 0;
      for (let i = 0; i < activeWatts.length; i++) {
          sum += activeWatts[i];
          if (i >= 29) {
              if (i > 29) sum -= activeWatts[i - 30];
              sumNp += Math.pow(sum / 30, 4);
              validCount++;
          }
      }
      return validCount === 0 ? 0 : Math.pow(sumNp / validCount, 0.25);
  }

  function calcNPGoldenCheetah(wArr, tArr){
      // GC explicitly interpolates small gaps and ignores large ones
      // We will skip interpolation and just use exactly the raw array if interval is 1s
      let rolling = [];
      let npSum = 0;
      let npCount = 0;
      // using exact array indices assuming 1s
      for(let i=0; i<wArr.length; i++) {
          let sum = 0;
          let c = 0;
          for(let j=Math.max(0, i-29); j<=i; j++) {
             sum += wArr[j];
             c++;
          }
          if (c === 30) {
              npSum += Math.pow(sum/30, 4);
              npCount++;
          }
      }
      return npCount>0 ? Math.pow(npSum/npCount, 0.25) : 0;
  }
  
  console.log("My NP:", calcNPMine(watts, time));
  console.log("Std NP:", calcNPStandard(watts, time));
  console.log("GC NP:", calcNPGoldenCheetah(watts, time));
  
  const NP = calcNPStandard(watts, time);
  const ftp = 200; 
  // TSS intervals way
  // Duration is activeWatts array length
  const durationActive = time[time.length-1]-time[0]; // ?
  console.log('TSS active length:', (calcNPStandard(watts, time) ** 2) * time.length / (ftp**2 * 36));
}

check();
