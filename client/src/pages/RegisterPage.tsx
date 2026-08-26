import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/ToastProvider';
import './Auth.css';

export default function RegisterPage() {
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
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
      const res = await api.post('/auth/register', {
        rollNo,
        name,
        email,
        password,
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome to IIT-G Sports, ${user.name}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page flex-center">
      <div className="auth-card card animate-scale-in">
        <div className="text-center mb-4">
          <div className="auth-logo">🏆</div>
          <h2 className="text-2xl font-bold mt-2">Join IIT-G Sports</h2>
          <p className="text-secondary text-sm">Register with your IIT Guwahati credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group mb-3">
            <label className="input-label">Roll Number</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 220101050"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-3">
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Rohan Das"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group mb-3">
            <label className="input-label">IIT-G Webmail Email</label>
            <input
              type="email"
              className="input"
              placeholder="e.g. rohan@iitg.ac.in"
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-3 text-sm text-secondary">
          Already registered?{' '}
          <Link to="/login" className="text-accent font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
