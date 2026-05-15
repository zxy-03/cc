import express from 'express';
import { DataParser } from '../utils/DataParser';
import { DataSource } from '../types/dataflow';
import { DataSourceService } from '../services/DataSourceService';

const router = express.Router();

router.post('/upload', async (req, res) => {
  try {
    const { name, content } = req.body;

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: 'name and content are required',
      });
    }

    const id = DataParser.generateId();
    const dataSource = DataParser.createDataSource(id, name, content);

    DataSourceService.add(id, dataSource);

    res.json({
      success: true,
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        columns: dataSource.columns,
        rowCount: dataSource.rowCount,
        uploadedAt: dataSource.uploadedAt,
        size: dataSource.size,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const dataSources = DataSourceService.getAll().map(ds => ({
      id: ds.id,
      name: ds.name,
      type: ds.type,
      columns: ds.columns,
      rowCount: ds.rowCount,
      uploadedAt: ds.uploadedAt,
      size: ds.size,
    }));

    res.json({
      success: true,
      dataSources,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dataSource = DataSourceService.get(id);

    if (!dataSource) {
      return res.status(404).json({
        success: false,
        error: 'Data source not found',
      });
    }

    res.json({
      success: true,
      dataSource,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!DataSourceService.remove(id)) {
      return res.status(404).json({
        success: false,
        error: 'Data source not found',
      });
    }

    res.json({
      success: true,
      message: 'Data source deleted successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/parse', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'content is required',
      });
    }

    const parsed = DataParser.parse(content);

    res.json({
      success: true,
      columns: parsed.columns || [],
      sampleData: parsed.data?.slice(0, 5) || [],
      rowCount: parsed.data?.length || 0,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
