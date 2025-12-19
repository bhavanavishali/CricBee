"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Trophy, 
  Users, 
  UserCheck, 
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  MessageCircle,
  Gift,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Radio
} from "lucide-react"
import { getPublicTournaments, getLiveMatches } from "@/api/public"

export default function Home() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [liveMatches, setLiveMatches] = useState([])
  const [loadingTournaments, setLoadingTournaments] = useState(true)
  const [loadingLiveMatches, setLoadingLiveMatches] = useState(true)

  useEffect(() => {
    loadTournaments()
    loadLiveMatches()
    // Refresh live matches every 5 seconds
    const interval = setInterval(loadLiveMatches, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadTournaments = async () => {
    try {
      setLoadingTournaments(true)
      // Get ongoing and upcoming tournaments
      const data = await getPublicTournaments()
      // Filter to show only ongoing and upcoming, limit to 4
      const filtered = data
        .filter(t => t.status_badge === 'ongoing' || t.status_badge === 'upcoming')
        .slice(0, 4)
      setTournaments(filtered)
    } catch (error) {
      console.error('Failed to load tournaments:', error)
    } finally {
      setLoadingTournaments(false)
    }
  }

  const loadLiveMatches = async () => {
    try {
      setLoadingLiveMatches(true)
      const data = await getLiveMatches()
      setLiveMatches(data)
    } catch (error) {
      console.error('Failed to load live matches:', error)
    } finally {
      setLoadingLiveMatches(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      {/* <header className="sticky top-0 z-50 w-full bg-slate-900 text-white shadow-lg">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white text-slate-900 px-3 py-2 rounded font-bold text-sm">CB</div>
            <span className="font-semibold text-lg">CricB</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#home" className="hover:text-teal-400 transition-colors">Home</a>
            <a href="#tournaments" className="hover:text-teal-400 transition-colors">Tournaments</a>
            <a href="#scores" className="hover:text-teal-400 transition-colors">Live Scores</a>
            <a href="#clubs" className="hover:text-teal-400 transition-colors">Clubs</a>
            <a href="#players" className="hover:text-teal-400 transition-colors">Players</a>
            <a href="#about" className="hover:text-teal-400 transition-colors">About</a>
            <a href="#contact" className="hover:text-teal-400 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#how-it-works" className="text-sm hover:text-teal-400 transition-colors">
              How it works
            </a>
            <button
              onClick={() => navigate("/signin")}
              className="px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </header> */}
      {/* Hero Section */}
      <section 
        id="home" 
        className="relative bg-gradient-to-br from-slate-500 via-slate-100 to-slate-900 text-white py-20 overflow-hidden"
        style={{
          backgroundImage: 'url("/OIP.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
            Your Digital Cricket
          </h1>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Cricket stadium wide hero image
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Complete cricket ecosystem with live scoring, streaming, tournament management, and fan engagement for the grassroots cricket community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
            >
              Register Tournament
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Join as Club Manager
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              Start a Score
            </button>
          </div>
        </div>
      </section>

      {/* Choose Your Role Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
            <p className="text-lg text-gray-600">
              Join the CricB community and start your cricket journey today
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Organizer Card */}
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Organizer</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Host tournaments & manage registrations with ease.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Live scoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Tournament setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Match scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Participant management</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/signup")}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Club Manager Card */}
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Club Manager</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Manage clubs, teams and members effortlessly.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Roster management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Team communication</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Payment tracking</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/signup")}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Player Card */}
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <UserCheck className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Player</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Register, get stats and showcase your skills.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span>Player profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span>Performance tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600" />
                  <span>Team invites</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/signup")}
                className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Fan Card */}
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900">Fan</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Watch matches, support teams and engage.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>Live streams</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>Live chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>Gifts & badges</span>
                </li>
              </ul>
              <button
                onClick={() => navigate("/signup")}
                className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CricB by the Numbers */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">CricB by the Numbers</h2>
            <p className="text-lg text-gray-600">
              Growing the cricket community across India
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-teal-600 mb-2">1,250</div>
              <p className="text-gray-600 font-medium">Total Tournaments Hosted</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">450</div>
              <p className="text-gray-600 font-medium">Total Clubs Registered</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">15,000</div>
              <p className="text-gray-600 font-medium">Total Players with CricB</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">24+</div>
              <p className="text-gray-600 font-medium">Live Matches / Week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active & Upcoming Tournaments */}
      <section id="tournaments" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Active & Upcoming Tournaments</h2>
            <p className="text-lg text-gray-600">
              Discover exciting cricket tournaments happening near you
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              All Status
            </button>
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              All Locations
            </button>
          </div>

          {loadingTournaments ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No active tournaments at the moment</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {tournaments.map((tournament) => (
                <div 
                  key={tournament.id} 
                  className="bg-slate-900 rounded-xl overflow-hidden text-white hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="p-5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                      tournament.status_badge === 'ongoing' ? 'bg-red-500' : 
                      tournament.status_badge === 'upcoming' ? 'bg-blue-500' : 
                      'bg-gray-500'
                    }`}>
                      {tournament.status_badge.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-lg mb-2">{tournament.tournament_name}</h3>
                    <div className="space-y-1 text-sm text-gray-300 mb-4">
                      {tournament.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {tournament.location}
                        </p>
                      )}
                      {tournament.start_date && (
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Starts: {formatDate(tournament.start_date)}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/tournaments/${tournament.id}`)
                      }}
                      className="w-full py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <button 
              onClick={() => navigate('/tournaments')}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              View All Tournaments
            </button>
          </div>
        </div>
      </section>

      {/* Organizers Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-50 to-slate-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white md:text-gray-900">
            <h2 className="text-4xl font-bold mb-4">Organizers, Host Your Cricket Tournament on CricB!</h2>
            <p className="text-lg mb-6 opacity-90">
              Everything you need to create, manage, and monetize successful cricket tournaments with our comprehensive platform.
            </p>
            <ul className="space-y-3 mb-8">
              {["Live Scoring & Streaming", "Player Registration & Teams", "Automated Fixture Management", "Fan Engagement Tools"].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              Create Your Tournament
            </button>
          </div>
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <div className="text-6xl font-bold text-white mb-2">1,750+</div>
            <p className="text-xl text-gray-300">Tournaments Hosted</p>
          </div>
        </div>
      </section>

      {/* Easily Manage Clubs & Teams */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-slate-900 rounded-xl h-96 flex items-center justify-center">
            <Users className="w-32 h-32 text-gray-400" />
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Easily Manage Clubs & Teams</h2>
            <p className="text-lg text-gray-600 mb-6">
              Streamline your club operations with powerful tools for team management, tournament enrollment, and fan engagement.
            </p>
            <ul className="space-y-3 mb-8">
              {["Enroll in Tournaments", "Manage Teams & Rosters", "Schedule Practice Sessions", "Wallet Management"].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Read More
            </button>
          </div>
        </div>
      </section>

      {/* Players Section */}
      <section className="py-20 px-6 bg-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Players, Showcase Your Cricketing Journey</h2>
            <p className="text-lg text-gray-600">
              Get verified, track your performance, and connect with teams across India with your unique CricB Player ID.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-6">
              {[
                { title: "Activate KYC Verification", desc: "Verify identity to increase selection chances." },
                { title: "Unique CricB Player ID", desc: "Get a universal player profile across CricB." },
                { title: "Join Teams & Clubs", desc: "Connect with clubs to participate in tournaments." },
                { title: "Track Performance Stats", desc: "Match-by-match analytics for improvement." },
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-600">RK</span>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">Rohit Kumar</h3>
                  <p className="text-gray-600">Player Profile</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Matches</p>
                  <p className="text-2xl font-bold text-gray-900">1,240</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Runs</p>
                  <p className="text-2xl font-bold text-gray-900">9,540</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wickets</p>
                  <p className="text-2xl font-bold text-gray-900">152</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Strike Rate</p>
                  <p className="text-2xl font-bold text-gray-900">142.3</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/signup")}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Sign Up as Player
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Fan Experience Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">The Ultimate Cricket Fan Experience</h2>
          <p className="text-lg text-gray-600 mb-12">
            Follow your favorite teams, watch live matches, chat with fellow fans, and support teams with digital gifts.
          </p>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {[
              { icon: TrendingUp, label: "Live Scores" },
              { icon: Play, label: "Watch Streams" },
              { icon: MessageCircle, label: "Live Chat" },
              { icon: Gift, label: "Send Gifts" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-900">{item.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
          >
            Start Watching
          </button>
        </div>
      </section>

      {/* Live Match Section */}
      <section id="scores" className="py-20 px-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto">
          {loadingLiveMatches ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="mt-4 opacity-90">Loading live matches...</p>
            </div>
          ) : liveMatches.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <Radio className="mx-auto h-16 w-16 opacity-50 mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold mb-2">No Live Matches</h2>
              <p className="text-xl mb-6 opacity-90">Check back later for live action!</p>
              <button 
                onClick={() => navigate('/tournaments')}
                className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors shadow-lg"
              >
                View Tournaments
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {liveMatches.slice(0, 3).map((match) => (
                <div 
                  key={match.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 cursor-pointer hover:bg-white/15 transition-colors"
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1 bg-red-600 rounded-full text-sm font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                    {match.tournament_name && (
                      <span className="text-sm opacity-90">{match.tournament_name}</span>
                    )}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    {match.team_a_name} vs {match.team_b_name}
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-2xl font-bold">{match.score || '0/0'}</span>
                    <span className="text-lg opacity-90">
                      ({match.overs ? (typeof match.overs === 'number' ? match.overs.toFixed(1) : match.overs) : '0.0'} overs)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-6 mb-8 text-sm">
                    {match.match_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span>Time: {match.match_time}</span>
                      </div>
                    )}
                    {match.ground && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span>Venue: {match.ground}</span>
                      </div>
                    )}
                    {match.match_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>{formatDate(match.match_date)}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/matches/${match.id}`)
                    }}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Watch Now
                  </button>
                </div>
              ))}
              {liveMatches.length > 3 && (
                <div className="text-center">
                  <button 
                    onClick={() => navigate('/live-matches')}
                    className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors"
                  >
                    View All Live Matches ({liveMatches.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Latest Cricket Updates */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest Cricket Updates</h2>
            <p className="text-lg text-gray-600">
              Stay updated with the cricket community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              "Organizer X announced Summer Cup 2025",
              "Arook Bats wins Winter League Final",
              "New Player PKC Verified",
            ].map((update, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-gray-700 font-medium">{update}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2 mx-auto">
              Go to News Feed
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white text-slate-900 px-3 py-2 rounded font-bold">CB</div>
                <span className="font-semibold text-lg">CricB</span>
              </div>
              <p className="text-gray-400 text-sm">
                A live-one digital platform for scoring, streaming and managing grassroots cricket across India.
              </p>
              <div className="flex gap-3 mt-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#tournaments" className="hover:text-white transition-colors">Tournaments</a></li>
                <li><a href="#scores" className="hover:text-white transition-colors">Live Scores</a></li>
                <li><a href="#clubs" className="hover:text-white transition-colors">Clubs</a></li>
                <li><a href="#players" className="hover:text-white transition-colors">Players</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 CricB. All rights reserved. Empowering cricket communities across India.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}