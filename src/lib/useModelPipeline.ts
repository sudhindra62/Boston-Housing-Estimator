import { useState, useCallback } from 'react';
import { DataRow, splitData, normalize, trainLinearRegression, calculateMSE, calculateMAE, calculateRSquared, calculateCorrelation } from './ml';
import { TARGET_COL, EXCLUDE_COLS } from './data';

interface PipelineState {
  isTrained: boolean;
  mse: number;
  mae: number;
  rSquared: number;
  testSize: number;
  trainSize: number;
  testRatio: number;
  features: string[];
  correlations: { feature: string; correlation: number }[];
  diagnostics: { actual: number; predicted: number; residual: number }[];
  means: number[];
  stds: number[];
  weights: any;
  model: any;
}

export function useModelPipeline() {
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  const trainModel = useCallback(async (data: DataRow[], selectedFeatures?: string[], testRatio: number = 0.2) => {
    setIsTraining(true);
    
    // Slight timeout to let UI update
    await new Promise(r => setTimeout(r, 50));

    try {
      if (!data || data.length === 0) throw new Error("No data available");

      const allValidFeatures = Object.keys(data[0]).filter(k => !EXCLUDE_COLS.includes(k));
      const features = selectedFeatures && selectedFeatures.length > 0 ? selectedFeatures : allValidFeatures;
      
      const x = data.map(row => features.map(f => Number(row[f])));
      const y = data.map(row => [Number(row[TARGET_COL])]);

      const { xTrain, yTrain, xTest, yTest } = splitData(x, y, testRatio);

      // Normalize features to help linear regression stability
      const { normalizedData: xTrainNorm, means, stds } = normalize(xTrain);
      const { normalizedData: xTestNorm } = normalize(xTest, means, stds);

      // Train
      const model = trainLinearRegression(xTrainNorm, yTrain);

      // Evaluate
      const yPredTest = model.predict(xTestNorm);
      const mse = calculateMSE(yTest, yPredTest);
      const mae = calculateMAE(yTest, yPredTest);
      const rSquared = calculateRSquared(yTest, yPredTest);

      const diagnostics = yTest.map((yt, i) => ({
        actual: yt[0],
        predicted: yPredTest[i][0],
        residual: yt[0] - yPredTest[i][0]
      }));

      const correlations = features.map(f => {
        const fVals = data.map(r => Number(r[f]));
        const tVals = data.map(r => Number(r[TARGET_COL]));
        return {
          feature: f,
          correlation: calculateCorrelation(fVals, tVals)
        };
      }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)); // sort by strongest relation

      setPipelineState({
        isTrained: true,
        mse,
        mae,
        rSquared,
        testSize: xTest.length,
        trainSize: xTrain.length,
        testRatio,
        features,
        correlations,
        diagnostics,
        means,
        stds,
        weights: model.weights,
        model
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsTraining(false);
    }
  }, []);

  const predict = useCallback((inputFeatures: Record<string, number>) => {
    if (!pipelineState || !pipelineState.model) return null;
    
    // Create feature array in correct order
    const rawX = pipelineState.features.map(f => inputFeatures[f] || 0);
    
    // Normalize using training means/stds
    const normX = rawX.map((val, i) => (val - pipelineState.means[i]) / Math.max(pipelineState.stds[i], 1e-8));
    
    // MLR expects 2D array for prediction
    const res = pipelineState.model.predict([normX]);
    return res[0][0]; // single prediction
  }, [pipelineState]);

  return { pipelineState, isTraining, trainModel, predict };
}
