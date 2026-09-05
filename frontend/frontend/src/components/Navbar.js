import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav className="glass-navbar sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-white">
          Smart Attendance
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-white">
            <span>{user.name} ({user.role})</span>
            <button
              onClick={handleLogout}
              className="bg-red-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;