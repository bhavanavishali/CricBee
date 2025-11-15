"use client"

import { useState, useEffect } from "react"
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
  Edit3,
  Plus,
  Save,
  X,
} from "lucide-react"
import { getProfile, createOrganization, updateOrganization } from '@/api/organizerService';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ organization_name: '', location: '', bio: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [orgId, setOrgId] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const res = await getProfile()
    if (res.success) {
      setProfile(res.data)
      if (res.data.organization) {
        const org = res.data.organization
        setFormData({
          organization_name: org.organization_name,
          location: org.location,
          bio: org.bio
        })
        setOrgId(org.id)
        setShowForm(false) // Hide form if org exists
        setIsEditing(false)
      } else {
        setShowForm(true) // Show create form if no org
      }
    } else {
      // Handle error, e.g., redirect to signin if unauthorized
      console.error(res.message)
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.organization_name || !formData.location || !formData.bio) {
      setFormError('All fields are required')
      return
    }
    setFormLoading(true)
    setFormError('')
    let res
    if (isEditing && orgId) {
      res = await updateOrganization(orgId, formData)
    } else {
      res = await createOrganization(formData)
    }
    if (res.success) {
      // Refetch profile to update state
      await fetchProfile()
    } else {
      setFormError(res.message)
    }
    setFormLoading(false)
  }

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false)
      setShowForm(false)
    } else {
      setIsEditing(true)
      setShowForm(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setShowForm(false)
    setFormError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading profile. Please try again.</div>
      </div>
    )
  }

  const user = profile.user
  const organization = profile.organization
  const hasOrganization = !!organization

  // Sample data for other sections (can be fetched later)
  const organizer = {
    avatar: user.full_name.charAt(0).toUpperCase(),
    avatarBg: "bg-green-100",
    rating: 4,
    totalRatings: 4.5,
    credibilityScore: 92,
    joinedYear: new Date().getFullYear() - 1, // Placeholder
    tournaments: 12,
    verifications: {
      organizer: hasOrganization,
      payment: true,
      identity: true,
      phone: true,
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
              <div className={`w-10 h-10 rounded-full ${organizer.avatarBg} flex items-center justify-center text-white font-semibold text-sm`}>
                {organizer.avatar}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-gray-500">{user.role}</p>
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
                  <h2 className="text-3xl font-bold text-gray-900">{user.full_name}</h2>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                    Organizer
                  </span>
                </div>

                <p className="text-gray-600 mb-4 text-base leading-relaxed max-w-2xl">
                  {hasOrganization ? organization.bio : 'Passionate organizer ready to create impactful events.'}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} className="text-gray-400" />
                    <span>{hasOrganization ? organization.location : 'Location not set'}</span>
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
                      <Star key={i} size={20} className={i < organizer.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
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

              {!showForm && hasOrganization && (
                <button 
                  onClick={handleEditToggle}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit Organization
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Organization Section or Form */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          {showForm ? (
            // Create/Edit Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Organization' : 'Create Your Organization'}
              </h3>
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Organization Name *</label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Bio *</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X size={16} className="inline mr-1" />
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {formLoading ? 'Saving...' : (
                    <>
                      <Save size={16} />
                      {isEditing ? 'Save Changes' : 'Create Organization'}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : hasOrganization ? (
            // Organization Details
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Organization Name</label>
                  <p className="text-gray-600">{organization.organization_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Location</label>
                  <p className="text-gray-600">{organization.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Bio</label>
                  <p className="text-gray-600">{organization.bio}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => { setIsEditing(true); setShowForm(true); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // No Organization - Show Create Button
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organization Yet</h3>
              <p className="text-gray-600 mb-6">Create your organization to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Organization
              </button>
            </div>
          )}
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
                  {/* Left Column - User Details */}
                  <div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name</label>
                      <p className="text-gray-600">{user.full_name}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                      <p className="text-gray-600">{user.phone}</p>
                    </div>
                  </div>

                  {/* Right Column - Organization Details (if exists) */}
                  {hasOrganization ? (
                    <div>
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Organization</label>
                        <p className="text-gray-600">{organization.organization_name}</p>
                      </div>
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                        <p className="text-gray-600">{organization.location}</p>
                      </div>
                      <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
                        <p className="text-gray-600">{organization.bio}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-gray-500">Create an organization to view details here.</p>
                    </div>
                  )}
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