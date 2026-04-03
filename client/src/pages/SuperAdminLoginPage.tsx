import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

export default function SuperAdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { superLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await superLogin(username, password);
      navigate("/super/dashboard");
      toast.success("Super Admin dashboard mein aapka swagat hai! 🏆");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Galat credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-purple-600 font-medium mt-1">Dairy Management System</p>
          <p className="text-gray-500 text-sm mt-1">Manage all dairies from here</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Super Admin Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input className="input-field" placeholder="superadmin" value={username}
                onChange={e => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="input-field" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
              {loading ? "Please wait..." : "Login Karein →"}
            </button>
          </form>
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link to="/login" className="text-xs text-gray-400 hover:text-purple-600 transition-colors">
              ← Admin login par wapas jaayein
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
