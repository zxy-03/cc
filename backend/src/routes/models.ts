import { Router } from 'express';
import { MODEL_REGISTRY } from '../config/models';

const router = Router();

router.get('/', (req, res) => {
  const models = MODEL_REGISTRY.map((model) => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
  }));
  res.json(models);
});

export default router;
