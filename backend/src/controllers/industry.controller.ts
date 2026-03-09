import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const industries = await pool.query(
      `SELECT * FROM industries WHERE is_active = true ORDER BY sort_order`,
    );

    const modules = await pool.query(
      `SELECT * FROM modules WHERE is_active = true ORDER BY sort_order`,
    );

    const result = industries.rows.map((ind) => ({
      ...ind,
      modules: modules.rows.filter((m) => m.industry_id === ind.id),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const industry = await pool.query(
      'SELECT * FROM industries WHERE id = $1 AND is_active = true',
      [id],
    );

    if (industry.rows.length === 0) {
      throw new AppError(404, 'Industry not found');
    }

    const modules = await pool.query(
      'SELECT * FROM modules WHERE industry_id = $1 AND is_active = true ORDER BY sort_order',
      [id],
    );

    res.json({ ...industry.rows[0], modules: modules.rows });
  } catch (err) {
    next(err);
  }
}
