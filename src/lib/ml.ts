import MLR from 'ml-regression-multivariate-linear';

export interface DataRow {
  [key: string]: number;
}

export function splitData(x: number[][], y: number[][], testRatio = 0.2) {
  const size = x.length;
  const indices = Array.from({ length: size }, (_, i) => i);
  
  // Deterministic shuffle with seed for reproducibility in UI
  let m = indices.length, t, i;
  let seed = 42;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  while (m) {
    i = Math.floor(random() * m--);
    t = indices[m];
    indices[m] = indices[i];
    indices[i] = t;
  }

  const splitIdx = Math.floor(size * (1 - testRatio));
  const trainIndices = indices.slice(0, splitIdx);
  const testIndices = indices.slice(splitIdx);
  
  return {
    xTrain: trainIndices.map(i => x[i]),
    yTrain: trainIndices.map(i => y[i]),
    xTest: testIndices.map(i => x[i]),
    yTest: testIndices.map(i => y[i]),
    testIndices
  };
}

export function normalize(data: number[][], precalcedMeans?: number[], precalcedStds?: number[]) {
  if (data.length === 0) return { normalizedData: [], means: [], stds: [] };
  const numFeatures = data[0].length;
  
  let means = precalcedMeans;
  let stds = precalcedStds;

  if (!means || !stds) {
    means = new Array(numFeatures).fill(0);
    stds = new Array(numFeatures).fill(0);
    
    for (const row of data) {
      for (let i = 0; i < numFeatures; i++) {
          means[i] += row[i];
      }
    }
    for (let i = 0; i < numFeatures; i++) {
        means[i] /= data.length;
    }
    for (const row of data) {
      for (let i = 0; i < numFeatures; i++) {
          stds[i] += Math.pow(row[i] - means[i], 2);
      }
    }
    for (let i = 0; i < numFeatures; i++) {
        stds[i] = Math.sqrt(stds[i] / data.length) || 1;
    }
  }
  
  const normalizedData = data.map(row => 
    row.map((val, i) => (val - means![i]) / Math.max(stds![i], 1e-8))
  );
  
  return { normalizedData, means, stds };
}

export function trainLinearRegression(xTrain: number[][], yTrain: number[][]) {
  return new MLR(xTrain, yTrain);
}

export function calculateMSE(yActual: number[][], yPredicted: number[][]) {
  if (yActual.length === 0) return 0;
  let sum = 0;
  for (let i=0; i<yActual.length; i++) {
      sum += Math.pow(yActual[i][0] - yPredicted[i][0], 2);
  }
  return sum / yActual.length;
}

export function calculateMAE(yActual: number[][], yPredicted: number[][]) {
  if (yActual.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < yActual.length; i++) {
    sum += Math.abs(yActual[i][0] - yPredicted[i][0]);
  }
  return sum / yActual.length;
}

export function calculateRSquared(yActual: number[][], yPredicted: number[][]) {
  if (yActual.length === 0) return 0;
  let sumRes = 0;
  let sumTot = 0;
  let meanY = 0;
  for (let i = 0; i < yActual.length; i++) {
    meanY += yActual[i][0];
  }
  meanY /= yActual.length;

  for (let i = 0; i < yActual.length; i++) {
    sumRes += Math.pow(yActual[i][0] - yPredicted[i][0], 2);
    sumTot += Math.pow(yActual[i][0] - meanY, 2);
  }
  return sumTot === 0 ? 0 : 1 - (sumRes / sumTot);
}

export function calculateCorrelation(x: number[], y: number[]) {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}
