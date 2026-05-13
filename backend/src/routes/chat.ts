import { Router, Request, Response } from 'express';
import { ModelInfo, Message, ChatResponse } from '../types';
import { getModelById } from '../config/models';
import { AdapterFactory } from '../adapters/AdapterFactory';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { modelId, messages } = req.body;

  if (!modelId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const modelInfo: ModelInfo | undefined = getModelById(modelId);
  if (!modelInfo) {
    return res.status(404).json({ error: 'Model not found' });
  }

  try {
    const adapter = AdapterFactory.createAdapter(modelInfo);
    const response: ChatResponse = await adapter.chat(messages);

    res.json({
      modelId,
      content: response.content,
      finishReason: response.finishReason,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
