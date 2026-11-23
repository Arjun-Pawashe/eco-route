import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock } from 'lucide-react';
import API from '../services/api';

function Login() {
    const navigate = useNavigate();

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
            const response = await API.post('/auth/login', formData);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message || 'Login failed. Please try again.'
            );
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

                    <h1 className="text-3xl font-bold text-green-800">
                        EcoRoute
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Smarter Routes. Greener Future.
                    </p>
                </div>

                <h2 className="text-2xl font-semibold mb-2">
                    Welcome Back!
                </h2>

                <p className="text-gray-500 mb-6">
                    Login to continue your journey.
                </p>

                {error && (
                    <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

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
                        <label className="block mb-2 text-sm font-medium">
                            Password
                        </label>

                        <div className="flex items-center border rounded-lg px-3">
                            <Lock size={18} className="text-gray-400" />

                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full p-3 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 transition disabled:opacity-60"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                </form>

                <p className="text-center mt-6 text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-green-700 font-semibold">
                        Register
                    </Link>
                </p>

            </div>
        </div>
    );
}

export default Login;
