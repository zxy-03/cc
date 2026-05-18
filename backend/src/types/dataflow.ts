export type DataSourceType = 'csv' | 'json' | 'text' | 'excel' | 'database';

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  content: string;
  columns: ColumnInfo[];
  rowCount: number;
  sampleData: Record<string, any>[];
  uploadedAt: string;
  size: number;
}