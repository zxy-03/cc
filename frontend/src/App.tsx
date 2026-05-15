import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ModelInfo, RoundtableResult } from './types';
import { CoordinationResult } from './types/coordination';
import { getModels, roundtable, collaboration } from './api/client';
import { ModelSelector } from './components/ModelSelector';
import { QuestionInput } from './components/QuestionInput';
import { RoundtableBoard } from './components/RoundtableBoard';
import { ComparisonView } from './components/ComparisonView';
import { CollaborationBoard } from './components/CollaborationBoard';
import { DataFlowBoard } from './components/DataFlowBoard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { SubscriptionPage, ApiKeysPage } from './pages/DashboardPages';

type Mode = 'roundtable' | 'collaboration';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI 圆桌会议系统</h1>
              <p className="text-sm text-gray-500">多模型协作对话平台</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-6">
              <nav className="flex gap-4">
                <Link
                  to="/"
                  className={`text-sm font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  对话
                </Link>
                <Link
                  to="/dataflow"
                  className={`text-sm font-medium ${location.pathname === '/dataflow' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  数据分析
                </Link>
                <Link
                  to="/subscription"
                  className={`text-sm font-medium ${location.pathname === '/subscription' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  订阅
                </Link>
                <Link
                  to="/api-keys"
                  className={`text-sm font-medium ${location.pathname === '/api-keys' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  API密钥
                </Link>
              </nav>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.tenantName}</div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                >
                  退出
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const MainPage: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [results, setResults] = useState<RoundtableResult[]>([]);
  const [collabResult, setCollabResult] = useState<CoordinationResult | null>(null);
  const [loadingModels, setLoadingModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<Mode>('roundtable');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await getModels();
        setModels(data);
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setError('无法加载模型列表，请检查后端服务是否运行');
      }
    };
    fetchModels();
  }, []);

  const handleToggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleSubmit = async (question: string) => {
    if (selectedModels.length === 0) {
      setError('请至少选择一个模型');
      return;
    }

    setError('');
    setResults([]);
    setCollabResult(null);
    setLoadingModels(selectedModels);
    setIsLoading(true);

    try {
      if (mode === 'roundtable') {
        const data = await roundtable(selectedModels, [{ role: 'user', content: question }]);
        setResults(data);
      } else {
        const data = await collaboration(selectedModels, question);
        setCollabResult(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('请求失败，请检查后端服务');
    } finally {
      setLoadingModels([]);
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">选择工作模式</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setMode('roundtable')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              mode === 'roundtable'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              圆桌会议
            </div>
            <p className="text-xs mt-1 opacity-70">所有模型回答相同问题</p>
          </button>
          <button
            onClick={() => setMode('collaboration')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              mode === 'collaboration'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              分工协作
            </div>
            <p className="text-xs mt-1 opacity-70">各模型专注不同任务</p>
          </button>
        </div>

        {mode === 'collaboration' && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-medium text-amber-800 mb-2">💡 分工协作使用技巧</h3>
            <p className="text-sm text-amber-700">
              输入提示词时，使用"任务A、任务B、任务C"格式描述各任务，例如：<br />
              <code className="bg-amber-100 px-1 rounded">请帮我分析这个问题，有以下任务：任务A进行市场分析，任务B提供创意方案，任务C总结结论</code>
            </p>
          </div>
        )}
      </div>

      <ModelSelector
        models={models}
        selectedModels={selectedModels}
        onToggle={handleToggleModel}
      />

      <QuestionInput onSubmit={handleSubmit} disabled={isLoading} />

      {mode === 'roundtable' && results.length > 0 && (
        <>
          <RoundtableBoard results={results} loadingModels={loadingModels} />
          <ComparisonView results={results} />
        </>
      )}

      {mode === 'collaboration' && collabResult && (
        <CollaborationBoard
          result={collabResult}
          models={models}
          parsedTasks={collabResult.parsedTasks}
        />
      )}

      {results.length === 0 && !collabResult && !isLoading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            {mode === 'roundtable' ? '准备开始圆桌会议' : '准备开始分工协作'}
          </h3>
          <p className="text-gray-500">
            {mode === 'roundtable'
              ? '选择模型并输入问题，所有模型将回答相同问题'
              : '选择模型并输入问题，各模型将专注不同任务'}
          </p>
        </div>
      )}
    </main>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <MainPage />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <main className="max-w-7xl mx-auto px-4 py-6">
                      <SubscriptionPage />
                    </main>
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-keys"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <main className="max-w-7xl mx-auto px-4 py-6">
                      <ApiKeysPage />
                    </main>
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dataflow"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <DataFlowBoard defaultRequest="分析最近一季度GMV下降20%的原因，给出改善建议。" />
                  </>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          <footer className="bg-white border-t mt-8">
            <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
              AI 圆桌会议系统 - 多模型协作对话平台
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;