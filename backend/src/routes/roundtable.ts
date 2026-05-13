import { Router, Request, Response } from 'express';
import { Message, RoundtableResult } from '../types';
import { RoundtableScheduler } from '../scheduler/RoundtableScheduler';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { modelIds, messages } = req.body;

  if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
    return res.status(400).json({ error: 'Invalid modelIds' });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  try {
    const results: RoundtableResult[] = await RoundtableScheduler.runRoundtable(modelIds, messages);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
