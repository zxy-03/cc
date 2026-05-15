import { DataSource } from '../types/dataflow';

const uploadedDataSources: Record<string, DataSource> = {};

export class DataSourceService {
  static add(id: string, dataSource: DataSource): void {
    uploadedDataSources[id] = dataSource;
  }

  static get(id: string): DataSource | undefined {
    return uploadedDataSources[id];
  }

  static getAll(): DataSource[] {
    return Object.values(uploadedDataSources);
  }

  static remove(id: string): boolean {
    if (uploadedDataSources[id]) {
      delete uploadedDataSources[id];
      return true;
    }
    return false;
  }

  static has(id: string): boolean {
    return !!uploadedDataSources[id];
  }
}
