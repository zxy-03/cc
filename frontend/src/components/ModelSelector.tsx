import { ModelInfo } from '../types';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModels: string[];
  onToggle: (modelId: string) => void;
}

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
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                  {model.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700`}>
                  {model.provider}
                </span>
              </div>
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
