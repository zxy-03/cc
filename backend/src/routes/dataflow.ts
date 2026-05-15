import express from 'express';
import { DataFlowScheduler } from '../scheduler/DataFlowScheduler';
import { DataAnalysisRequest, DataTask, DataSource } from '../types/dataflow';

const router = express.Router();

interface ExecuteRequest {
  user_request: string;
  tasks?: DataTask[];
  data_source_id?: string;
}

router.post('/parse', async (req, res) => {
  try {
    const { user_request, data_source_id }: { user_request: string; data_source_id?: string } = req.body;

    if (!user_request) {
      return res.status(400).json({
        success: false,
        error: 'user_request is required',
      });
    }

    const result = await DataFlowScheduler.parseAnalysisRequest(user_request, data_source_id);

    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/assign', async (req, res) => {
  try {
    const { tasks }: { tasks: DataTask[] } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'tasks array is required',
      });
    }

    const assignedTasks = await DataFlowScheduler.assignTasksToAgents(tasks);

    res.json({
      success: true,
      tasks: assignedTasks,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { tasks, options, data_source_id }: { tasks: DataTask[]; options?: { timeoutMs?: number; maxRetries?: number; parallelism?: number }; data_source_id?: string } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'tasks array is required',
      });
    }

    const { DataSourceService } = await import('../services/DataSourceService');
    const userData = data_source_id ? DataSourceService.get(data_source_id) : undefined;

    const result = await DataFlowScheduler.executeParallelAnalysis(tasks, undefined, options, userData);

    res.json({
      success: true,
      results: result.results,
      completedTasks: result.completedTasks,
      failedTasks: result.failedTasks,
      executionStats: result.executionStats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/run', async (req, res) => {
  try {
    const { user_request, data_source_id }: { user_request: string; data_source_id?: string } = req.body;

    if (!user_request) {
      return res.status(400).json({
        success: false,
        error: 'user_request is required',
      });
    }

    const result = await DataFlowScheduler.runFullWorkflow(
      user_request,
      (phase, progress, message) => {
        console.log(`[DataFlow API] Phase: ${phase}, Progress: ${progress}%, Message: ${message}`);
      },
      data_source_id
    );

    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { results, tasks } = req.body;

    if (!results || !tasks) {
      return res.status(400).json({
        success: false,
        error: 'results and tasks are required',
      });
    }

    const validationResult = await DataFlowScheduler.crossValidateResults(results, tasks);

    res.json({
      success: true,
      validation: validationResult,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/report', async (req, res) => {
  try {
    const { original_request, results, tasks, data_source_id } = req.body;

    if (!original_request || !results || !tasks) {
      return res.status(400).json({
        success: false,
        error: 'original_request, results and tasks are required',
      });
    }

    const { DataSourceService } = await import('../services/DataSourceService');
    const userData = data_source_id ? DataSourceService.get(data_source_id) : undefined;

    const report = await DataFlowScheduler.generateFinalReport(original_request, results, tasks, userData);

    res.json({
      success: true,
      report,
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