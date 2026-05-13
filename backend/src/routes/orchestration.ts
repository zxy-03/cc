import express from 'express';
import { TaskBreakdownParser } from '../utils/TaskBreakdownParser';
import { EXPERT_AGENTS_POOL, recommendAgentsForTask } from '../config/expertAgents';
import { TaskOrchestrator } from '../scheduler/TaskOrchestrator';
import { ExecutionScheduler } from '../scheduler/ExecutionScheduler';
import { SummaryGenerator } from '../scheduler/SummaryGenerator';
import { SubTask, AssignmentPlan, FinalSummary } from '../types/coordination';

const router = express.Router();

interface TaskBreakdownRequest {
  user_request: string;
}

interface AssignmentRequest {
  tasks: SubTask[];
  assignments: Map<string, string>;
}

interface ExecutionRequest {
  tasks: SubTask[];
}

interface SummaryRequest {
  original_request: string;
  execution_results: any[];
  tasks: SubTask[];
}

router.post('/breakdown', async (req, res) => {
  try {
    const { user_request }: TaskBreakdownRequest = req.body;

    if (!user_request) {
      return res.status(400).json({
        success: false,
        error: 'user_request is required',
      });
    }

    const result = await TaskBreakdownParser.breakdownTask(user_request);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/breakdown/regenerate', async (req, res) => {
  try {
    const { original_request, task_id, feedback } = req.body;

    if (!original_request || !task_id) {
      return res.status(400).json({
        success: false,
        error: 'original_request and task_id are required',
      });
    }

    const result = await TaskBreakdownParser.regenerateSubTask(
      original_request,
      task_id,
      feedback
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.get('/agents', (req, res) => {
  res.json({
    success: true,
    agents: EXPERT_AGENTS_POOL,
  });
});

router.get('/agents/available', (req, res) => {
  const availableAgents = EXPERT_AGENTS_POOL.filter(agent => agent.status === 'idle');
  res.json({
    success: true,
    agents: availableAgents,
  });
});

router.post('/agents/recommend', (req, res) => {
  try {
    const { required_skills, exclude_busy = true } = req.body;

    if (!required_skills || !Array.isArray(required_skills)) {
      return res.status(400).json({
        success: false,
        error: 'required_skills is required and must be an array',
      });
    }

    const recommendedAgents = recommendAgentsForTask(required_skills, exclude_busy);

    res.json({
      success: true,
      agents: recommendedAgents,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/orchestrator/validate', (req, res) => {
  try {
    const { tasks }: { tasks: SubTask[] } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'tasks is required and must be an array',
      });
    }

    const validation = TaskOrchestrator.validateTaskBreakdown(tasks);

    res.json(validation);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/orchestrator/plan', (req, res) => {
  try {
    const { tasks }: { tasks: SubTask[] } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'tasks is required and must be an array',
      });
    }

    const recommendations = TaskOrchestrator.generateAutoRecommendations(tasks);
    const executionPlan = TaskOrchestrator.getExecutionPlan(tasks);
    const stats = TaskOrchestrator.getExecutionStats(tasks);

    res.json({
      success: true,
      recommendations: Object.fromEntries(recommendations),
      execution_plan: executionPlan,
      stats: stats,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/orchestrator/assign', (req, res) => {
  try {
    const { tasks, assignments }: AssignmentRequest = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'tasks is required and must be an array',
      });
    }

    if (!assignments) {
      return res.status(400).json({
        success: false,
        error: 'assignments is required',
      });
    }

    const assignmentMap = new Map(Object.entries(assignments));
    const plan = TaskOrchestrator.createAssignmentPlan(tasks, assignmentMap);

    res.json({
      success: true,
      plan: plan,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/execution/start', async (req, res) => {
  try {
    const { tasks }: ExecutionRequest = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        error: 'tasks is required and must be an array',
      });
    }

    const unassignedTasks = tasks.filter(t => !t.assigned_agent);
    if (unassignedTasks.length > 0) {
      return res.status(400).json({
        success: false,
        error: `${unassignedTasks.length} tasks are not assigned to any agent`,
      });
    }

    const { results, completedTasks, failedTasks } = await ExecutionScheduler.executeTasks(tasks);

    res.json({
      success: true,
      results: results,
      completed_tasks: completedTasks,
      failed_tasks: failedTasks,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/execution/retry', async (req, res) => {
  try {
    const { task_id, tasks, agent_id } = req.body;

    if (!task_id || !tasks || !agent_id) {
      return res.status(400).json({
        success: false,
        error: 'task_id, tasks, and agent_id are required',
      });
    }

    const task = tasks.find((t: SubTask) => t.id === task_id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const agent = EXPERT_AGENTS_POOL.find(a => a.id === agent_id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    const result = await ExecutionScheduler.retryTask(task, agent);

    res.json({
      success: true,
      result: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/summary/generate', async (req, res) => {
  try {
    const { original_request, execution_results, tasks }: SummaryRequest = req.body;

    if (!original_request || !execution_results || !tasks) {
      return res.status(400).json({
        success: false,
        error: 'original_request, execution_results, and tasks are required',
      });
    }

    const summary = await SummaryGenerator.generateFinalSummary(
      original_request,
      execution_results,
      tasks
    );

    res.json({
      success: true,
      summary: summary,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.post('/summary/regenerate', async (req, res) => {
  try {
    const { original_request, execution_results, tasks, feedback } = req.body;

    if (!original_request || !execution_results || !tasks) {
      return res.status(400).json({
        success: false,
        error: 'original_request, execution_results, and tasks are required',
      });
    }

    const summary = await SummaryGenerator.regenerateSummary(
      original_request,
      execution_results,
      tasks,
      feedback
    );

    res.json({
      success: true,
      summary: summary,
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
