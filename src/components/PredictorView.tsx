import React, { useState, useEffect, useMemo } from 'react';
import { DataRow } from '../lib/ml';
import { BookmarkPlus, Trash2, Code } from 'lucide-react';

interface PredictorViewProps {
  pipelineState: any;
  predict: (inputs: Record<string, number>) => number | null;
  data: DataRow[];
}

interface Scenario {
  id: string;
  inputs: Record<string, number>;
  prediction: number;
  timestamp: Date;
}

export function PredictorView({ pipelineState, predict, data }: PredictorViewProps) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [prediction, setPrediction] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showCode, setShowCode] = useState(false);

  // Dynamically calculate feature ranges based on the specific features the model was trained on
  const dynamicFeatures = useMemo(() => {
    if (!pipelineState || !data || data.length === 0) return [];
    
    return pipelineState.features.map((f: string) => {
      const values = data.map(d => d[f] as number).filter(v => !isNaN(v));
      const min = Math.min(...values);
      const max = Math.max(...values);
      // Determine a reasonable step size
      const step = (max - min) / 100 || 0.1;
      
      return {
        key: f,
        name: f.toUpperCase(),
        min,
        max,
        step
      };
    });
  }, [pipelineState, data]);

  // If pipelineState features change, reset inputs to match new features using medians
  useEffect(() => {
    if (pipelineState && dynamicFeatures.length > 0) {
       const initial: Record<string, number> = {};
       
       // Calculate basic medians to initialize the sliders
       const sortedData = [...data].sort((a,b) => a.medv - b.medv); 
       const mid = Math.floor(sortedData.length / 2);
       const medianRow = sortedData[mid];

       pipelineState.features.forEach((f: string) => {
         initial[f] = medianRow[f];
       });

       setInputs(initial);
       setPrediction(predict(initial));
    }
  }, [pipelineState, data, dynamicFeatures, predict]);

  const handleSliderChange = (key: string, value: number) => {
    const newInputs = { ...inputs, [key]: value };
    setInputs(newInputs);
    setPrediction(predict(newInputs));
  };

  const saveScenario = () => {
    if (prediction === null) return;
    setScenarios(prev => [
        { id: Math.random().toString(36).substring(2, 9), inputs: { ...inputs }, prediction, timestamp: new Date() },
        ...prev
    ]);
  }

  const removeScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }

  const exportScenariosCSV = () => {
    if (scenarios.length === 0) return;
    const header = ['Timestamp', 'Prediction', ...dynamicFeatures.map((f: any) => f.name)];
    const rows = scenarios.map(s => [
      s.timestamp.toISOString(),
      (s.prediction * 1000).toFixed(2),
      ...dynamicFeatures.map((f: any) => s.inputs[f.key])
    ]);
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'scenarios_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const generatePythonSnippet = () => {
    if (!pipelineState) return '';
    const weights = pipelineState.weights.map((w: number[]) => w[0]);
    const intercept = weights[weights.length - 1];
    const coefficients = weights.slice(0, weights.length - 1);
    
    return `import numpy as np

# Linear Regression Model exported from Boston Housing Estimator
FEATURES = ${JSON.stringify(pipelineState.features)}
MEANS = np.array([${pipelineState.means.map((n: number)=>n.toFixed(4)).join(', ')}])
STDS = np.array([${pipelineState.stds.map((n: number)=>n.toFixed(4)).join(', ')}])

INTERCEPT = ${intercept.toFixed(5)}
COEFFICIENTS = np.array([${coefficients.map((n: number)=>n.toFixed(5)).join(', ')}])

def predict_house_price(input_dict):
    """
    Predicts the median house value (in $1000s) based on input features.
    Required keys: ${pipelineState.features.join(', ')}
    """
    raw_x = np.array([input_dict.get(f, 0) for f in FEATURES])
    
    # Standardize inputs
    norm_x = (raw_x - MEANS) / np.maximum(STDS, 1e-8)
    
    # Calculate linear sum
    prediction = np.dot(norm_x, COEFFICIENTS) + INTERCEPT
    return prediction

# Example usage bounds based on your current UI sliders:
sample_house = ${JSON.stringify(inputs, null, 4).replace(/\"([^(\")"]+)\":/g, "$1:")}

print(f"Predicted Price: ${"$"}{predict_house_price(sample_house) * 1000:,.0f}")
`;
  };

  if (!pipelineState) {
    return (
      <div className="text-center py-20 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-400 mb-6 border border-gray-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">Awaiting Model Initialization</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          The interactive predictor requires a compiled algorithmic state. Please complete the setup in the Train Model tab to initialize the dynamic feature inputs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-8 lg:gap-12">
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Dynamic Inference Bounds</h3>
              <p className="text-sm text-gray-500">Inject custom values to observe linear model sensitivities.</p>
            </div>
            <button 
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Code className="w-4 h-4" />
              {showCode ? 'Hide Code' : 'Export Python'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {dynamicFeatures.map(feat => (
              <div key={feat.key} className="space-y-4 relative">
                <div className="flex justify-between items-end">
                  <label className="block text-xs font-bold tracking-widest text-gray-800 uppercase">{feat.name}</label>
                  <div className="text-sm font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-bold border border-blue-100/50">
                    {(inputs[feat.key] ?? feat.min).toFixed(2)}
                  </div>
                </div>
                <input 
                  type="range"
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none hover:bg-gray-200 transition-colors"
                  min={feat.min}
                  max={feat.max}
                  step={feat.step}
                  value={inputs[feat.key] ?? feat.min}
                  onChange={(e) => handleSliderChange(feat.key, parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-mono absolute -bottom-5 w-full">
                  <span>{feat.min.toFixed(1)}</span>
                  <span>{feat.max.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full xl:w-[380px] flex flex-col p-8 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-xl h-fit sticky top-6 text-white border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Target Vector (MEDV)</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </div>
          
          {prediction !== null && !isNaN(prediction) ? (
            <div className="w-full">
              <div className="text-5xl font-bold tracking-tight mb-2">
                ${(prediction * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
                <span className="bg-slate-700/50 text-slate-300 font-mono text-xs px-2 py-1 rounded">± ${(pipelineState.mae*1000).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                <span className="text-xs text-slate-400">Model Expected Margin of Error (MAE)</span>
              </div>
            </div>
          ) : (
            <span className="text-slate-500 text-3xl font-light">-</span>
          )}
          
          <button 
            onClick={saveScenario}
            className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
             <BookmarkPlus className="w-4 h-4" />
             Capture Analytical Scenario
          </button>
        </div>
      </div>

      {showCode && (
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm animate-in fade-in expand-in">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono">
              <Code className="w-4 h-4" /> model_export.py
            </div>
            <button onClick={() => setShowCode(false)} className="text-slate-400 hover:text-white text-xs font-medium uppercase tracking-wider">Close</button>
          </div>
          <pre className="p-6 text-sm font-mono text-indigo-300 overflow-x-auto">
            <code>{generatePythonSnippet()}</code>
          </pre>
        </div>
      )}

      {scenarios.length > 0 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold tracking-tight text-gray-900">Scenario Captures</h4>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={exportScenariosCSV}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    Export CSV
                  </button>
                  <div className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold">{scenarios.length} Logged</div>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                          <tr>
                              <th className="px-5 py-3.5 whitespace-nowrap w-32 tracking-wider font-semibold uppercase text-xs">Timestamp</th>
                              <th className="px-5 py-3.5 whitespace-nowrap tracking-wider font-semibold uppercase text-xs">Projection</th>
                              <th className="px-5 py-3.5 w-full tracking-wider font-semibold uppercase text-xs">Feature Vector Snapshot</th>
                              <th className="px-5 py-3.5 text-right"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {scenarios.map((scenario) => (
                              <tr key={scenario.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-5 py-4 text-xs text-gray-500 font-mono">
                                      {scenario.timestamp.toLocaleTimeString()}
                                  </td>
                                  <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap text-base">
                                      ${(scenario.prediction * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </td>
                                  <td className="px-5 py-4">
                                      <div className="flex flex-wrap gap-2 min-w-[200px]">
                                          {Object.entries(scenario.inputs).map(([k, v]) => (
                                              <span key={k} className="text-[10px] uppercase font-mono bg-indigo-50 border border-indigo-100 text-indigo-800 px-2 py-1 rounded shadow-sm">
                                                  {k}: {Number(v).toFixed(1)}
                                              </span>
                                          ))}
                                      </div>
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                      <button 
                                          onClick={() => removeScenario(scenario.id)}
                                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                                          title="Delete scenario snapshot"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
}
