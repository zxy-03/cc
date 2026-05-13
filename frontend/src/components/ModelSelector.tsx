import { ModelInfo } from '../types';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModels: string[];
  onToggle: (modelId: string) => void;
}

const roleLabels: Record<string, string> = {
  analyst: '分析师',
  creative: '创意专家',
  summarizer: '总结者',
  'fact-checker': '事实核查',
  writer: '写作者',
  general: '全能助手',
};

const roleColors: Record<string, string> = {
  analyst: 'bg-green-100 text-green-700',
  creative: 'bg-purple-100 text-purple-700',
  summarizer: 'bg-blue-100 text-blue-700',
  'fact-checker': 'bg-orange-100 text-orange-700',
  writer: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700',
};

export const ModelSelector = ({ models, selectedModels, onToggle }: ModelSelectorProps) => {
  const handleToggle = (modelId: string) => {
    onToggle(modelId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">选择参会模型</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const role = model.role || 'general';
          return (
            <button
              key={model.id}
              onClick={() => handleToggle(model.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                  {model.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[role]}`}>
                  {roleLabels[role]}
                </span>
              </div>
              {model.expertise && model.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {model.expertise.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-gray-500">
        已选择 {selectedModels.length} 个模型
      </p>
    </div>
  );
};
