import React, { useEffect, useState } from 'react';
import { fetchBostonData } from './lib/data';
import { DataRow } from './lib/ml';
import { useModelPipeline } from './lib/useModelPipeline';

import { DatasetOverview } from './components/DatasetOverview';
import { ExplorationView } from './components/ExplorationView';
import { ModelView } from './components/ModelView';
import { PredictorView } from './components/PredictorView';

import { Database, BarChart2, Cpu, Calculator } from 'lucide-react';

type Tab = 'data' | 'explore' | 'train' | 'predict';

export default function App() {
  const [data, setData] = useState<DataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const { pipelineState, isTraining, trainModel, predict } = useModelPipeline();

  useEffect(() => {
    fetchBostonData().then(fetchedData => {
      setData(fetchedData);
      setIsLoading(false);
    });
  }, []);

  const TABS: { id: Tab, label: string, icon: any }[] = [
    { id: 'data', label: 'Dataset', icon: Database },
    { id: 'explore', label: 'Explore', icon: BarChart2 },
    { id: 'train', label: 'Train Model', icon: Cpu },
    { id: 'predict', label: 'Predict Price', icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans selection:bg-blue-100 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-inner">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Boston Housing Estimator
            </h1>
          </div>
          <div className="text-[10px] font-mono bg-indigo-50 px-3 py-1 rounded text-indigo-700 font-semibold border border-indigo-100 uppercase tracking-widest hidden sm:block">
            ML_PIPELINE_ACTIVE
          </div>
        </div>
        
        {/* Nav Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 mt-1 relative top-[1px] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 pt-1 px-1 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-700' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
              {tab.label}
              {tab.id === 'predict' && pipelineState && (
                 <span className="flex h-1.5 w-1.5 relative -top-1 -left-0.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                 </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Areas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
             <p className="text-gray-500 font-medium animate-pulse">Loading Boston Housing dataset...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 min-h-[500px]">
            {activeTab === 'data' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Boston Housing Data</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    This dataset contains information collected by the U.S Census Service concerning housing in the area of Boston Mass. 
                    It was obtained from the StatLib archive and has been used extensively throughout the literature to benchmark algorithms.
                  </p>
                </div>
                <DatasetOverview data={data} />
              </div>
            )}

            {activeTab === 'explore' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Exploratory Data Analysis</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Visualizing the relationships between key features and the target variable (median house value). Observe correlation trends before advancing into modeling.
                  </p>
                </div>
                <ExplorationView data={data} />
              </div>
            )}

            {activeTab === 'train' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Hyperparameter Configuration</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Train a strictly client-side multivariate linear regression model. Define parameters, select features, and compute the active weight distributions immediately.
                  </p>
                </div>
                <ModelView 
                  data={data}
                  pipelineState={pipelineState}
                  isTraining={isTraining}
                  trainModel={trainModel}
                />
              </div>
            )}

            {activeTab === 'predict' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Target Predictor Simulation</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Alter feature values constrained safely within the active training bounds. The model performs real-time weighted vector calculations to yield final valuation estimates within error margins.
                  </p>
                </div>
                <PredictorView 
                  pipelineState={pipelineState} 
                  predict={predict} 
                  data={data} 
                />
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
