import { CoordinationResult, ParsedTask } from '../types/coordination';
import { ModelInfo } from '../types';

interface CollaborationBoardProps {
  result: CoordinationResult;
  models: ModelInfo[];
  parsedTasks?: ParsedTask[];
}

const taskColors: Record<string, string> = {
  '任务A': 'bg-green-100 text-green-700 border-green-300',
  '任务B': 'bg-purple-100 text-purple-700 border-purple-300',
  '任务C': 'bg-blue-100 text-blue-700 border-blue-300',
  '任务D': 'bg-orange-100 text-orange-700 border-orange-300',
  '任务1': 'bg-pink-100 text-pink-700 border-pink-300',
  '任务2': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  '任务3': 'bg-teal-100 text-teal-700 border-teal-300',
  '任务4': 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

const taskStatusColors: Record<string, string> = {
  success: 'border-green-500',
  error: 'border-red-500',
};

export const CollaborationBoard = ({ result, models, parsedTasks }: CollaborationBoardProps) => {
  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.name || modelId;
  };

  const getTaskColor = (taskName: string) => {
    return taskColors[taskName] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">分工协作任务清单</h2>
        <p className="text-gray-600 mb-4">
          <span className="font-medium">原始问题：</span>{result.plan.mainQuestion}
        </p>

        {parsedTasks && parsedTasks.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">检测到的任务分工：</h3>
            <ul className="space-y-2">
              {parsedTasks.map((task, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                  <span className="font-medium min-w-[60px]">{task.name}</span>
                  <span className="flex-1">{task.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.plan.tasks.map((task, index) => {
            const parsedTask = parsedTasks && parsedTasks[index];
            return (
              <div
                key={task.taskId}
                className={`p-4 rounded-lg border ${getTaskColor(task.role)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {parsedTask?.name || task.role}
                  </span>
                  <span className="text-xs bg-white/50 px-2 py-1 rounded">
                    {getModelName(task.modelId)}
                  </span>
                </div>
                <p className="text-sm opacity-80 line-clamp-2">
                  {parsedTask?.description || task.taskDescription.split('。')[0]}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {result.taskResults.map((taskResult) => {
          const taskIndex = result.plan.tasks.findIndex((t) => t.taskId === taskResult.taskId);
          const task = result.plan.tasks[taskIndex];
          const parsedTask = parsedTasks && parsedTasks[taskIndex];
          const taskName = task?.role || '任务';
          return (
            <div
              key={taskResult.taskId}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${taskStatusColors[taskResult.status]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {getModelName(taskResult.modelId)}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTaskColor(taskName)}`}>
                    {parsedTask?.name || taskName}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    taskResult.status === 'success'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {taskResult.status === 'success' ? '完成' : '失败'}
                </span>
              </div>
              <div className="min-h-[200px]">
                {taskResult.status === 'error' ? (
                  <p className="text-red-600">{taskResult.error}</p>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{taskResult.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};