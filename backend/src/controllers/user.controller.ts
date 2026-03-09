import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pool.query(
      `SELECT id, email, full_name, role, company_name, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user!.sub],
    );
    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { fullName, companyName, avatarUrl } = req.body;
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (fullName !== undefined) {
      setClauses.push(`full_name = $${i++}`);
      params.push(fullName);
    }
    if (companyName !== undefined) {
      setClauses.push(`company_name = $${i++}`);
      params.push(companyName);
    }
    if (avatarUrl !== undefined) {
      setClauses.push(`avatar_url = $${i++}`);
      params.push(avatarUrl);
    }

    if (setClauses.length === 0) {
      throw new AppError(400, 'No fields to update');
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(req.user!.sub);

    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${i}
       RETURNING id, email, full_name, role, company_name, avatar_url, created_at`,
      params,
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.sub],
    );
    if (result.rows.length === 0) {
      throw new AppError(404, 'User not found');
    }

    const valid = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash,
    );
    if (!valid) {
      throw new AppError(401, 'Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user!.sub],
    );
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}
