import { Request, Response, NextFunction } from 'express';
import { getPricingConfig } from '../services/pricing.service';

export async function getConfig(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const config = await getPricingConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
}
