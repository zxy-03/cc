import { DataSource, DataSourceType, ColumnInfo } from '../types/dataflow';

export class DataParser {
  static parseCSV(content: string): { columns: ColumnInfo[]; rows: Record<string, any>[] } {
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { columns: [], rows: [] };
    }

    const columnNames = lines[0].split(',').map(col => col.trim());
    const columns: ColumnInfo[] = columnNames.map(name => ({ name, type: 'text' }));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, any> = {};
      columnNames.forEach((col, index) => {
        row[col] = values[index] || '';
      });
      rows.push(row);
    }

    return { columns, rows };
  }

  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue);
    return values;
  }

  static parseJSON(content: string): Record<string, any>[] {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        return [parsed];
      }
      return [];
    } catch {
      return [];
    }
  }

  static parseText(content: string): string[] {
    return content.split('\n').filter(line => line.trim());
  }

  static parse(content: string): { columns: ColumnInfo[]; data: Record<string, any>[] } {
    const type = this.detectType(content);

    if (type === 'csv') {
      const parsed = this.parseCSV(content);
      return { columns: parsed.columns, data: parsed.rows };
    } else if (type === 'json') {
      const parsed = this.parseJSON(content);
      const columns: ColumnInfo[] = parsed.length > 0 && typeof parsed[0] === 'object' 
        ? Object.keys(parsed[0]).map(name => ({ name, type: 'text' })) 
        : [];
      return { columns, data: parsed };
    } else {
      return { columns: [], data: [] };
    }
  }

  static detectType(content: string): DataSourceType {
    content = content.trim();
    
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        JSON.parse(content);
        return 'json';
      } catch {
        // Not valid JSON, continue checking
      }
    }

    const lines = content.split('\n');
    if (lines.length >= 2) {
      const firstLine = lines[0];
      if (firstLine.includes(',')) {
        const hasHeader = firstLine.split(',').every(col => 
          isNaN(parseFloat(col.trim())) || col.trim() === ''
        );
        if (hasHeader) {
          return 'csv';
        }
      }
    }

    return 'text';
  }

  static createDataSource(id: string, name: string, content: string): DataSource {
    const type = this.detectType(content);
    let columns: ColumnInfo[] = [];
    let rowCount = 0;
    let sampleData: Record<string, any>[] = [];

    if (type === 'csv') {
      const parsed = this.parseCSV(content);
      columns = parsed.columns;
      rowCount = parsed.rows.length;
      sampleData = parsed.rows.slice(0, 5);
    } else if (type === 'json') {
      const parsed = this.parseJSON(content);
      rowCount = parsed.length;
      sampleData = parsed.slice(0, 5);
      if (sampleData.length > 0 && typeof sampleData[0] === 'object') {
        columns = Object.keys(sampleData[0]).map(name => ({ name, type: 'text' }));
      }
    } else {
      rowCount = content.split('\n').length;
    }

    return {
      id,
      name,
      type,
      content,
      columns,
      rowCount,
      sampleData,
      uploadedAt: new Date().toISOString(),
      size: content.length,
    };
  }

  static generateId(): string {
    return `data-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}