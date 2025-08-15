import React, { useState, useEffect } from 'react';
import { FiDatabase, FiTag, FiAlertCircle, FiActivity } from 'react-icons/fi';
import { AnalyticsAPI, TokenSummary, TokenByType, TokenMemory, TokenTrend } from '../../services/api/analytics.api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatNumber } from '../../utils/formatters';

interface TokenUsageTabProps {
  projectName?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function TokenUsageTab({ projectName }: TokenUsageTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [byType, setByType] = useState<TokenByType[]>([]);
  const [topMemories, setTopMemories] = useState<TokenMemory[]>([]);
  const [trends, setTrends] = useState<TokenTrend[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<TokenMemory | null>(null);

  useEffect(() => {
    fetchTokenAnalytics();
  }, [projectName]);

  const fetchTokenAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AnalyticsAPI.getTokenAnalytics({ 
        project_name: projectName || undefined,
        limit: 10 
      });

      if (response.data) {
        setSummary(response.data.summary);
        setByType(response.data.byType);
        setTopMemories(response.data.topMemories);
        setTrends(response.data.trends);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load token analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchTokenAnalytics} />;
  }

  if (!summary || summary.total_memories === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FiDatabase className="w-12 h-12 mb-4" />
        <p className="text-lg">No token usage data available</p>
        <p className="text-sm mt-2">Memories will track token usage as they are created</p>
      </div>
    );
  }

  const coveragePercentage = ((summary.memories_with_tokens / summary.total_memories) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</p>
              <p className="text-2xl font-semibold mt-1">{formatNumber(summary.total_tokens)}</p>
            </div>
            <FiDatabase className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {coveragePercentage}% coverage
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Content Tokens</p>
              <p className="text-2xl font-semibold mt-1">{formatNumber(summary.content_tokens)}</p>
            </div>
            <FiActivity className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {((summary.content_tokens / summary.total_tokens) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Summary Tokens</p>
              <p className="text-2xl font-semibold mt-1">{formatNumber(summary.summary_tokens)}</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {((summary.summary_tokens / summary.total_tokens) * 100).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg per Memory</p>
              <p className="text-2xl font-semibold mt-1">{formatNumber(summary.avg_tokens_per_memory)}</p>
            </div>
            <FiTag className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            tokens/memory
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Distribution by Type */}
        {byType.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Token Distribution by Memory Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="total_tokens"
                  nameKey="memory_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ memory_type, percent }) => 
                    `${memory_type} (${(percent * 100).toFixed(1)}%)`
                  }
                >
                  {byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Token Trends */}
        {trends.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Token Usage Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tokens_added" 
                  stroke="#3B82F6" 
                  name="Tokens Added"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="memories_created" 
                  stroke="#10B981" 
                  name="Memories Created"
                  strokeWidth={2}
                  yAxisId="right"
                />
                <YAxis yAxisId="right" orientation="right" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Type Breakdown Table */}
      {byType.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Token Usage by Type</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Memory Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Tokens
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {byType.map((type) => (
                  <tr key={type.memory_type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {type.memory_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.total_tokens)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(type.avg_tokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Token-Consuming Memories */}
      {topMemories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top Token-Consuming Memories</h3>
          <div className="space-y-4">
            {topMemories.map((memory) => (
              <div
                key={memory.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setSelectedMemory(memory)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{memory.memory_type}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{memory.project_name}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {memory.content_preview}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-semibold">{formatNumber(memory.token_metadata.total_tokens)}</p>
                    <p className="text-xs text-gray-500">tokens</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Memory Modal */}
      {selectedMemory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Memory Token Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Memory ID</p>
                <p className="font-medium">{selectedMemory.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{selectedMemory.memory_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Project</p>
                <p className="font-medium">{selectedMemory.project_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Preview</p>
                <p className="font-medium">{selectedMemory.content_preview}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Token Breakdown</p>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Content Tokens:</span>
                    <span className="font-medium">{formatNumber(selectedMemory.token_metadata.content_tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Summary Tokens:</span>
                    <span className="font-medium">{formatNumber(selectedMemory.token_metadata.summary_tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tag Tokens:</span>
                    <span className="font-medium">{formatNumber(selectedMemory.token_metadata.tags_tokens)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Tokens:</span>
                    <span>{formatNumber(selectedMemory.token_metadata.total_tokens)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Calculation Method</p>
                <p className="font-medium">{selectedMemory.token_metadata.calculation_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Calculated At</p>
                <p className="font-medium">{new Date(selectedMemory.token_metadata.calculated_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedMemory(null)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}