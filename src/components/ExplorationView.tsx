import React, { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DataRow, calculateCorrelation } from '../lib/ml';

interface ExplorationViewProps {
  data: DataRow[];
}

export function ExplorationView({ data }: ExplorationViewProps) {
  const [viewMode, setViewMode] = useState<'scatter' | 'distribution' | 'heatmap'>('scatter');
  const [xFeature, setXFeature] = useState<string>('rm');
  const [yFeature, setYFeature] = useState<string>('medv');
  const [distFeature, setDistFeature] = useState<string>('medv');

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({
      id: i,
      [xFeature]: d[xFeature],
      [yFeature]: d[yFeature],
    }));
  }, [data, xFeature, yFeature]);

  const distData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const values = data.map(d => Number(d[distFeature])).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bins = 20;
    const step = (max - min) / bins || 1;
    
    const histogram = Array.from({ length: bins }).map((_, i) => ({
      binStart: min + i * step,
      binEnd: min + (i + 1) * step,
      rangeLabel: `${(min + i * step).toFixed(1)} - ${(min + (i + 1) * step).toFixed(1)}`,
      count: 0
    }));

    values.forEach(v => {
      let binIndex = Math.floor((v - min) / step);
      if (binIndex >= bins) binIndex = bins - 1;
      if (binIndex >= 0) histogram[binIndex].count += 1;
    });

    return histogram;
  }, [data, distFeature]);

  const correlationMatrix = useMemo(() => {
    if (!data || data.length === 0 || columns.length === 0) return [];
    return columns.map(c1 => {
        const row: Record<string, number> = {};
        const col1Vals = data.map(d => Number(d[c1]));
        columns.forEach(c2 => {
            if (c1 === c2) {
                row[c2] = 1;
            } else {
                const col2Vals = data.map(d => Number(d[c2]));
                row[c2] = calculateCorrelation(col1Vals, col2Vals);
            }
        });
        return { feature: c1, ...row };
    });
  }, [data, columns]);

  if (!data || data.length === 0) return <div>Loading data...</div>;

  const getColorClass = (val: number) => {
    if (val > 0.8) return 'bg-blue-600 text-white';
    if (val > 0.6) return 'bg-blue-400 text-white';
    if (val > 0.4) return 'bg-blue-200 text-blue-900';
    if (val > 0.2) return 'bg-blue-100 text-blue-900';
    if (val > 0) return 'bg-gray-50 text-gray-500';
    if (val > -0.2) return 'bg-red-50 text-red-900';
    if (val > -0.4) return 'bg-red-100 text-red-900';
    if (val > -0.6) return 'bg-red-300 text-red-900';
    if (val > -0.8) return 'bg-red-500 text-white';
    return 'bg-red-700 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap border-b border-gray-200">
        <button
          onClick={() => setViewMode('scatter')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'scatter' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Scatter Plot (Relationships)
        </button>
        <button
          onClick={() => setViewMode('distribution')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'distribution' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Histogram (Distributions)
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'heatmap' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Correlation Heatmap
        </button>
      </div>

      {viewMode === 'scatter' ? (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">X-Axis Feature</label>
              <select 
                value={xFeature} 
                onChange={(e) => setXFeature(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                {columns.map(col => <option key={col} value={col}>{col === 'medv' ? 'MEDV (Target Price)' : col.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Y-Axis Feature</label>
              <select 
                value={yFeature} 
                onChange={(e) => setYFeature(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                {columns.map(col => <option key={col} value={col}>{col === 'medv' ? 'MEDV (Target Price)' : col.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 tracking-tight">
              {xFeature.toUpperCase()} vs {yFeature.toUpperCase()}
            </h3>
            <div className="h-96 w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis 
                    type="number" 
                    dataKey={xFeature} 
                    name={xFeature.toUpperCase()} 
                    domain={['auto', 'auto']} 
                    label={{ value: xFeature.toUpperCase(), position: 'bottom', offset: -10 }} 
                    tick={{fontSize: 12}}
                  />
                  <YAxis 
                    type="number" 
                    dataKey={yFeature} 
                    name={yFeature.toUpperCase()} 
                    domain={['auto', 'auto']} 
                    label={{ value: yFeature.toUpperCase(), angle: -90, position: 'insideLeft' }} 
                    tick={{fontSize: 12}}
                  />
                  <RechartsTooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    formatter={(value: number) => value.toFixed(2)} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Scatter name="Data Points" data={chartData} fill="#3b82f6" opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 text-right mt-2">
              Use the dropdowns above to dynamically explore different scatter configurations.
            </p>
          </div>
        </div>
      ) : viewMode === 'distribution' ? (
        <div className="animate-in fade-in duration-300">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Distribution Feature</label>
              <select 
                value={distFeature} 
                onChange={(e) => setDistFeature(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                {columns.map(col => <option key={col} value={col}>{col === 'medv' ? 'MEDV (Target Price)' : col.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 tracking-tight">
              Distribution of {distFeature.toUpperCase()}
            </h3>
            <div className="h-96 w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="rangeLabel" 
                    label={{ value: `${distFeature.toUpperCase()} Range`, position: 'bottom', offset: 0 }} 
                    tick={{fontSize: 10}}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    label={{ value: 'Frequency (Count)', angle: -90, position: 'insideLeft' }} 
                    tick={{fontSize: 12}}
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [value, 'Count']}
                    labelFormatter={(label) => `Range: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : viewMode === 'heatmap' ? (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
             <h3 className="text-lg font-medium text-gray-900 mb-4 tracking-tight">Pearson Correlation Matrix</h3>
             <p className="text-xs text-gray-500 mb-6">
                Red indicates negative correlation, blue indicates positive correlation. Values closer to 1 or -1 indicate stronger linear relationships.
             </p>
             <div className="inline-block min-w-[700px]">
               <div className="flex">
                  <div className="w-16 shrink-0"></div>
                  {columns.map(c => (
                     <div key={c} className="w-12 text-center text-[10px] font-bold text-gray-400 uppercase transform -rotate-45 mb-2">{c}</div>
                  ))}
               </div>
               {correlationMatrix.map((row: any) => (
                  <div key={row.feature} className="flex">
                     <div className="w-16 shrink-0 text-right pr-4 text-[10px] font-bold text-gray-500 uppercase flex items-center justify-end">{row.feature}</div>
                     {columns.map(c => {
                        const val = row[c] as number;
                        return (
                           <div 
                              key={c} 
                              className={`w-12 h-12 flex items-center justify-center text-[10px] border border-white font-mono transition-colors hover:ring-2 hover:ring-blue-500 hover:z-10 relative cursor-pointer ${getColorClass(val)}`}
                              title={`${row.feature.toUpperCase()} vs ${c.toUpperCase()}: ${val.toFixed(3)}`}
                           >
                              {val === 1 ? '-' : Math.abs(val) > 0.1 ? val.toFixed(1) : ''}
                           </div>
                        );
                     })}
                  </div>
               ))}
             </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
