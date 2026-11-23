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
      navigate('/dashboard');
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
      navigate('/dashboard');
    } catch (err) {
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <Leaf size={32} className="text-green-700" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-green-800">EcoRoute</h1>

          <p className="text-gray-500 mt-2">Start your greener journey.</p>
        </div>

        <h2 className="text-2xl font-semibold mb-2">Create Account</h2>

        <p className="text-gray-500 mb-6">Join EcoRoute today.</p>

        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium">Full Name</label>

            <div className="flex items-center border rounded-lg px-3">
              <User size={18} className="text-gray-400" />

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Email Address
            </label>

            <div className="flex items-center border rounded-lg px-3">
              <Mail size={18} className="text-gray-400" />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Password</label>

            <div className="flex items-center border rounded-lg px-3">
              <Lock size={18} className="text-gray-400" />

              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full p-3 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-slate-50 transition disabled:opacity-60 font-medium"
          >
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-green-700 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;