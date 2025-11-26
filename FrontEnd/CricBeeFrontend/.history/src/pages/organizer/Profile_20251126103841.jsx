"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
  Upload,
  Image as ImageIcon,
} from "lucide-react"
import { 
  getProfile, 
  createOrganization, 
  updateOrganization, 
  updateProfile,
  uploadOrganizationImage 
} from '@/api/organizerService';

export default function ProfilePage() {
  const
  const [activeTab, setActiveTab] = useState("profile")
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [formData, setFormData] = useState({ organization_name: '', location: '', bio: '' })
  const [userForm, setUserForm] = useState({ full_name: '', phone: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [orgId, setOrgId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const res = await getProfile()
    if (res.success) {
      setProfile(res.data)
      const user = res.data.user
      setUserForm({
        full_name: user.full_name || '',
        phone: user.phone || ''
      })
      if (res.data.organization) {
        const org = res.data.organization
        setFormData({
          organization_name: org.organization_name,
          location: org.location,
          bio: org.bio
        })
        setOrgId(org.id)
        setImagePreview(org.organization_image || null)
        setShowForm(false)
        setIsEditing(false)
      } else {
        setShowForm(true)
        setImagePreview(null)
      }
    } else {
      console.error(res.message)
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleUserInputChange = (e) => {
    const { name, value } = e.target
    setUserForm(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please select an image file')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile || !orgId) {
      setFormError('Please select an image and ensure organization exists')
      return
    }

    setImageUploading(true)
    setFormError('')
    
    const res = await uploadOrganizationImage(orgId, imageFile)
    if (res.success) {
      setImageFile(null)
      await fetchProfile()
    } else {
      setFormError(res.message)
    }
    setImageUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.organization_name || !formData.location || !formData.bio) {
      setFormError('All organization fields are required')
      return
    }
    setFormLoading(true)
    setFormError('')
    let res
    if (isEditing && orgId) {
      res = await updateOrganization(orgId, formData)
    } else {
      // Pass the image file when creating
      res = await createOrganization(formData, imageFile)
    }
    if (res.success) {
      // Clear image state after successful creation
      setImageFile(null)
      setImagePreview(null)
      await fetchProfile()
    } else {
      setFormError(res.message)
    }
    setFormLoading(false)
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault()
    if (!userForm.full_name || !userForm.phone) {
      setFormError('Full name and phone are required')
      return
    }
    
    // Validate phone number (10 digits)
    const cleanedPhone = userForm.phone.replace(/\D/g, '')
    if (cleanedPhone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits')
      return
    }

    setFormLoading(true)
    setFormError('')
    
    const payload = {
      user: {
        full_name: userForm.full_name,
        phone: cleanedPhone
      }
    }
    
    const res = await updateProfile(payload)
    if (res.success) {
      setIsEditingUser(false)
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
    setImageFile(null)
    fetchProfile() // Reset form data
  }

  const handleUserCancel = () => {
    setIsEditingUser(false)
    setFormError('')
    fetchProfile() // Reset form data
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

  const organizer = {
    avatar: user.full_name.charAt(0).toUpperCase(),
    avatarBg: "bg-green-100",
    rating: 4,
    totalRatings: 4.5,
    credibilityScore: 92,
    joinedYear: new Date(user.created_at).getFullYear(),
    tournaments: 0,
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
        <button onClick={() => navigate("/organizer/dashboard")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg p-8 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Avatar with Organization Image */}
              <div className="relative">
                {imagePreview || (hasOrganization && organization?.organization_image) ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-100">
                    <img 
                      src={imagePreview || organization.organization_image} 
                      alt="Organization" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-5xl font-bold text-green-700">{organizer.avatar}</span>
                  </div>
                )}
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

        {/* User Details Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
            {!isEditingUser && (
              <button
                onClick={() => setIsEditingUser(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
              >
                <Edit3 size={16} />
                Edit User Details
              </button>
            )}
          </div>

          {isEditingUser ? (
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={userForm.full_name}
                    onChange={handleUserInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={userForm.phone}
                    onChange={handleUserInputChange}
                    placeholder="10-digit phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleUserCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} className="inline mr-1" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {formLoading ? 'Saving...' : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
                  <p className="text-gray-600">{user.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Phone Number</label>
                  <p className="text-gray-600">{user.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address</label>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          )}
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
              
              {/* Image Upload Section for Create/Edit */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Organization Image {isEditing ? '(Optional)' : '(Optional)'}
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id={isEditing ? "org-image-edit" : "org-image-create"}
                    />
                    <label
                      htmlFor={isEditing ? "org-image-edit" : "org-image-create"}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      <Upload size={16} />
                      {imageFile ? 'Change Image' : 'Select Image'}
                    </label>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          if (hasOrganization && organization?.organization_image) {
                            setImagePreview(organization.organization_image)
                          } else {
                            setImagePreview(null)
                          }
                        }}
                        className="ml-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <X size={16} className="inline mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
              
              {/* Image Upload Section */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Organization Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview || organization.organization_image ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                      <img 
                        src={imagePreview || organization.organization_image} 
                        alt="Organization" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="org-image-upload"
                    />
                    <label
                      htmlFor="org-image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      <Upload size={16} />
                      {imageFile ? 'Change Image' : 'Upload Image'}
                    </label>
                    {imageFile && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={handleImageUpload}
                          disabled={imageUploading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {imageUploading ? 'Uploading...' : (
                            <>
                              <Save size={16} />
                              Save Image
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(organization.organization_image || null)
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <X size={16} className="inline mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                    onClick={() => { 
                      setIsEditing(true)
                      setShowForm(true)
                      if (organization.organization_image) {
                        setImagePreview(organization.organization_image)
                      }
                    }}
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