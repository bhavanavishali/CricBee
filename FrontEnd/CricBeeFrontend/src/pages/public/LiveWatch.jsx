import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Send } from 'lucide-react';
import { useSelector } from 'react-redux';
import Layout from '@/components/layouts/Layout';
import { getPublicScoreboard } from '@/api/public';
import { getPublicTournamentDetails } from '@/api/public';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { getChatMessages, sendChatMessage } from '@/api/chat';

const LiveWatch = () => {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id;
  const [scoreboard, setScoreboard] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [watchingCount, setWatchingCount] = useState(1197);
  const chatEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  // Get user from Redux store
  const user = useSelector((state) => state.auth.user);
  
  // Determine match ID from scoreboard or tournament
  const isTournamentRoute = window.location.pathname.includes('/watch-live/tournament/');
  const [matchId, setMatchId] = useState(() => {
    // For direct match routes, use the route id immediately
    if (!isTournamentRoute && id) {
      const parsedId = parseInt(id);
      return isNaN(parsedId) ? null : parsedId;
    }
    return null;
  });
  
  // Update matchId when scoreboard or tournament data loads
  useEffect(() => {
    if (isTournamentRoute) {
      // For tournament routes, find the live match
      const liveMatch = tournament?.matches?.find(m => m.status === 'live' || m.status_badge === 'live');
      const newMatchId = scoreboard?.match_id || liveMatch?.id;
      if (newMatchId && newMatchId !== matchId) {
        console.log('Setting matchId from tournament route:', newMatchId);
        setMatchId(newMatchId);
      }
    } else {
      // For direct match routes, use the route id or scoreboard match_id
      const routeId = parseInt(id);
      const newMatchId = scoreboard?.match_id || (isNaN(routeId) ? null : routeId);
      if (newMatchId && newMatchId !== matchId) {
        console.log('Setting matchId from direct route:', newMatchId);
        setMatchId(newMatchId);
      }
    }
  }, [scoreboard?.match_id, tournament, id, isTournamentRoute, matchId]);
  
  // Use WebSocket hook for real-time chat
  const { messages: wsMessages, isConnected, sendMessage } = useChatWebSocket(matchId);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    // Check if route is /watch-live/tournament/:id or /watch-live/:id
    const isTournamentRoute = window.location.pathname.includes('/watch-live/tournament/');
    
    const loadData = async () => {
      try {
        setLoading(true);
        if (isTournamentRoute) {
          await loadTournamentData();
        } else {
          await loadScoreboard();
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Poll for live updates
    pollingIntervalRef.current = setInterval(() => {
      if (isTournamentRoute) {
        loadTournamentData();
      } else {
        loadScoreboard();
      }
    }, 3000); // Poll every 3 seconds

    // Simulate watching count updates
    const watchingInterval = setInterval(() => {
      setWatchingCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearInterval(watchingInterval);
    };
  }, [id]);

  // Load initial chat messages when matchId is available
  useEffect(() => {
    if (matchId && user) {
      getChatMessages(matchId)
        .then((messages) => {
          setChatMessages(messages);
        })
        .catch((error) => {
          console.error('Failed to load chat messages:', error);
        });
    }
  }, [matchId, user]);
  
  // Merge WebSocket messages with loaded messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      setChatMessages((prev) => {
        const merged = [...prev];
        wsMessages.forEach((wsMsg) => {
          if (!merged.find((m) => m.id === wsMsg.id)) {
            merged.push(wsMsg);
          }
        });
        // Sort by created_at
        return merged.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
      });
    }
  }, [wsMessages]);

  useEffect(() => {
    // Auto-scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);


  const loadScoreboard = async () => {
    try {
      const data = await getPublicScoreboard(id);
      setScoreboard(data);
    } catch (error) {
      console.error('Failed to load scoreboard:', error);
    }
  };

  const loadTournamentData = async () => {
    try {
      const data = await getPublicTournamentDetails(id);
      setTournament(data);
      // Find the first live match
      const liveMatch = data.matches?.find(m => m.status === 'live' || m.status_badge === 'live');
      if (liveMatch) {
        const scoreData = await getPublicScoreboard(liveMatch.id);
        setScoreboard(scoreData);
      }
    } catch (error) {
      console.error('Failed to load tournament:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      return;
    }
    
    if (!user) {
      alert('Please login to send messages');
      return;
    }

    // Try to get matchId from multiple sources if not already set
    let currentMatchId = matchId;
    if (!currentMatchId) {
      if (!isTournamentRoute && id) {
        currentMatchId = parseInt(id);
      } else if (scoreboard?.match_id) {
        currentMatchId = scoreboard.match_id;
      } else if (tournament?.matches) {
        const liveMatch = tournament.matches.find(m => m.status === 'live' || m.status_badge === 'live');
        currentMatchId = liveMatch?.id;
      }
    }

    if (!currentMatchId || isNaN(currentMatchId)) {
      console.error('Match ID not found:', { 
        matchId,
        currentMatchId,
        scoreboard: scoreboard?.match_id, 
        tournament: tournament?.matches,
        routeId: id
      });
      alert('Match not found. Please wait for the page to load completely.');
      return;
    }

    try {
      // Send via WebSocket if connected, otherwise fallback to REST API
      if (isConnected) {
        sendMessage(newMessage.trim());
      } else {
        // Fallback to REST API
        const response = await sendChatMessage(currentMatchId, newMessage.trim());
        setChatMessages((prev) => [...prev, response]);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const formatOvers = (overs) => {
    if (!overs) return '0.0';
    const overParts = overs.toString().split('.');
    return `${overParts[0]}.${overParts[1] || 0}`;
  };

  const calculateRunRate = (runs, overs) => {
    if (!runs || !overs || overs === 0) return '0.00';
    return (runs / overs).toFixed(2);
  };

  const calculateRequiredRunRate = () => {
    if (!scoreboard) return '0.00';
    const target = scoreboard.target || 0;
    const currentRuns = scoreboard.batting_score?.runs || 0;
    const remainingRuns = target - currentRuns;
    const remainingOvers = scoreboard.total_overs - (scoreboard.batting_score?.overs || 0);
    if (remainingOvers <= 0) return '0.00';
    return (remainingRuns / remainingOvers).toFixed(2);
  };

  const calculateProgress = () => {
    if (!scoreboard) return 0;
    const totalOvers = scoreboard.total_overs || 20;
    const currentOvers = scoreboard.batting_score?.overs || 0;
    return totalOvers > 0 ? Math.round((currentOvers / totalOvers) * 100) : 0;
  };


  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Loading live stream...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const matchInfo = scoreboard || tournament;
  const isLive = scoreboard?.match_status === 'live' || tournament?.status_badge === 'ongoing';

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 mb-3 text-white/90 hover:text-white transition"
            >
              <ArrowLeft size={18} />
              <span>Back to Tournaments</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isLive && (
                    <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      LIVE
                    </span>
                  )}
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    T20 Match
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {scoreboard ? `${scoreboard.batting_team_name} vs ${scoreboard.bowling_team_name}` : 
                   tournament ? tournament.tournament_name : 'Live Match'}
                </h1>
                {scoreboard && (
                  <p className="text-white/90">
                    {scoreboard.innings_number === 2 
                      ? `2nd Innings - ${scoreboard.batting_team_name} need ${(scoreboard.target || 0) - (scoreboard.batting_score?.runs || 0)} runs in ${Math.ceil((scoreboard.total_overs - (scoreboard.batting_score?.overs || 0)) * 6)} balls`
                      : `1st Innings - ${scoreboard.batting_team_name} batting`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Users size={20} />
                <span className="font-semibold">{watchingCount.toLocaleString()} watching</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Video and Scoreboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* YouTube Live Stream */}
              <div className="bg-black rounded-lg overflow-hidden relative mx-auto" style={{ aspectRatio: '16/9', maxWidth: '800px', maxHeight: '450px' }}>
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  {isLive && (
                    <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                  <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    HD Stream
                  </span>
                </div>
                
                {/* YouTube iframe */}
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/AFEZzf9_EHk?autoplay=1&mute=1"
                  title="Live Cricket Stream"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                
                <div className="absolute bottom-4 left-4 text-white text-sm">
                  Now Playing {scoreboard ? `${scoreboard.batting_team_name} vs ${scoreboard.bowling_team_name}` : 'Live Cricket Match'}
                </div>
              </div>

              {/* Live Score Section */}
              {scoreboard && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Live Score</h2>
                    {isLive && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  
                  {scoreboard.innings_number === 2 && (
                    <p className="text-gray-700 mb-4">
                      {scoreboard.batting_team_name} need {(scoreboard.target || 0) - (scoreboard.batting_score?.runs || 0)} runs in {Math.ceil((scoreboard.total_overs - (scoreboard.batting_score?.overs || 0)) * 6)} balls
                    </p>
                  )}

                  {/* Batting Team Scorecard */}
                  <div className="border border-gray-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{scoreboard.batting_team_name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Overs</span>
                        <p className="font-semibold text-gray-900">{formatOvers(scoreboard.batting_score?.overs || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Score</span>
                        <p className="font-semibold text-gray-900">
                          {scoreboard.batting_score?.runs || 0}/{scoreboard.batting_score?.wickets || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Run Rate</span>
                        <p className="font-semibold text-gray-900">
                          RR: {calculateRunRate(scoreboard.batting_score?.runs, scoreboard.batting_score?.overs)}
                        </p>
                      </div>
                      {scoreboard.innings_number === 2 && (
                        <div>
                          <span className="text-gray-600">Required RR</span>
                          <p className="font-semibold text-gray-900">
                            {calculateRequiredRunRate()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bowling Team Scorecard (if first innings completed) */}
                  {scoreboard.innings_number === 2 && scoreboard.bowling_score && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{scoreboard.bowling_team_name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Overs</span>
                          <p className="font-semibold text-gray-900">{formatOvers(scoreboard.bowling_score?.overs || 0)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Score</span>
                          <p className="font-semibold text-gray-900">
                            {scoreboard.bowling_score?.runs || 0}/{scoreboard.bowling_score?.wickets || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Run Rate</span>
                          <p className="font-semibold text-gray-900">
                            RR: {calculateRunRate(scoreboard.bowling_score?.runs, scoreboard.bowling_score?.overs)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Chat and Stats */}
            <div className="space-y-6">
              {/* Live Chat */}
              <div className="bg-white rounded-lg shadow-sm flex flex-col" style={{ height: '500px' }}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <h2 className="text-lg font-bold text-gray-900">Live Chat</h2>
                  </div>
                  {!user && (
                    <span className="text-xs text-gray-500">Login to chat</span>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {!matchId ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      <p className="font-semibold mb-2">Match not found</p>
                      <p className="text-xs">Please wait for the match to load.</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No messages yet. Be the first to chat!
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-600 font-semibold text-xs">
                            {message.user_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900">
                              {message.user_name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{message.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={user ? "Type a message..." : "Please login to send messages"}
                      disabled={!user || !matchId}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!user || !newMessage.trim() || !matchId}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                      Send
                    </button>
                  </div>
                </form>
              </div>

              {/* Match Stats */}
              {scoreboard && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Match Stats</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Match Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{calculateProgress()}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${calculateProgress()}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Boundaries</span>
                        <span className="font-semibold text-gray-900">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Sixes</span>
                        <span className="font-semibold text-gray-900">7</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Extras</span>
                        <span className="font-semibold text-gray-900">12</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveWatch;

