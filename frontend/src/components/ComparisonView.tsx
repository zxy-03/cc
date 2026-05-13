import { RoundtableResult } from '../types';

interface ComparisonViewProps {
  results: RoundtableResult[];
}

export const ComparisonView = ({ results }: ComparisonViewProps) => {
  const successResults = results.filter(r => r.status === 'success');
  
  if (successResults.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">对比分析</h2>
        <p className="text-gray-500">需要至少 2 个成功的回答才能进行对比分析</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">对比分析</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">模型</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">回答长度</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">预览</th>
            </tr>
          </thead>
          <tbody>
            {successResults.map((result) => (
              <tr key={result.modelId} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{result.modelId}</td>
                <td className="py-3 px-4 text-gray-600">{result.content.length} 字符</td>
                <td className="py-3 px-4 text-gray-500">
                  {result.content.substring(0, 100)}{result.content.length > 100 ? '...' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
