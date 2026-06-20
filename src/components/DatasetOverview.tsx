import React, { useState, useMemo } from 'react';
import { DataRow } from '../lib/ml';
import { ChevronLeft, ChevronRight, ArrowUpDown, GripHorizontal, LayoutList } from 'lucide-react';

export function DatasetOverview({ data }: { data: DataRow[] }) {
  const [viewMode, setViewMode] = useState<'raw' | 'stats'>('raw');
  const [page, setPage] = useState(0);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const rowsPerPage = 10;

  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const valA = Number(a[sortCol]);
      const valB = Number(b[sortCol]);
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [data, sortCol, sortAsc]);

  const statsData = useMemo(() => {
    return columns.map(col => {
      const numericVals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      const count = numericVals.length;
      if (count === 0) return { col, count: 0, min: 0, max: 0, mean: 0, std: 0 };
      const min = Math.min(...numericVals);
      const max = Math.max(...numericVals);
      const sum = numericVals.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      const squaredDiffs = numericVals.map(v => Math.pow(v - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
      const std = Math.sqrt(variance);

      return { col, count, min, max, mean, std };
    });
  }, [columns, data]);

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const safePage = Math.min(page, totalPages - 1);
  const paginatedData = sortedData.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
    setPage(0); // reset back to first page on sort
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="px-5 py-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Total Instances</p>
          <p className="text-3xl font-mono text-gray-900 tracking-tight">{data.length}</p>
        </div>
        <div className="px-5 py-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Feature Dimensions</p>
          <p className="text-3xl font-mono text-gray-900 tracking-tight">{columns.length}</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setViewMode('raw')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'raw' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutList className="w-4 h-4" /> Raw Data Sheet
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'stats' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <GripHorizontal className="w-4 h-4" /> Feature Statistics
        </button>
      </div>

      {viewMode === 'raw' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          {sortCol && (
            <div className="flex bg-gray-50 p-2 rounded-lg gap-2 overflow-x-auto text-xs font-mono w-fit">
               <div className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-600 flex items-center gap-2 shadow-sm shrink-0">
                 <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                 <span>Sorted by:</span>
                 <span className="font-bold text-gray-900">{sortCol.toUpperCase()}</span>
                 <span className="text-gray-400">({sortAsc ? 'Ascending' : 'Descending'})</span>
               </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  {columns.map(col => (
                    <th 
                      key={col} 
                      onClick={() => handleSort(col)}
                      className="px-4 py-3.5 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none group border-r border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2 justify-between">
                        {col === 'medv' ? <span className="text-blue-600 flex items-center gap-1">{col} <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase">Target</span></span> : col.toUpperCase()}
                        <ArrowUpDown className={`w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ${sortCol === col ? (sortAsc ? 'text-blue-600 rotate-180' : 'text-blue-600') : ''} transition-transform`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                    {columns.map(col => (
                      <td key={col} className={`px-4 py-2.5 font-mono text-xs ${col === sortCol ? 'bg-gray-50/50 group-hover:bg-transparent font-medium text-gray-900 border-x border-gray-50' : 'text-gray-600 border-r border-gray-50 last:border-0'}`}>
                        {typeof row[col] === 'number' ? row[col].toFixed(col === 'medv' ? 1 : 2) : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm">
              <span className="text-gray-500 font-medium">
                Page <span className="text-gray-900">{safePage + 1}</span> of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors flex items-center gap-1 shadow-sm font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages - 1}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors flex items-center gap-1 shadow-sm font-medium"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
             <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                   <th className="px-5 py-4 uppercase tracking-wider text-xs">Feature</th>
                   <th className="px-5 py-4 uppercase tracking-wider text-xs">Count</th>
                   <th className="px-5 py-4 uppercase tracking-wider text-xs">Mean</th>
                   <th className="px-5 py-4 uppercase tracking-wider text-xs">Std Dev</th>
                   <th className="px-5 py-4 uppercase tracking-wider text-xs">Min</th>
                   <th className="px-5 py-4 uppercase tracking-wider text-xs">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {statsData.map((stat, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                       <td className="px-5 py-3 font-semibold text-gray-900 border-r border-gray-50 flex items-center gap-2">
                          {stat.col.toUpperCase()}
                          {stat.col === 'medv' && <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">Target</span>}
                       </td>
                       <td className="px-5 py-3 font-mono text-xs text-gray-500 border-r border-gray-50">{stat.count}</td>
                       <td className="px-5 py-3 font-mono text-xs text-gray-700 border-r border-gray-50">{stat.mean.toFixed(3)}</td>
                       <td className="px-5 py-3 font-mono text-xs text-gray-700 border-r border-gray-50">{stat.std.toFixed(3)}</td>
                       <td className="px-5 py-3 font-mono text-xs text-gray-500 border-r border-gray-50">{stat.min.toFixed(2)}</td>
                       <td className="px-5 py-3 font-mono text-xs text-gray-500 font-medium">{stat.max.toFixed(2)}</td>
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
