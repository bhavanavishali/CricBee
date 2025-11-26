// src/pages/PlayerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Plus,
  Save,
  X,
  ArrowLeft,
  Settings,
  Bell,
  Calendar,
  CheckCircle,
  Shield,
  CreditCard,
  Camera,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getPlayerProfile, createPlayerProfile, updatePlayerProfile, uploadProfilePhoto, changePassword } from '@/api/playerService';
import Swal from 'sweetalert2'; 

const PlayerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    address: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    setImageError(false); // Reset image error when fetching new profile
    const result = await getPlayerProfile();
    if (result.success) {
      setProfile(result.profile);
      if (!result.profile.player_profile) {
        setShowForm(true);
      }
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.age || !formData.address) {
      setError('All fields are required');
      return;
    }
    setSubmitLoading(true);
    setError(null);

    let result;
    if (isEdit && profile.player_profile) {
      result = await updatePlayerProfile(profile.player_profile.id, formData);
      if (result.success) {
        setProfile(prev => ({ ...prev, player_profile: result.player_profile }));
        setShowForm(false);
        setIsEdit(false);
        setFormData({ age: '', address: '' });
      }
    } else {
      result = await createPlayerProfile(formData);
      if (result.success) {
        setProfile(prev => ({ ...prev, player_profile: result.player_profile }));
        setShowForm(false);
        setFormData({ age: '', address: '' });
      }
    }

    if (!result.success) {
      setError(result.message);
    }
    setSubmitLoading(false);
  };

  const handleEdit = () => {
    if (profile.player_profile) {
      setFormData({
        age: profile.player_profile.age,
        address: profile.player_profile.address
      });
      setIsEdit(true);
      setShowForm(true);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEdit(false);
    setFormData({ age: '', address: '' });
    setError(null);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select an image file.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size should be less than 5MB.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await uploadProfilePhoto(file);
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: result.message,
          confirmButtonColor: '#10b981',
          timer: 2000,
        });
        // Refresh profile to get updated photo
        await fetchProfile();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: result.message,
          confirmButtonColor: '#10b981',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to upload photo. Please try again.',
        confirmButtonColor: '#10b981',
      });
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all password fields.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Too Short',
        text: 'New password must be at least 6 characters long.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords Don\'t Match',
        text: 'New password and confirm password do not match.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const result = await changePassword(
        passwordData.current_password,
        passwordData.new_password,
        passwordData.confirm_password
      );
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: result.message,
          confirmButtonColor: '#10b981',
        });
        setShowPasswordForm(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Change Failed',
          text: result.message,
          confirmButtonColor: '#10b981',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to change password. Please try again.',
        confirmButtonColor: '#10b981',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  const user = profile?.user;
  const playerProfile = profile?.player_profile;
  const hasProfile = !!playerProfile;


  const player = {
    avatar: user?.full_name?.charAt(0).toUpperCase() || 'P',
    joinedYear: new Date().getFullYear() - 1,
    verifications: {
      identity: true,
      phone: true,
      payment: false,
    },
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'statistics', label: 'Statistics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Player Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm overflow-hidden">
                {profile?.user?.profile_photo && !imageError ? (
                  <img 
                    src={profile.user.profile_photo} 
                    alt={user?.full_name || 'User'}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span>{player.avatar}</span>
                )}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-gray-500">Player</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg p-8 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Avatar with Photo Upload */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {profile?.user?.profile_photo && !imageError ? (
                    <img 
                      src={profile.user.profile_photo} 
                      alt={user?.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={() => {
                        // If image fails to load, show fallback
                        setImageError(true);
                      }}
                      onLoad={() => {
                        // Reset error state if image loads successfully
                        setImageError(false);
                      }}
                    />
                  ) : (
                    <span className="text-5xl font-bold text-green-700 flex items-center justify-center w-full h-full">
                      {player.avatar}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                  title="Change photo"
                >
                  <Camera size={20} className="text-white" />
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">{user?.full_name}</h2>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                    Player
                  </span>
                </div>

                <p className="text-gray-600 mb-4 text-base leading-relaxed max-w-2xl">
                  {hasProfile ? `Passionate player with ${playerProfile.age} years of experience.` : 'New player ready to join teams and tournaments.'}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} className="text-gray-400" />
                    <span>Joined {player.joinedYear}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="text-right flex-shrink-0 space-y-4">
              {!showForm && hasProfile && (
                <button 
                  onClick={handleEdit}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Player Profile Section or Form */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          {showForm ? (
            // Create/Edit Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {isEdit ? <Edit3 size={20} /> : <Plus size={20} />}
                {isEdit ? 'Edit Profile' : 'Create Your Player Profile'}
              </h3>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    min="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {submitLoading ? 'Saving...' : (
                    <>
                      <Save size={16} />
                      {isEdit ? 'Update Profile' : 'Create Profile'}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : hasProfile ? (
            // Player Details
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Player Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Age</label>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {playerProfile.age}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Address</label>
                  <p className="text-gray-600">{playerProfile.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Cricbee ID</label>
                  <p className="text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">{playerProfile.cricb_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Created At</label>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {new Date(playerProfile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              </div>
            </div>
          ) : (
            // No Profile - Show Create Prompt
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Player Profile Yet</h3>
              <p className="text-gray-600 mb-6">Create your player profile to join clubs and tournaments.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Profile
              </button>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Lock size={20} />
              Change Password
            </h3>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit3 size={16} />
                Change Password
              </button>
            )}
          </div>
          
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                    required
                    disabled={submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                    required
                    minLength={6}
                    disabled={submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                    required
                    minLength={6}
                    disabled={submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  disabled={submitLoading}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {submitLoading ? 'Changing...' : (
                    <>
                      <Save size={16} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="flex flex-wrap gap-6">
            {player.verifications.identity && (
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-gray-700 font-medium">Identity Verified</span>
              </div>
            )}
            {player.verifications.phone && (
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-slate-600" />
                <span className="text-gray-700 font-medium">Phone Verified</span>
              </div>
            )}
            {player.verifications.payment && (
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" />
                <span className="text-gray-700 font-medium">Payment Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* Personal Details Tab Section */}
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
            {activeTab === 'profile' && (
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="mb-8 flex items-center gap-3">
                      <User size={20} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
                        <p className="text-gray-600">{user?.full_name}</p>
                      </div>
                    </div>
                    <div className="mb-8 flex items-center gap-3">
                      <Mail size={20} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Email</label>
                        <p className="text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                    <div className="mb-8 flex items-center gap-3">
                      <Phone size={20} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Phone</label>
                        <p className="text-gray-600">{user?.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-8 flex items-center gap-3">
                      <User size={20} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Role</label>
                        <p className="text-gray-600">{user?.role}</p>
                      </div>
                    </div>
                    {hasProfile && (
                      <>
                        <div className="mb-8 flex items-center gap-3">
                          <Calendar size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">Age</label>
                            <p className="text-gray-600">{playerProfile.age}</p>
                          </div>
                        </div>
                        <div className="mb-8 flex items-center gap-3">
                          <MapPin size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">Address</label>
                            <p className="text-gray-600">{playerProfile.address}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'statistics' && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Statistics section coming soon</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlayerProfile;