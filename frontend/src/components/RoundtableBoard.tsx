import { RoundtableResult } from '../types';

interface RoundtableBoardProps {
  results: RoundtableResult[];
  loadingModels: string[];
}

export const RoundtableBoard = ({ results, loadingModels }: RoundtableBoardProps) => {
  const allModels = [...new Set([...results.map(r => r.modelId), ...loadingModels])];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {allModels.map((modelId) => {
        const result = results.find(r => r.modelId === modelId);
        const isLoading = loadingModels.includes(modelId);

        return (
          <div
            key={modelId}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 transition-all duration-200"
            style={{
              borderLeftColor: isLoading ? '#3B82F6' : result?.status === 'success' ? '#10B981' : '#EF4444',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">{modelId}</h3>
              {isLoading && (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                  思考中...
                </span>
              )}
              {result && !isLoading && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {result.status === 'success' ? '完成' : '失败'}
                </span>
              )}
            </div>
            <div className="min-h-[200px]">
              {isLoading && (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-delay-200"></div>
                  </div>
                </div>
              )}
              {result && !isLoading && (
                <div className={`prose prose-sm max-w-none ${
                  result.status === 'error' ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {result.status === 'error' ? (
                    <p className="text-red-600">{result.error}</p>
                  ) : (
                    <p className="whitespace-pre-wrap">{result.content}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
