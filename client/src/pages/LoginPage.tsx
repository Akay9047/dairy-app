import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
      toast.success("Welcome! Dairy mein aapka swagat hai 🐄");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Username ya password galat hai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐄</div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Dairy Solution</h1>
          <p className="text-brand-600 font-medium mt-1">Aapki Apni Digital Dairy</p>
          <p className="text-gray-500 text-sm mt-1">Rajasthan Dairy Management</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Admin Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input className="input-field" placeholder="admin" value={username}
                onChange={e => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Please wait..." : "Login Karein →"}
            </button>
          </form>
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link to="/super/login" className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
              Super Admin? Yahan login karein →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
