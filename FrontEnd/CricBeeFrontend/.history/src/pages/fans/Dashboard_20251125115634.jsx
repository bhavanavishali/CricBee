"use client"

import { useState } from "react"
import { Heart, MapPin, Calendar, Users, Trophy } from "lucide-react"
import Layout from '@/components/layouts/Layout'
const tournamentData = [
  {
    id: 1,
    name: "Mumbai Premier League 2024",
    organization: "Mumbai Cricket Association",
    location: "Mumbai, Maharashtra",
    date: "15/03/2024",
    teams: 8,
    prize: "₹50,00,000",
    views: 340,
    likes: 1250,
    status: "Live",
    badge: "T20",
    image: "linear-gradient(135deg, #10B981 0%, #8B5CF6 100%)",
  },
  {
    id: 2,
    name: "Delhi Corporate Cup",
    organization: "Corporate Cricket Delhi",
    location: "Delhi, India",
    date: "01/04/2024",
    teams: 12,
    prize: "₹1,00,000",
    views: 240,
    likes: 890,
    status: "Upcoming",
    badge: "ODI",
    image: "linear-gradient(135deg, #06B6D4 0%, #A855F7 100%)",
  },
  {
    id: 3,
    name: "Bangalore Tech Cricket League",
    organization: "Tech Sports Bangalore",
    location: "Bangalore, Karnataka",
    date: "10/05/2024",
    teams: 16,
    prize: "₹75,000",
    views: 520,
    likes: 2100,
    status: "Registration Open",
    badge: "T20",
    image: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
  },
  {
    id: 4,
    name: "Chennai Summer Championship",
    organization: "Chennai Cricket Club",
    location: "Chennai, Tamil Nadu",
    date: "01/02/2024",
    teams: 6,
    prize: "₹30,000",
    views: 180,
    likes: 560,
    status: "Completed",
    badge: "Test",
    image: "linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)",
  },
]

function TournamentCard({ tournament, isFavorite, onFavoriteToggle }) {
  const statusColor = {
    Live: "bg-red-500",
    Upcoming: "bg-purple-600",
    "Registration Open": "bg-green-500",
    Completed: "bg-gray-600",
  }

  const badgeColor = {
    T20: "bg-cyan-400",
    ODI: "bg-purple-500",
    Test: "bg-green-500",
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div
        className="h-32 relative"
        style={{
          background: tournament.image,
        }}
      >
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${statusColor[tournament.status]} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
            ● {tournament.status}
          </span>
          <span className={`${badgeColor[tournament.badge]} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
            {tournament.badge}
          </span>
        </div>
        <button
          onClick={() => onFavoriteToggle(tournament.id)}
          className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 transition"
        >
          <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"} />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1">{tournament.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{tournament.organization}</p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            <span>{tournament.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-gray-400" />
            <span>{tournament.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} className="text-gray-400" />
            <span>{tournament.teams} teams</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Trophy size={16} className="text-gray-400" />
            <span>{tournament.prize}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>👁️ {tournament.views}</span>
            <button
              onClick={() => onFavoriteToggle(tournament.id)}
              className="flex items-center gap-1 hover:text-red-500 transition"
            >
              ❤️ {tournament.likes}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-3 bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition">
          View Details
        </button>
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 text-white px-3 py-1 rounded font-bold">CB</div>
          <span className="text-gray-700 font-semibold">CricB</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Home
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Tournaments
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Live Scores
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Clubs
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900">
            Players
          </a>
        </nav>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-teal-600 border border-teal-600 rounded hover:bg-teal-50 transition">
            Sign In
          </button>
          <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition">Sign Up</button>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">Cricket Stadium Wide Hero Image</h1>
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Digital Cricket</h2>
      <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
        Complete cricket ecosystem with live scoring, streaming, tournament management, and fan engagement for the
        grassroots cricket community.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button className="bg-teal-500 text-white px-6 py-3 rounded font-semibold hover:bg-teal-600 transition">
          Register Tournament
        </button>
        <button className="bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 transition">
          Join as Club Manager
        </button>
        <button className="bg-orange-500 text-white px-6 py-3 rounded font-semibold hover:bg-orange-600 transition">
          Start a Score
        </button>
      </div>
    </div>
  )
}

function SearchSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search tournaments or locations..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-semibold">
          Search
        </button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white text-slate-900 px-3 py-1 rounded font-bold">CB</div>
              <span className="font-semibold">CricB</span>
            </div>
            <p className="text-gray-400 text-sm">
              All-in-one digital platform for scoring, streaming and managing grassroots cricket across India.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Tournaments
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Live Scores
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Clubs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Cookies Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
          <p>© 2025 CricB. All rights reserved. Empowering cricket communities across India.</p>
        </div>
      </div>
    </footer>
  )
}

export default function FansDashboard() {
  const [favorites, setFavorites] = useState(new Set())

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return newFavorites
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <L
      <HeroSection />
      <SearchSection />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* All Tournaments Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tournamentData.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                isFavorite={favorites.has(tournament.id)}
                onFavoriteToggle={toggleFavorite}
              />
            ))}
          </div>
        </div>

        {/* Live Matches Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tournamentData.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                isFavorite={favorites.has(tournament.id)}
                onFavoriteToggle={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
