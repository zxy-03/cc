import { useState, useCallback } from 'react';
import { datauploadAPI } from '../api/datauploadClient';
import { DataSource, DataSourceType } from '../types/dataflow';

interface DataUploaderProps {
  onDataUploaded: (dataSource: DataSource) => void;
  selectedDataSource?: DataSource | null;
  onSelectDataSource: (dataSource: DataSource | null) => void;
}

const sampleCSV = `日期,渠道,GMV,订单数,用户数
2024-01-01,渠道A,120000,500,200
2024-01-02,渠道A,135000,580,240
2024-01-03,渠道B,98000,420,180
2024-01-04,渠道B,110000,480,210
2024-01-05,渠道C,85000,380,160
2024-01-06,渠道A,145000,620,260
2024-01-07,渠道C,92000,400,170`;

const sampleJSON = `[
  {"日期": "2024-01-01", "渠道": "渠道A", "GMV": 120000, "订单数": 500, "用户数": 200},
  {"日期": "2024-01-02", "渠道": "渠道A", "GMV": 135000, "订单数": 580, "用户数": 240},
  {"日期": "2024-01-03", "渠道": "渠道B", "GMV": 98000, "订单数": 420, "用户数": 180},
  {"日期": "2024-01-04", "渠道": "渠道B", "GMV": 110000, "订单数": 480, "用户数": 210},
  {"日期": "2024-01-05", "渠道": "渠道C", "GMV": 85000, "订单数": 380, "用户数": 160}
]`;

export const DataUploader = ({ onDataUploaded, selectedDataSource, onSelectDataSource }: DataUploaderProps) => {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text' | 'sample'>('text');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ columns: string[]; sampleData: Record<string, any>[] } | null>(null);

  const loadDataSources = useCallback(async () => {
    try {
      const result = await datauploadAPI.list();
      if (result.success) {
        setDataSources(result.dataSources);
      }
    } catch (err) {
      console.error('Failed to load data sources:', err);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      previewContent(content);
    };
    reader.readAsText(file);
  };

  const previewContent = async (content: string) => {
    try {
      const result = await datauploadAPI.parse(content);
      if (result.success) {
        setPreviewData({
          columns: result.columns,
          sampleData: result.sampleData,
        });
      }
    } catch (err) {
      console.error('Failed to preview content:', err);
    }
  };

  const handleUpload = async () => {
    if (!fileContent.trim()) {
      setError('请输入或上传数据内容');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await datauploadAPI.upload(fileName || 'data.txt', fileContent);
      
      if (result.success && result.dataSource) {
        const fullDataSource = await datauploadAPI.get(result.dataSource.id);
        if (fullDataSource.success) {
          onDataUploaded(fullDataSource.dataSource);
          onSelectDataSource(fullDataSource.dataSource);
          await loadDataSources();
          setPreviewData(null);
        }
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError('上传失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = () => {
    setFileContent(sampleCSV);
    setFileName('sample_data.csv');
    previewContent(sampleCSV);
  };

  const handleSelectJsonSample = () => {
    setFileContent(sampleJSON);
    setFileName('sample_data.json');
    previewContent(sampleJSON);
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('确定要删除这个数据源吗？')) return;

    try {
      const result = await datauploadAPI.delete(id);
      if (result.success) {
        await loadDataSources();
        if (selectedDataSource?.id === id) {
          onSelectDataSource(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete data source:', err);
    }
  };

  const getTypeLabel = (type: DataSourceType) => {
    const labels: Record<DataSourceType, string> = {
      csv: 'CSV',
      json: 'JSON',
      text: '文本',
      excel: 'Excel',
      database: '数据库',
    };
    return labels[type];
  };

  const formatSize = (size?: number) => {
    if (!size) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">数据上传</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'file'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              上传文件
            </button>
            <button
              onClick={() => setUploadMethod('text')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'text'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              输入数据
            </button>
            <button
              onClick={() => setUploadMethod('sample')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                uploadMethod === 'sample'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              示例数据
            </button>
          </div>

          {uploadMethod === 'file' && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600">点击或拖拽文件到此处上传</p>
                <p className="text-sm text-gray-400 mt-1">支持 CSV、JSON、TXT 格式</p>
              </label>
              {fileName && (
                <p className="text-sm text-green-600 mt-2">已选择: {fileName}</p>
              )}
            </div>
          )}

          {uploadMethod === 'text' && (
            <div>
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  previewContent(e.target.value);
                }}
                placeholder="请输入数据内容（支持CSV或JSON格式）\n\nCSV示例：\n日期,渠道,GMV,订单数\n2024-01-01,渠道A,120000,500\n2024-01-02,渠道B,98000,420"
                className="w-full h-40 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {uploadMethod === 'sample' && (
            <div className="space-y-2">
              <button
                onClick={handleSelectSample}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">CSV示例数据</div>
                <div className="text-sm text-gray-500">GMV销售数据（日期、渠道、GMV、订单数、用户数）</div>
              </button>
              <button
                onClick={handleSelectJsonSample}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">JSON示例数据</div>
                <div className="text-sm text-gray-500">结构化销售数据</div>
              </button>
            </div>
          )}

          {fileContent && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`w-full mt-4 px-6 py-3 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  上传中...
                </div>
              ) : (
                '上传数据'
              )}
            </button>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-3">已上传的数据</h4>
          
          {dataSources.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>暂无数据</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dataSources.map((source) => (
                <div
                  key={source.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDataSource?.id === source.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectDataSource(source)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{source.name}</div>
                      <div className="text-xs text-gray-500">
                        {getTypeLabel(source.type)} | {source.rowCount} 行 | {formatSize(source.size)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSource(source.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {source.columns && source.columns.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {source.columns.slice(0, 5).map((col) => (
                        <span key={col} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {col}
                        </span>
                      ))}
                      {source.columns.length > 5 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          +{source.columns.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewData && previewData.sampleData.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3">数据预览</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {previewData.columns.map((col) => (
                    <th key={col} className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.sampleData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {previewData.columns.map((col) => (
                      <td key={col} className="px-4 py-2 text-sm text-gray-700 border-b">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};