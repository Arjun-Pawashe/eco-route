import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getRegisterErrorMessage(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    default:
      return err?.message || 'Registration failed.';
  }
}

function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
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
      await register(formData.name, formData.email, formData.password);
      navigate('/route-planner');
    } catch (err) {
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/route-planner');
    } catch (err) {
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-10">
      <div className="bg-white w-full max-w-md p-8 sm:p-10 rounded-2xl border border-[#DADCE0] shadow-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-[#E6F4EA] border border-[#CEEAD6] p-3 rounded-full">
              <Leaf size={26} className="text-[#188038]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#202124]">
            Eco<span className="text-[#1A73E8]">Route</span>
          </h1>

          <p className="text-[#5F6368] mt-1.5 text-sm">
            Create your account to track greener journeys.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-[#202124] mb-1">Create Account</h2>
        <p className="text-[#5F6368] text-sm mb-6">Join EcoRoute today.</p>

        {error && (
          <p className="bg-[#FCE8E6] text-[#C5221F] text-sm font-medium p-3 rounded-xl mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#3C4043]">
              Full Name
            </label>
            <div className="flex items-center bg-[#F8F9FA] border border-[#DADCE0] rounded-xl px-3.5 focus-within:border-[#1A73E8] focus-within:bg-white transition">
              <User size={17} className="text-[#5F6368]" />
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-3 bg-transparent text-sm text-[#202124] placeholder-[#80868B] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#3C4043]">
              Email Address
            </label>
            <div className="flex items-center bg-[#F8F9FA] border border-[#DADCE0] rounded-xl px-3.5 focus-within:border-[#1A73E8] focus-within:bg-white transition">
              <Mail size={17} className="text-[#5F6368]" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 bg-transparent text-sm text-[#202124] placeholder-[#80868B] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-medium text-[#3C4043]">
              Password
            </label>
            <div className="flex items-center bg-[#F8F9FA] border border-[#DADCE0] rounded-xl px-3.5 focus-within:border-[#1A73E8] focus-within:bg-white transition">
              <Lock size={17} className="text-[#5F6368]" />
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full p-3 bg-transparent text-sm text-[#202124] placeholder-[#80868B] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A73E8] text-white font-semibold py-2.5 rounded-full hover:bg-[#1765CC] transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full bg-white border border-[#DADCE0] text-[#3C4043] py-2.5 rounded-full hover:bg-[#F8F9FA] transition disabled:opacity-60 font-medium text-sm cursor-pointer"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-[#5F6368]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1A73E8] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;