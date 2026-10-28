import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { getUserId, signAuthToken, requireAuth } from '../middleware/auth';

const router = Router();

function publicUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email };
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists' });

    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    return res.status(201).json({ token: signAuthToken(String(user._id)), user: publicUser(user) });
  } catch {
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.json({ token: signAuthToken(String(user._id)), user: publicUser(user) });
  } catch {
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(getUserId(req));
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: publicUser(user) });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch account' });
  }
});

export default router;