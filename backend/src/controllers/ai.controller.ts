import { Request, Response, NextFunction } from 'express';
import { generateProposalContent } from '../services/ai.service';

export async function generate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const content = await generateProposalContent(req.body);
    res.json(content);
  } catch (err) {
    next(err);
  }
}
