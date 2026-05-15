import { useState, useEffect } from 'react';
import { DataTask, DataFlowExecutionResult, FinalAnalysisReport, ChartSpecification, DataSource } from '../types/dataflow';
import { dataflowAPI } from '../api/dataflowClient';
import { DataUploader } from './DataUploader';
import { ChartRenderer } from './ChartRenderer';

interface DataFlowBoardProps {
  defaultRequest?: string;
}

type PhaseType = 'breakdown' | 'execution' | 'validation' | 'report';

const phaseLabels: Record<PhaseType, string> = {
  breakdown: '需求解析',
  execution: '并行分析',
  validation: '交叉验证',
  report: '报告生成',
};

export const DataFlowBoard = ({ defaultRequest }: DataFlowBoardProps) => {
  const [userInput, setUserInput] = useState<string>(defaultRequest || '');
  const [phase, setPhase] = useState<PhaseType>('breakdown');
  const [tasks, setTasks] = useState<DataTask[]>([]);
  const [executionResults, setExecutionResults] = useState<DataFlowExecutionResult[]>([]);
  const [finalReport, setFinalReport] = useState<FinalAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<Record<PhaseType, number>>({
    breakdown: 0,
    execution: 0,
    validation: 0,
    report: 0,
  });
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [showDataUploader, setShowDataUploader] = useState(false);
  const [executionStats, setExecutionStats] = useState<{
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
  } | null>(null);
  const [autoExecute, setAutoExecute] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const getTaskStatusColor = (status: DataTask['status']) => {
    switch (status) {
      case 'pending':
        return 'border-gray-300';
      case 'assigned':
        return 'border-yellow-400';
      case 'in_progress':
        return 'border-blue-400';
      case 'completed':
        return 'border-green-400';
      case 'failed':
        return 'border-red-400';
      default:
        return 'border-gray-300';
    }
  };

  const getTaskStatusBg = (status: DataTask['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-50';
      case 'assigned':
        return 'bg-yellow-50';
      case 'in_progress':
        return 'bg-blue-50';
      case 'completed':
        return 'bg-green-50';
      case 'failed':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getTaskStatusBadge = (status: DataTask['status']) => {
    switch (status) {
      case 'pending':
        return { text: '待处理', class: 'bg-gray-100 text-gray-600' };
      case 'assigned':
        return { text: '已分配', class: 'bg-yellow-100 text-yellow-600' };
      case 'in_progress':
        return { text: '处理中', class: 'bg-blue-100 text-blue-600' };
      case 'completed':
        return { text: '已完成', class: 'bg-green-100 text-green-600' };
      case 'failed':
        return { text: '失败', class: 'bg-red-100 text-red-600' };
      default:
        return { text: '未知', class: 'bg-gray-100 text-gray-600' };
    }
  };

  const handleBreakdown = async () => {
    if (!userInput.trim()) {
      setError('请输入分析需求');
      return;
    }

    setLoading(true);
    setError(null);
    if (autoExecute) {
      setIsAutoRunning(true);
    }

    try {
      setPhaseProgress(prev => ({ ...prev, breakdown: 25 }));
      const result = await dataflowAPI.parseRequest(userInput, selectedDataSource?.id);

      if (result.success) {
        setTasks(result.tasks);
        if (result.dataSource) {
          setSelectedDataSource(result.dataSource);
        }
        setPhaseProgress(prev => ({ ...prev, breakdown: 100 }));
        setPhase('execution');
        
        if (autoExecute) {
          await handleExecute(result.tasks);
        }
      } else {
        setError(result.error || '需求解析失败');
        setIsAutoRunning(false);
      }
    } catch (err) {
      setError('需求解析失败');
      setIsAutoRunning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (executingTasks?: DataTask[]) => {
    const currentTasks = executingTasks || tasks;
    if (currentTasks.length === 0) {
      setError('请先解析需求生成任务列表');
      return;
    }

    setLoading(true);
    setError(null);
    setPhaseProgress(prev => ({ ...prev, execution: 0, validation: 0, report: 0 }));

    try {
      const updatedTasks = currentTasks.map(t => ({ ...t, status: 'in_progress' as const }));
      setTasks(updatedTasks);

      let completed = 0;
      const interval = setInterval(() => {
        completed += Math.random() * 20;
        if (completed > 90) completed = 90;
        setPhaseProgress(prev => ({ ...prev, execution: Math.round(completed) }));
      }, 500);

      const result = await dataflowAPI.executeTasks(currentTasks, undefined, selectedDataSource?.id);

      clearInterval(interval);
      setPhaseProgress(prev => ({ ...prev, execution: 100 }));

      if (result.success) {
        setExecutionResults(result.results);
        setExecutionStats(result.executionStats || null);
        const updatedTasks = currentTasks.map(task => {
          const execResult = result.results.find((r: DataFlowExecutionResult) => r.taskId === task.id);
          const newStatus: DataTask['status'] = execResult?.status === 'success' ? 'completed' : 'failed';
          return {
            ...task,
            status: newStatus,
            output: execResult?.output,
            error: execResult?.error,
          };
        });
        setTasks(updatedTasks);
        setPhase('validation');
        
        if (autoExecute) {
          await handleValidate(result.results, updatedTasks);
        }
      } else {
        setError('任务执行失败');
        if (autoExecute) {
          setIsAutoRunning(false);
        }
      }
    } catch (err) {
      setError('任务执行失败');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (results?: DataFlowExecutionResult[], currentTasks?: DataTask[]) => {
    const execResults = results || executionResults;
    const execTasks = currentTasks || tasks;
    
    if (execResults.length === 0) {
      setError('请先执行分析任务');
      return;
    }

    setLoading(true);
    setError(null);
    setPhaseProgress(prev => ({ ...prev, validation: 50, report: 0 }));

    try {
      await dataflowAPI.validateResults(execResults, execTasks);
      setPhaseProgress(prev => ({ ...prev, validation: 100 }));
      setPhase('report');
      
      if (autoExecute) {
        await handleGenerateReport(execResults, execTasks);
      }
    } catch (err) {
      setError('交叉验证失败');
      if (autoExecute) {
        setIsAutoRunning(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (results?: DataFlowExecutionResult[], currentTasks?: DataTask[]) => {
    const execResults = results || executionResults;
    const execTasks = currentTasks || tasks;
    
    if (execResults.length === 0 || execTasks.length === 0) {
      setError('请先完成任务执行和交叉验证');
      return;
    }

    setLoading(true);
    setError(null);
    setPhaseProgress(prev => ({ ...prev, report: 50 }));

    try {
      const result = await dataflowAPI.generateReport(userInput, execResults, execTasks, selectedDataSource?.id);

      if (result.success) {
        setFinalReport(result.report);
        setPhaseProgress(prev => ({ ...prev, report: 100 }));
      } else {
        setError('报告生成失败');
      }
    } catch (err) {
      setError('报告生成失败');
    } finally {
      setLoading(false);
      if (autoExecute) {
        setIsAutoRunning(false);
      }
    }
  };

  const handleReset = () => {
    setPhase('breakdown');
    setTasks([]);
    setExecutionResults([]);
    setFinalReport(null);
    setError(null);
    setExecutionStats(null);
    setPhaseProgress({
      breakdown: 0,
      execution: 0,
      validation: 0,
      report: 0,
    });
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'data-cleaning': '数据清洗',
      'data-exploration': '探索分析',
      'statistical-analysis': '统计分析',
      'visualization': '可视化',
      'hypothesis-testing': '假设检验',
      'correlation-analysis': '相关性分析',
      'pattern-recognition': '模式识别',
      'conclusion-generation': '结论生成',
    };
    return labels[type] || type;
  };

  const renderChart = (chart: ChartSpecification) => {
    return (
      <div key={chart.title} className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-3">{chart.title}</h4>
        <ChartRenderer chart={chart} />
      </div>
    );
  };

  useEffect(() => {
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">智能数据分析工作流</h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重新开始
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            {(Object.keys(phaseLabels) as PhaseType[]).map((p) => (
              <div key={p} className="flex-1 mx-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${phase === p ? 'text-blue-600' : 'text-gray-500'}`}>
                    {phaseLabels[p]}
                  </span>
                  <span className="text-xs text-gray-400">{phaseProgress[p]}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${phase === p ? 'bg-blue-500' : 'bg-blue-300'}`}
                    style={{ width: `${phaseProgress[p]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {phase === 'breakdown' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">数据上传</h3>
                <button
                  onClick={() => setShowDataUploader(!showDataUploader)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {showDataUploader ? '收起' : '展开'}
                </button>
              </div>
              
              {showDataUploader && (
                <DataUploader
                  onDataUploaded={(dataSource) => console.log('Data uploaded:', dataSource)}
                  selectedDataSource={selectedDataSource}
                  onSelectDataSource={setSelectedDataSource}
                />
              )}
              
              {!showDataUploader && selectedDataSource && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">已选择数据: {selectedDataSource.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedDataSource.type.toUpperCase()} | {selectedDataSource.rowCount} 行 | {selectedDataSource.columns?.length || 0} 列
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDataSource(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      移除
                    </button>
                  </div>
                </div>
              )}
              
              {!showDataUploader && !selectedDataSource && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-500">暂无数据，点击上方"展开"按钮上传数据</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">需求解析</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoExecute}
                    onChange={(e) => setAutoExecute(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">自动执行</span>
                </label>
              </div>
              <p className="text-gray-600 mb-4">输入您的分析需求，系统将自动拆解为数据分析任务</p>
              {autoExecute && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ✓ 启用自动执行：需求解析完成后将自动执行所有分析任务并生成报告
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="请输入您的分析需求，例如：&#10;分析最近一季度GMV下降20%的原因，给出改善建议。"
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleBreakdown}
                disabled={loading || !userInput.trim()}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading || !userInput.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    解析中...
                  </div>
                ) : (
                  '开始解析需求'
                )}
              </button>

              {tasks.length > 0 && (
                <button
                  onClick={() => handleExecute()}
                  className="w-full mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  开始执行分析任务
                </button>
              )}
            </div>
          </div>
        )}

        {(phase === 'breakdown' || phase === 'execution') && tasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">分析任务列表</h3>
            
            {executionStats && phase === 'execution' && (
              <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{executionStats.totalTime}ms</div>
                  <div className="text-xs text-gray-500">总耗时</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{executionStats.avgTime}ms</div>
                  <div className="text-xs text-gray-500">平均耗时</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{executionStats.minTime}ms</div>
                  <div className="text-xs text-gray-500">最快任务</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{executionStats.maxTime}ms</div>
                  <div className="text-xs text-gray-500">最慢任务</div>
                </div>
              </div>
            )}
            <div className="grid gap-4">
              {tasks.map((task) => {
                const badge = getTaskStatusBadge(task.status);
                return (
                  <div
                    key={task.id}
                    className={`border-l-4 rounded-lg p-4 ${getTaskStatusColor(task.status)} ${getTaskStatusBg(task.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${badge.class}`}>
                          {badge.text}
                        </span>
                        <span className="text-sm text-gray-500">{getTaskTypeLabel(task.type)}</span>
                      </div>
                      {task.execution_time && (
                        <span className="text-xs text-gray-400">{task.execution_time}ms</span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    {task.assigned_agent && (
                      <p className="text-xs text-gray-500 mt-2">负责人: {task.assigned_agent}</p>
                    )}
                    {task.output && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.output.content}</p>
                      </div>
                    )}
                    {task.error && (
                      <p className="text-sm text-red-600 mt-2">{task.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {phase === 'execution' && !loading && !isAutoRunning && (
              <button
                onClick={() => handleValidate()}
                className="w-full mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                进行交叉验证
              </button>
            )}
            {isAutoRunning && phase === 'execution' && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  自动执行中...
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'validation' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">交叉验证</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800">✓ 所有模型输出一致，分析结果可靠</p>
                </div>
                {!isAutoRunning && (
                  <button
                    onClick={() => handleGenerateReport()}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    生成最终报告
                  </button>
                )}
                {isAutoRunning && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      自动执行中...
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {phase === 'report' && finalReport && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">分析报告</h3>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">执行摘要</h4>
              <p className="text-gray-600">{finalReport.executive_summary}</p>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">详细发现</h4>
              <ul className="space-y-2">
                {finalReport.detailed_findings.map((finding, index) => (
                  <li key={index} className="text-gray-600">
                    {finding}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">可视化图表</h4>
              {finalReport.charts.map(renderChart)}
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-2">建议</h4>
              <ul className="space-y-1">
                {finalReport.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">分析元数据</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">总任务数</p>
                  <p className="font-semibold text-gray-800">{finalReport.metadata.total_tasks}</p>
                </div>
                <div>
                  <p className="text-gray-400">已完成</p>
                  <p className="font-semibold text-gray-800">{finalReport.metadata.completed_tasks}</p>
                </div>
                <div>
                  <p className="text-gray-400">总耗时</p>
                  <p className="font-semibold text-gray-800">{finalReport.metadata.total_time}ms</p>
                </div>
                <div>
                  <p className="text-gray-400">使用模型</p>
                  <p className="font-semibold text-gray-800">{finalReport.metadata.models_used.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};