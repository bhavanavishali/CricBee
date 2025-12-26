import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Trophy, Users, DollarSign, 
  CheckCircle, Star, Play, ExternalLink,
  Target, Award, User as UserIcon
} from 'lucide-react';
import { getPublicTournamentDetails } from '@/api/public';
import Layout from '@/components/layouts/Layout';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTournamentDetails();
  }, [id]);

  const loadTournamentDetails = async () => {
    try {
      setLoading(true);
      const data = await getPublicTournamentDetails(id);
      setTournament(data);
    } catch (error) {
      console.error('Failed to load tournament details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!tournament) return { text: 'Upcoming', color: 'bg-purple-600' };
    
    const status = tournament.status_badge || tournament.status;
    if (status === 'ongoing' || status === 'tournament_start') {
      return { text: 'Live', color: 'bg-red-500' };
    }
    if (status === 'upcoming' || status === 'registration_open' || status === 'registration_end') {
      return { text: 'Upcoming', color: 'bg-purple-600' };
    }
    if (status === 'completed' || status === 'tournament_end') {
      return { text: 'Completed', color: 'bg-gray-600' };
    }
    return { text: 'Upcoming', color: 'bg-purple-600' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const getRegistrationStatus = () => {
    if (!tournament) return 'closed';
    const status = tournament.status;
    if (status === 'registration_open') return 'open';
    if (status === 'registration_end') return 'closed';
    return 'closed';
  };

  const calculateProgress = () => {
    if (!tournament || !tournament.matches) return 0;
    const totalMatches = tournament.matches.length;
    const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
    return totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600">Loading tournament details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Tournament not found</p>
            <button
              onClick={() => navigate('/fans/dashboard')}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const statusBadge = getStatusBadge();
  const registrationStatus = getRegistrationStatus();
  const progress = calculateProgress();
  const completedMatches = tournament.matches?.filter(m => m.status === 'completed').length || 0;
  const totalMatches = tournament.matches?.length || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <button
              onClick={() => navigate('/fans/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft size={18} className="mr-2" />
              <span>Back to Tournaments</span>
            </button>
            <div className="text-sm text-gray-500">
              Tournaments &gt; {tournament.tournament_name}
            </div>
          </div>
        </div>

        {/* Hero Section with Blurred Background */}
        <div 
          className="relative h-96 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80)',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
          
          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-6 h-full flex flex-col">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`${statusBadge.color} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                ● {statusBadge.text}
              </span>
              <span className="bg-cyan-400 text-white text-xs font-semibold px-3 py-1 rounded-full">
                T20
              </span>
              {tournament.matches && tournament.matches.length > 0 && (
                <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {tournament.matches[0]?.round_name || 'Group Stage'}
                </span>
              )}
            </div>

            <div className="flex-1 flex items-end justify-between">
              {/* Left Side - Tournament Info */}
              <div className="flex-1 text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{tournament.tournament_name}</h1>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <UserIcon size={18} />
                    </div>
                    <span className="text-lg">{tournament.organizer_name || 'Tournament Organizer'}</span>
                    {tournament.is_verified && (
                      <CheckCircle size={20} className="text-blue-400" />
                    )}
                  </div>
                  
                  {tournament.location && (
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin size={18} />
                      <span>{tournament.location}</span>
                    </div>
                  )}
                  
                  {tournament.team_range && (
                    <div className="flex items-center gap-2 text-white/90">
                      <Users size={18} />
                      <span>{tournament.team_range} teams</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-6">
                  <button 
                    disabled
                    className="px-4 py-2 bg-gray-600/50 text-white rounded-lg font-semibold cursor-not-allowed"
                  >
                    Registration {registrationStatus === 'open' ? 'Open' : 'Closed'}
                  </button>
                  <button 
                    onClick={() => {
                      // Find the first live match or use tournament ID
                      const liveMatch = tournament.matches?.find(m => m.status === 'live' || m.status_badge === 'live');
                      if (liveMatch) {
                        navigate(`/watch-live/${liveMatch.id}`);
                      } else {
                        navigate(`/watch-live/tournament/${id}`);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700 transition"
                  >
                    <Play size={18} />
                    Watch Live
                  </button>
                </div>
              </div>

              {/* Right Side - Stats Cards */}
              <div className="ml-8 space-y-4">
                {/* Tournament Stats */}
                <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 text-white min-w-[200px]">
                  <h3 className="font-semibold mb-3">Tournament Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div>1250 Followers</div>
                    <div>340 Watching</div>
                    <div className="flex items-center gap-1">
                      <Trophy size={16} />
                      <span>₹2,00,000 Prize Pool</span>
                    </div>
                    <div>{statusBadge.text === 'Live' ? '1 Live Now' : '0 Live'}</div>
                  </div>
                </div>

                {/* Tournament Progress */}
                <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 text-white min-w-[200px]">
                  <h3 className="font-semibold mb-3">Tournament Progress</h3>
                  <div className="space-y-2">
                    <div className="text-sm">Matches Completed {completedMatches}/{totalMatches}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                {['overview', 'clubs', 'fixtures', 'players', 'live', 'fans'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-teal-600 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Tournament */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About Tournament</h2>
                <p className="text-gray-700 leading-relaxed">
                  The biggest T20 cricket tournament featuring the best local talent from Kerala and beyond. 
                  Join us for an exciting season of cricket with live streaming, real-time scoring, and fan engagement.
                </p>
              </div>

              {/* Tournament Format */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournament Format</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Trophy className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">T20 Format</h3>
                        <p className="text-sm text-gray-600">{tournament.team_range || '16 teams'} tournament</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">4 Rounds</h3>
                        <p className="text-sm text-gray-600">Group Stage, Quarter Finals, Semi Finals, Final</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Rules */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournament Rules</h2>
                <ul className="space-y-3">
                  {[
                    'All matches will be played under T20 format',
                    'Each team can have maximum 15 players',
                    'Powerplay overs: 1-6',
                    'Maximum 4 overseas players per team',
                    'DRS available for semifinals and finals'
                  ].map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20} />
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Tournament Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tournament Info</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm">Start Date {formatDate(tournament.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm">End Date {formatDate(tournament.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users size={18} className="text-gray-400" />
                    <span className="text-sm">Teams {tournament.team_range || 'N/A'}</span>
                  </div>
                  {tournament.enrollment_fee > 0 && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign size={18} className="text-gray-400" />
                      <span className="text-sm">Entry Fee ₹{tournament.enrollment_fee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prize Distribution */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Prize Distribution</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Winner</span>
                    <span className="font-semibold text-gray-900">₹1,00,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Runner-up</span>
                    <span className="font-semibold text-gray-900">₹50,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Semi-finalist</span>
                    <span className="font-semibold text-gray-900">₹25,000 each</span>
                  </div>
                </div>
              </div>

              {/* Organizer */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Organizer</h2>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <UserIcon className="text-teal-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{tournament.organizer_name || 'Tournament Organizer'}</span>
                      {tournament.is_verified && (
                        <CheckCircle size={18} className="text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Est. 2010</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Premier cricket organizing body with 10+ years of experience in grassroots cricket.
                </p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>15 Tournaments</span>
                  <span>2300 Followers</span>
                </div>
                <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition flex items-center justify-center gap-2">
                  View Profile
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TournamentDetail;
