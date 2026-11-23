import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getAuthErrorMessage(err) {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    default:
      return err?.message || 'Login failed. Please try again.';
  }
}

function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F3F7] px-4 py-10">
      <div className="bg-[#FFFFFF] w-full max-w-md p-8 sm:p-10 rounded-[20px] border-2 border-[#281950] shadow-[0_20px_60px_rgba(40,25,80,0.10)]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-[#E5E0FF] p-3 rounded-[12px]">
              <Leaf size={28} className="text-[#644DFF]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.02em] text-[#111018]">
            Eco<span className="text-[#644DFF]">Route</span>
          </h1>

          <p className="text-[#6E6B7B] mt-2 text-sm">Smarter Routes. Greener Future.</p>
        </div>

        <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#111018] mb-1">Welcome Back</h2>

        <p className="text-[#6E6B7B] text-sm mb-6">Login to continue your journey.</p>

        {error && (
          <p className="bg-[#FCE4E1] text-[#D94A38] text-sm font-medium p-3 rounded-[10px] mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-[#111018]">
              Email Address
            </label>

            <div className="flex items-center bg-[#ECEAF3] rounded-[10px] px-3.5 focus-within:ring-2 focus-within:ring-[#644DFF]">
              <Mail size={18} className="text-[#6E6B7B]" />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 bg-transparent text-[#111018] placeholder-[#9A96A6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-[#111018]">Password</label>

            <div className="flex items-center bg-[#ECEAF3] rounded-[10px] px-3.5 focus-within:ring-2 focus-within:ring-[#644DFF]">
              <Lock size={18} className="text-[#6E6B7B]" />

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 bg-transparent text-[#111018] placeholder-[#9A96A6] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#644DFF] text-white font-semibold py-3 rounded-[10px] hover:bg-[#533CE6] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-[1.5px] border-[#14121D] text-[#111018] py-3 rounded-[10px] hover:bg-[#F4F3F7] transition disabled:opacity-60 font-semibold cursor-pointer"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-[#6E6B7B]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#644DFF] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
