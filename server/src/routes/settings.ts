import { Router, Request, Response } from 'express';
import Settings from '../models/Settings';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await Settings.find();
    const settingsObj: Record<string, any> = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Request body must be an object of key-value pairs' });
    }

    const results: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      const setting = await Settings.findOneAndUpdate(
        { key },
        { $set: { key, value } },
        { upsert: true, new: true }
      );
      results[key] = setting.value;
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
