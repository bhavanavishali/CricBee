import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Trophy, Radio, LogIn, UserPlus } from 'lucide-react';

const PublicHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) return null;

  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      // If on home page, scroll to section
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80; // Account for sticky header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 50);
    } else {
      // If on other page, navigate to home and then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80; // Account for sticky header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  };

  const handleTournamentsClick = (e) => {
    e.preventDefault();
    scrollToSection('tournaments');
  };

  const handleLiveScoresClick = (e) => {
    e.preventDefault();
    scrollToSection('scores');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-blue-600" />
              <img
    src="/Image (1).png"
    alt="CricB Logo"
    className="h-12 w-auto object-contain hover:opacity-100 transition-opacity"
  />
            </Link>
            
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              <Link
                to="/"
                className={`flex items-center gap-2 font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'text-teal-600' 
                    : 'text-gray-900 hover:text-teal-600'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <a
                href="#tournaments"
                onClick={handleTournamentsClick}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  location.pathname.startsWith('/tournaments') 
                    ? 'text-teal-600' 
                    : 'text-gray-900 hover:text-teal-600'
                }`}
              >
                <Trophy className="h-5 w-5" />
                <span>Tournaments</span>
              </a>
              <a
                href="#scores"
                onClick={handleLiveScoresClick}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  location.pathname === '/live-matches' 
                    ? 'text-teal-600' 
                    : 'text-gray-900 hover:text-teal-600'
                }`}
              >
                <Radio className="h-5 w-5" />
                <span>Live Scores</span>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/signin')}
              className="px-6 py-2.5 border-2 border-teal-600 bg-white text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;

