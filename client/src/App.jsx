import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RoutePlanner from './pages/RoutePlanner';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/route-planner" element={<RoutePlanner />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;