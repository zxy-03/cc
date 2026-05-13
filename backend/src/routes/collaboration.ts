import { Router, Request, Response } from 'express';
import { CollaborationScheduler } from '../scheduler/CollaborationScheduler';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { modelIds, mainQuestion } = req.body;

  if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
    return res.status(400).json({ error: 'Invalid modelIds' });
  }

  if (!mainQuestion || typeof mainQuestion !== 'string') {
    return res.status(400).json({ error: 'Invalid mainQuestion' });
  }

  try {
    const parseResult = CollaborationScheduler.parsePrompt(mainQuestion);
    const result = await CollaborationScheduler.runCollaboration(modelIds, mainQuestion);

    res.json({
      ...result,
      parsedTasks: parseResult.success ? parseResult.tasks : [],
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;