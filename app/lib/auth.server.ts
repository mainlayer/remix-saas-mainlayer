import { createCookieSessionStorage, redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// In production replace with a real database (Prisma, Drizzle, etc.)
const users: Map<string, User & { passwordHash: string }> = new Map();

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET ?? 'dev-secret-change-in-production'],
    secure: process.env.NODE_ENV === 'production',
  },
});

export async function createUser(
  email: string,
  name: string,
  password: string,
): Promise<User> {
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User & { passwordHash: string } = {
    id,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.set(id, user);
  return { id, email, name, createdAt: user.createdAt };
}

export async function verifyLogin(
  email: string,
  password: string,
): Promise<User | null> {
  const user = [...users.values()].find((u) => u.email === email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function createUserSession(
  request: Request,
  userId: string,
  redirectTo: string,
): Promise<Response> {
  const session = await sessionStorage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }),
    },
  });
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return session.get('userId') ?? null;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = '/login',
): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) throw redirect(redirectTo);
  return userId;
}

export async function getUser(request: Request): Promise<User | null> {
  const userId = await getUserId(request);
  if (!userId) return null;
  const user = users.get(userId);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function logout(request: Request): Promise<Response> {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
