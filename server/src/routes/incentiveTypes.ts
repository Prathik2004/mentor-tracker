import { Router, Request, Response } from 'express';
import IncentiveType from '../models/IncentiveType';
import Incentive from '../models/Incentive';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const types = await IncentiveType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incentive types' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Incentive type name is required' });
    }

    const existing = await IncentiveType.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: 'Incentive type already exists' });
    }

    const type = new IncentiveType({ name: name.trim(), isDefault: false });
    await type.save();
    res.status(201).json(type);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create incentive type' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const type = await IncentiveType.findById(req.params.id);
    if (!type) return res.status(404).json({ error: 'Incentive type not found' });

    // Check if any incentives use this type
    const usageCount = await Incentive.countDocuments({ type: type.name });
    if (usageCount > 0) {
      return res.status(400).json({
        error: `Cannot delete incentive type "${type.name}" - it is used by ${usageCount} incentive(s)`
      });
    }

    await IncentiveType.findByIdAndDelete(req.params.id);
    res.json({ message: 'Incentive type deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete incentive type' });
  }
});

export default router;
