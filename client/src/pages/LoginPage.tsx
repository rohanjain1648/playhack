import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/ToastProvider';
import './Auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Student@123');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: demoEmail,
        password: demoEmail === 'admin@iitg.ac.in' ? 'Admin@123' : 'Student@123',
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Logged in as ${user.name}`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex-center">
      <div className="auth-card card animate-scale-in">
        <div className="text-center mb-4">
          <div className="auth-logo">🏆</div>
          <h2 className="text-2xl font-bold mt-2">Sign in to IIT-G Sports</h2>
          <p className="text-secondary text-sm">Access facilities, reservations, and waitlists</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group mb-3">
            <label className="input-label">IIT-G Email</label>
            <input
              type="email"
              className="input"
              placeholder="e.g. arjun@iitg.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-4">
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full mb-3" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts-box">
          <span className="demo-label">⚡ Quick Demo Accounts:</span>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline flex-1"
              onClick={() => handleDemoLogin('arjun@iitg.ac.in')}
            >
              👤 Student (Arjun)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline flex-1"
              onClick={() => handleDemoLogin('admin@iitg.ac.in')}
            >
              👑 Admin (Manager)
            </button>
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
