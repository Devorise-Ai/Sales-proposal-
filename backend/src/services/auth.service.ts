import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { pool } from '../config/database';
import { User, UserPublic, JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    company_name: user.company_name,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
  };
}

function generateTokens(user: User) {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

export async function register(
  email: string,
  password: string,
  fullName: string,
) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    email,
  ]);
  if (existing.rows.length > 0) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query<User>(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, fullName],
  );

  const user = result.rows[0];
  const tokens = generateTokens(user);

  return { user: toPublicUser(user), ...tokens };
}

export async function login(email: string, password: string) {
  const result = await pool.query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email],
  );
  const user = result.rows[0];
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const tokens = generateTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = jwt.verify(
      refreshToken,
      env.jwtRefreshSecret,
    ) as JwtPayload;

    const result = await pool.query<User>('SELECT * FROM users WHERE id = $1', [
      payload.sub,
    ]);
    const user = result.rows[0];
    if (!user) {
      throw new AppError(401, 'User not found');
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role } as JwtPayload,
      env.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    return { accessToken };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid or expired refresh token');
  }
}
