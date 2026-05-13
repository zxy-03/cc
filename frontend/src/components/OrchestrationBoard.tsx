import { useState, useEffect } from 'react';
import { SubTask, ExpertAgent, ExecutionResult, FinalSummary } from '../types/coordination';
import { orchestrationAPI } from '../api/orchestrationClient';

interface OrchestrationBoardProps {
  userRequest: string;
}

export const OrchestrationBoard = ({ userRequest }: OrchestrationBoardProps) => {
  const [phase, setPhase] = useState<'breakdown' | 'assignment' | 'execution' | 'summary'>('breakdown');
  const [tasks, setTasks] = useState<SubTask[]>([]);
  const [agents, setAgents] = useState<ExpertAgent[]>([]);
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map());
  const [recommendations, setRecommendations] = useState<Record<string, ExpertAgent[]>>({});
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const result = await orchestrationAPI.getAgents();
      if (result.success) {
        setAgents(result.agents);
      }
    } catch (err) {
      setError('Failed to load agents');
    }
  };

  const handleBreakdown = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await orchestrationAPI.breakdownTask(userRequest);

      if (result.success) {
        setTasks(result.subtasks);
        await loadExecutionPlan(result.subtasks);
        setPhase('assignment');
      } else {
        setError(result.error || 'Failed to breakdown task');
      }
    } catch (err) {
      setError('Failed to breakdown task');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionPlan = async (subtasks: SubTask[]) => {
    try {
      const plan = await orchestrationAPI.getExecutionPlan(subtasks);
      if (plan.success) {
        setRecommendations(plan.recommendations);
      }
    } catch (err) {
      setError('Failed to load execution plan');
    }
  };

  const handleAssignAgent = (taskId: string, agentId: string) => {
    setAssignments(prev => new Map(prev).set(taskId, agentId));
  };

  const handleAutoAssign = () => {
    const newAssignments = new Map<string, string>();

    tasks.forEach(task => {
      const recommended = recommendations[task.id];
      if (recommended && recommended.length > 0) {
        newAssignments.set(task.id, recommended[0].id);
      }
    });

    setAssignments(newAssignments);
  };

  const handleStartExecution = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedTasks = tasks.map(task => ({
        ...task,
        assigned_agent: assignments.get(task.id),
        status: assignments.has(task.id) ? 'assigned' as const : 'pending' as const,
      }));

      const result = await orchestrationAPI.startExecution(updatedTasks);

      if (result.success) {
        setExecutionResults(result.results);
        setTasks(updatedTasks.map(task => {
          const taskResult = result.results.find(r => r.taskId === task.id);
          return {
            ...task,
            status: taskResult?.status === 'success' ? 'completed' : 'failed',
            output: taskResult?.output,
            error: taskResult?.error,
          };
        }));
        setPhase('summary');
      } else {
        setError('Failed to start execution');
      }
    } catch (err) {
      setError('Failed to start execution');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await orchestrationAPI.generateSummary(userRequest, executionResults, tasks);

      if (result.success) {
        setFinalSummary(result.summary);
      } else {
        setError('Failed to generate summary');
      }
    } catch (err) {
      setError('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSummary = async (feedback?: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await orchestrationAPI.regenerateSummary(userRequest, executionResults, tasks, feedback);

      if (result.success) {
        setFinalSummary(result.summary);
      } else {
        setError('Failed to regenerate summary');
      }
    } catch (err) {
      setError('Failed to regenerate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhase('breakdown');
    setTasks([]);
    setAssignments(new Map());
    setRecommendations({});
    setExecutionResults([]);
    setFinalSummary(null);
    setError(null);
  };

  const renderBreakdownPhase = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">任务拆解阶段</h2>
        <p className="text-gray-600 mb-4">
          <span className="font-medium">用户需求：</span>{userRequest}
        </p>
        <button
          onClick={handleBreakdown}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? '拆解中...' : '开始任务拆解'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );

  const renderAssignmentPhase = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">任务分配阶段</h2>
          <div className="space-x-2">
            <button
              onClick={handleAutoAssign}
              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              自动分配
            </button>
            <button
              onClick={() => setPhase('breakdown')}
              className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              返回
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-medium text-gray-700">任务列表</h3>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {task.estimated_type}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-gray-500">所需技能：</span>
                  <div className="flex flex-wrap gap-1">
                    {task.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {task.dependencies.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">依赖：</span>
                    <span className="text-sm text-gray-700">
                      {task.dependencies.join(', ')}
                    </span>
                  </div>
                )}

                <div className="mt-3">
                  <label className="text-sm text-gray-600 block mb-1">分配给：</label>
                  <select
                    value={assignments.get(task.id) || ''}
                    onChange={(e) => handleAssignAgent(task.id, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">选择专家AI</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.status})
                      </option>
                    ))}
                  </select>
                </div>

                {recommendations[task.id] && recommendations[task.id].length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-green-600">推荐：{recommendations[task.id][0].name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-3">专家AI池</h3>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg ${
                    agent.status === 'idle' ? 'bg-green-50' : 'bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{agent.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      agent.status === 'idle' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {agent.status === 'idle' ? '空闲' : '忙碌'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{agent.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleStartExecution}
            disabled={loading || assignments.size !== tasks.length}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '执行中...' : '开始执行'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderExecutionPhase = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">执行结果</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {executionResults.map((result) => (
            <div
              key={result.taskId}
              className={`p-4 border rounded-lg ${
                result.status === 'success' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">
                  {tasks.find(t => t.id === result.taskId)?.title || result.taskId}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  result.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {result.status === 'success' ? '完成' : '失败'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                执行时间：{result.execution_time}ms
              </p>
              {result.error && (
                <p className="text-sm text-red-600 mt-2">{result.error}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : '生成最终总结'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSummaryPhase = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">最终成果</h2>
          <div className="space-x-2">
            <button
              onClick={() => handleRegenerateSummary()}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              重新生成
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              新任务
            </button>
          </div>
        </div>

        {finalSummary && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">原始需求</h3>
              <p className="text-blue-700">{finalSummary.original_request}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">整合成果</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {finalSummary.consolidated_output}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">任务贡献</h3>
              <div className="space-y-2">
                {finalSummary.task_contributions.map((contribution, idx) => (
                  <div key={idx} className="text-sm text-green-700">
                    <span className="font-medium">{contribution.taskId}:</span>{' '}
                    {contribution.contribution_summary}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">元数据</h3>
              <div className="text-sm text-gray-600">
                <p>总任务数：{finalSummary.metadata.total_tasks}</p>
                <p>完成任务数：{finalSummary.metadata.completed_tasks}</p>
                <p>总耗时：{finalSummary.metadata.total_time}ms</p>
                <p>创建时间：{new Date(finalSummary.metadata.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">多AI协作系统</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {phase === 'breakdown' && renderBreakdownPhase()}
      {phase === 'assignment' && renderAssignmentPhase()}
      {phase === 'execution' && renderExecutionPhase()}
      {phase === 'summary' && renderSummaryPhase()}
    </div>
  );
};
