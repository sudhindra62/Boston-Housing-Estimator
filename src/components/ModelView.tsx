import React, { useState, useEffect, useMemo } from 'react';
import { Play, CheckCircle, Database, Settings2, BarChart as BarChartIcon, ScatterChart as ScatterIcon, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ScatterChart, Scatter, ZAxis } from 'recharts';
import { DataRow } from '../lib/ml';
import { EXCLUDE_COLS } from '../lib/data';

interface ModelViewProps {
  data: DataRow[];
  pipelineState: any;
  isTraining: boolean;
  trainModel: (d: DataRow[], selectedFeatures?: string[], testRatio?: number) => void;
}

export function ModelView({ data, pipelineState, isTraining, trainModel }: ModelViewProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [testRatio, setTestRatio] = useState<number>(0.2);

  useEffect(() => {
    // Initialize with all valid features if none are selected and the model hasn't been trained
    if (data.length > 0 && selectedFeatures.length === 0 && !pipelineState) {
      const allFeatures = Object.keys(data[0]).filter(k => !EXCLUDE_COLS.includes(k));
      setSelectedFeatures(allFeatures);
    }
  }, [data, pipelineState, selectedFeatures.length]);

  if (data.length === 0) return <div>Loading data...</div>;

  const allAvailableFeatures = Object.keys(data[0]).filter(k => !EXCLUDE_COLS.includes(k));

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => 
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const handleTrain = () => {
    trainModel(data, selectedFeatures, testRatio);
  };

  const residualBins = useMemo(() => {
    if (!pipelineState) return [];
    const res = pipelineState.diagnostics.map((d: any) => d.residual);
    if (res.length === 0) return [];
    const min = Math.min(...res);
    const max = Math.max(...res);
    const binCount = 20;
    const binSize = (max - min) / binCount;
    const bins = Array.from({length: binCount}, (_, i) => ({
      binStart: min + i * binSize,
      binEnd: min + (i + 1) * binSize,
      count: 0
    }));
    res.forEach((r: number) => {
      const idx = Math.min(Math.floor((r - min) / binSize), binCount - 1);
      if(bins[idx]) bins[idx].count++;
    });
    return bins.map(b => ({
      name: `${b.binStart.toFixed(1)} to ${b.binEnd.toFixed(1)}`,
      range: `${b.binStart.toFixed(1)} ↔ ${b.binEnd.toFixed(1)}`,
      count: b.count
    }));
  }, [pipelineState]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Linear Regression Setup</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-2xl">
          Select individual features to include in your training run. Try removing features to see how it affects the model's accuracy. The data is auto-shuffled, split into train-test sets, and normalized.
        </p>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Train/Test Split Ratio</span>
              </div>
              <p className="text-xs text-gray-500">Percentage of data to hold out for testing.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0.05" 
                max="0.5" 
                step="0.05" 
                value={testRatio}
                onChange={(e) => setTestRatio(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="font-mono text-sm font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded w-16 text-center">
                {Math.round(testRatio * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Dynamic Feature Selection</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allAvailableFeatures.map(f => (
              <label 
                key={f} 
                className={`flex items-center gap-2 cursor-pointer border p-2.5 rounded-lg transition-colors ${
                  selectedFeatures.includes(f) ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input 
                  type="checkbox" 
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  checked={selectedFeatures.includes(f)}
                  onChange={() => toggleFeature(f)}
                />
                <span className="text-xs font-mono font-medium text-gray-700 uppercase">{f}</span>
              </label>
            ))}
          </div>
          {selectedFeatures.length === 0 && (
            <p className="text-xs text-red-500 mt-3 font-medium flex items-center gap-1">
              Select at least one feature to train the model.
            </p>
          )}
        </div>

        <button
          onClick={handleTrain}
          disabled={isTraining || selectedFeatures.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          {isTraining ? (
             <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isTraining ? 'Training Model...' : pipelineState ? 'Retrain Model with Selection' : 'Start Training'}
        </button>
      </div>

      {pipelineState && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium text-sm">Model Trained</span>
                </div>
                <button
                  onClick={() => {
                    if (!pipelineState) return;
                    const exportData = {
                      features: pipelineState.features,
                      means: pipelineState.means,
                      stds: pipelineState.stds,
                      weights: pipelineState.weights,
                      metrics: {
                        mse: pipelineState.mse,
                        mae: pipelineState.mae,
                        rSquared: pipelineState.rSquared
                      }
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'boston-housing-model.json';
                    link.click();
                  }}
                  className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors"
                >
                  Export JSON
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-2 mt-auto">
                <div className="flex justify-between border-b border-gray-50 pb-1"><span>Train Set:</span> <span className="font-mono font-medium text-gray-900">{pipelineState.trainSize}</span></div>
                <div className="flex justify-between border-b border-gray-50 pb-1"><span>Test Set:</span> <span className="font-mono font-medium text-gray-900">{pipelineState.testSize}</span></div>
                <div className="flex justify-between border-b border-gray-50 pb-1"><span>Features Used:</span> <span className="font-mono font-medium text-gray-900">{pipelineState.features.length}</span></div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Database className="w-5 h-5" />
                <span className="font-medium text-sm">Evaluation Metrics (Test Set)</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-auto">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">MSE</p>
                  <span className="text-2xl font-bold text-gray-900">{pipelineState.mse.toFixed(2)}</span>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">Mean Squared Error (Lower is better)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">MAE</p>
                  <span className="text-2xl font-bold text-gray-900">{pipelineState.mae.toFixed(2)}</span>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">Mean Absolute Error (Avg $ err in thousands)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">R² Score</p>
                  <span className="text-2xl font-bold text-gray-900">{pipelineState.rSquared.toFixed(3)}</span>
                  <p className="text-[10px] text-gray-400 mt-1 leading-tight">Explained Variance (Closer to 1 is better)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-indigo-600 mb-4">
              <BarChartIcon className="w-5 h-5" />
              <h4 className="font-medium text-sm">Feature Importance (Correlation to Price)</h4>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Shows how strongly each selected feature correlates with the target house price. Positive values increase price, negative values decrease price.
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineState.correlations} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="feature" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} domain={[-1, 1]} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [val.toFixed(3), 'Correlation']}
                  />
                  <Bar dataKey="correlation" radius={[4, 4, 0, 0]}>
                    {pipelineState.correlations.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.correlation > 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-purple-600 mb-4">
              <ScatterIcon className="w-5 h-5" />
              <h4 className="font-medium text-sm">Actual vs. Predicted (Test Set)</h4>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              A model perfectly predicting the outcomes would form a straight diagonal line. Points further from the diagonal represent larger errors.
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual Value" 
                    domain={[0, 50]} 
                    tick={{ fontSize: 11 }} 
                    label={{ value: 'Actual Price ($1000s)', position: 'insideBottom', offset: -10, fontSize: 12, fill: '#6b7280' }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted" 
                    domain={[0, 50]} 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Predicted ($1000s)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: '#6b7280' }}
                  />
                  <ZAxis type="number" range={[20, 20]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => val.toFixed(1)}
                  />
                  <Scatter name="Test Data" data={pipelineState.diagnostics} fill="#8b5cf6" opacity={0.6} />
                  {/* Ideal fit line */}
                  <Scatter 
                    data={[{actual: 0, predicted: 0}, {actual: 50, predicted: 50}]} 
                    fill="#9ca3af" 
                    line={{ stroke: '#9ca3af', strokeDasharray: '5 5', strokeWidth: 2 }}
                    shape={() => null}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-rose-600 mb-4">
              <Activity className="w-5 h-5" />
              <h4 className="font-medium text-sm">Residuals Distribution</h4>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              A robust model should have normally distributed residuals centered around zero. Skewed distributions indicate systematic bias in predictions.
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={residualBins} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} interval="preserveStartEnd" angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#fb7185" radius={[4, 4, 0, 0]} name="Samples" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
