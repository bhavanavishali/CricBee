"use client"

import { useState } from "react"
import {
  Star,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  Shield,
  CreditCard,
  Phone,
  ArrowLeft,
  Settings,
  Bell,
} from "lucide-react"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")

  // Sample organizer data
  const organizer = {
    id: "demo-organizer",
    name: "Demo Organizer",
    role: "Organizer",
    avatar: "D",
    avatarBg: "bg-green-100",
    rating: 4,
    totalRatings: 4.5,
    credibilityScore: 92,
    location: "Kochi, Kerala",
    joinedYear: 2019,
    tournaments: 12,
    bio: "Passionate cricket organizer with over 5 years of experience in managing successful tournaments across India.",
    verifications: {
      organizer: true,
      payment: true,
      identity: true,
      phone: true,
    },
    details: {
      fullName: "Demo Organizer",
      email: "organizer@demo.com",
      phone: "+91 98765 43210",
      location: "Kochi, Kerala",
      organization: "Broto Type Cricket Events",
      website: "https://cricketorganizer.com",
      experience: "5 years",
      bio: "Passionate cricket organizer with over 5 years of experience in managing successful tournaments across India.",
    },
  }

  const tabs = [
    { id: "profile", label: "Profile Details" },
    { id: "statistics", label: "Statistics" },
    { id: "achievements", label: "Achievements" },
    { id: "tournaments", label: "Tournaments" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-300 flex items-center justify-center text-white font-semibold text-sm">
                D
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Demo Organizer</p>
                <p className="text-gray-500">Organizer</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg p-8 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center flex-shrink-0">
                <span className="text-5xl font-bold text-green-700">{organizer.avatar}</span>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">{organizer.name}</h2>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                    {organizer.role}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 text-base leading-relaxed max-w-2xl">{organizer.bio}</p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} className="text-gray-400" />
                    <span>{organizer.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} className="text-gray-400" />
                    <span>Joined {organizer.joinedYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} className="text-gray-400" />
                    <span>{organizer.tournaments} tournaments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Rating & Score */}
            <div className="text-right flex-shrink-0">
              <div className="mb-6">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} className={i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">({organizer.totalRatings})</span>
                </div>
                <p className="text-gray-500 text-sm">Rating</p>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold text-green-600">{organizer.credibilityScore}%</p>
                <p className="text-gray-500 text-sm">Credibility Score</p>
              </div>

              <button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="flex flex-wrap gap-6">
            {organizer.verifications.organizer && (
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-gray-700 font-medium">Verified Organizer</span>
              </div>
            )}
            {organizer.verifications.payment && (
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" />
                <span className="text-gray-700 font-medium">Payment Verified</span>
              </div>
            )}
            {organizer.verifications.identity && (
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-purple-600" />
                <span className="text-gray-700 font-medium">Identity Verified</span>
              </div>
            )}
            {organizer.verifications.phone && (
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-slate-600" />
                <span className="text-gray-700 font-medium">Phone Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-gray-900 border-b-2 border-green-600 bg-gray-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "profile" && (
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                      <p className="text-gray-600">{organizer.details.fullName}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                      <p className="text-gray-600">{organizer.details.email}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                      <p className="text-gray-600">{organizer.details.phone}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                      <p className="text-gray-600">{organizer.details.location}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Organization</label>
                      <p className="text-gray-600">{organizer.details.organization}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Website</label>
                      <p className="text-gray-600">{organizer.details.website}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Experience</label>
                      <p className="text-gray-600">{organizer.details.experience}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
                      <p className="text-gray-600">{organizer.details.bio}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "statistics" && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Statistics section coming soon</p>
              </div>
            )}

            {activeTab === "achievements" && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Achievements section coming soon</p>
              </div>
            )}

            {activeTab === "tournaments" && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Tournaments section coming soon</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
