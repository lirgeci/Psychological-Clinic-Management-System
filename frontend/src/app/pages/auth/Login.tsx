import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ActivityIcon } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_ROUTES: Record<number, string> = {
  1: '/admin',
  2: '/therapist',
  3: '/patient',
};

const decodeJwt = (token: string) => {
  try {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { users, setCurrentUser } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string)?.replace(/\/$/, '');
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed.');
        return;
      }

      document.cookie = `token=${data.token}; path=/`;

      const claims = decodeJwt(data.token);
      if (!claims) {
        setError('Invalid token received.');
        return;
      }

      const role = claims.roleId === 1 ? 'admin' : claims.roleId === 2 ? 'therapist' : 'patient';
      const roleUser = users.find((user) => user.role === role) || null;

      // Keep protected routes working and preserve existing mock-data dashboards for role pages.
      setCurrentUser(
        roleUser || {
          id: String(claims.userId ?? ''),
          email,
          role,
          firstName: '',
          lastName: '',
          phone: '',
        }
      );

      toast.success('Welcome back!');

      const route = ROLE_ROUTES[claims.roleId];
      if (route) {
        navigate(route);
        return;
      }

      setError('Unknown role. Contact administrator.');
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <ActivityIcon className="mx-auto h-12 w-12 text-blue-600" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">MindCare Clinic</h2>
        <p className="mt-2 text-center text-sm text-slate-600">Sign in to your account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}