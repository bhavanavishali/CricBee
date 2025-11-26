import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Edit3,
  Plus,
  Save,
  X,
  ArrowLeft,
  Settings,
  Bell,
  Calendar,
  Users,
  CheckCircle,
  Shield,
  CreditCard,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { getClubProfile, createClub, updateClub, updateProfile, uploadClubImage, getClubPlayers } from '@/api/clubService';
import AddPlayerModal from '@/components/clubmanager/AddPlayerModal';

const ClubProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [formData, setFormData] = useState({
    club_name: '',
    description: '',
    short_name: '',
    location: ''
  });
  const [userForm, setUserForm] = useState({ full_name: '', phone: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'players' && profile?.club) {
      fetchPlayers();
    }
  }, [activeTab, profile?.club?.id]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    const result = await getClubProfile();
    if (result.success) {
      setProfile(result.profile);
      const user = result.profile.user;
      setUserForm({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
      if (result.profile.club) {
        const club = result.profile.club;
        setFormData({
          club_name: club.club_name,
          description: club.description,
          short_name: club.short_name,
          location: club.location
        });
        setImagePreview(club.club_image || null);
        setShowForm(false);
        setIsEdit(false);
      } else {
        setShowForm(true);
        setImagePreview(null);
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

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !profile?.club) {
      setError('Please select an image and ensure club exists');
      return;
    }

    setImageUploading(true);
    setError('');
    
    const res = await uploadClubImage(profile.club.id, imageFile);
    if (res.success) {
      setImageFile(null);
      await fetchProfile();
    } else {
      setError(res.message);
    }
    setImageUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.club_name || !formData.description || !formData.short_name || !formData.location) {
      setError('All fields are required');
      return;
    }
    setSubmitLoading(true);
    setError(null);

    let result;
    if (isEdit && profile.club) {
      result = await updateClub(profile.club.id, formData);
      if (result.success) {
        await fetchProfile();
      }
    } else {
      result = await createClub(formData, imageFile);
      if (result.success) {
        setImageFile(null);
        setImagePreview(null);
        await fetchProfile();
      }
    }

    if (!result.success) {
      setError(result.message);
    }
    setSubmitLoading(false);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.full_name || !userForm.phone) {
      setError('Full name and phone are required');
      return;
    }
    
    // Validate phone number (10 digits)
    const cleanedPhone = userForm.phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitLoading(true);
    setError('');
    
    const payload = {
      user: {
        full_name: userForm.full_name,
        phone: cleanedPhone
      }
    };
    
    const result = await updateProfile(payload);
    if (result.success) {
      setIsEditingUser(false);
      await fetchProfile();
    } else {
      setError(result.message);
    }
    setSubmitLoading(false);
  };

  const handleEdit = () => {
    if (profile.club) {
      setFormData({
        club_name: profile.club.club_name,
        description: profile.club.description,
        short_name: profile.club.short_name,
        location: profile.club.location
      });
      if (profile.club.club_image) {
        setImagePreview(profile.club.club_image);
      }
      setIsEdit(true);
      setShowForm(true);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEdit(false);
    setImageFile(null);
    setError(null);
    fetchProfile();
  };

  const handleUserCancel = () => {
    setIsEditingUser(false);
    setError('');
    fetchProfile();
  };

  const fetchPlayers = async () => {
    if (!profile?.club?.id) return;
    
    setPlayersLoading(true);
    const result = await getClubPlayers(profile.club.id);
    if (result.success) {
      setPlayers(result.data.players || []);
    } else {
      setError(result.message || 'Failed to fetch players');
    }
    setPlayersLoading(false);
  };

  const handleAddPlayer = () => {
    if (profile && profile.club) {
      navigate(`/club/${profile.club.id}/add-player`);
    } else {
      setError('Please create a club first.');
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
  const club = profile?.club;
  const hasClub = !!club;

  const manager = {
    avatar: user?.full_name?.charAt(0).toUpperCase() || 'M',
    joinedYear: new Date(user?.created_at).getFullYear() || new Date().getFullYear() - 1,
    playersCount: club?.no_of_players || 0,
    verifications: {
      identity: true,
      phone: true,
      payment: false,
    },
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'players', label: 'Players' },
    { id: 'statistics', label: 'Statistics' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CM</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Club Manager Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {manager.avatar}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-gray-500">Club Manager</p>
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
              {/* Avatar with Club Image */}
              <div className="relative">
                {imagePreview || (hasClub && club?.club_image) ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100">
                    <img 
                      src={imagePreview || club.club_image} 
                      alt="Club" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-5xl font-bold text-blue-700">{manager.avatar}</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">{user?.full_name}</h2>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                    Club Manager
                  </span>
                </div>

                <p className="text-gray-600 mb-4 text-base leading-relaxed max-w-2xl">
                  {hasClub ? club.description : 'Dedicated club manager ready to build and lead a successful team.'}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} className="text-gray-400" />
                    <span>{hasClub ? club.location : 'Location not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} className="text-gray-400" />
                    <span>Joined {manager.joinedYear}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} className="text-gray-400" />
                    <span>{manager.playersCount} players</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="text-right flex-shrink-0 space-y-4">
              {!showForm && hasClub && (
                <button 
                  onClick={handleEdit}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit Club
                </button>
              )}
              {/* {hasClub && (
                <button 
                  onClick={handleAddPlayer}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Player
                </button>
              )} */}
              {profile?.club && (
  <div className="mt-6">
    {/* <button
      onClick={() => setShowAddPlayerModal(true)}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <Users size={20} />
      Add Player to Club
    </button> */}
  </div>
)}
            </div>
          </div>
        </div>

        {/* User Details Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
            {!isEditingUser && (
              // <button
              //   onClick={() => setIsEditingUser(true)}
              //   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
              // >
              //   <Edit3 size={16} />
              //   Edit User Details
              // </button>
            )}
          </div>

          {isEditingUser ? (
            <form onSubmit={handleUserSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
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
                  value={user?.email}
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
                  disabled={submitLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {submitLoading ? 'Saving...' : (
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
                  <p className="text-gray-600">{user?.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Phone Number</label>
                  <p className="text-gray-600">{user?.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Email Address</label>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Club Section or Form */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          {showForm ? (
            // Create/Edit Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {isEdit ? <Edit3 size={20} /> : <Plus size={20} />}
                {isEdit ? 'Edit Club' : 'Create Your Club'}
              </h3>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
              
              {/* Image Upload Section for Create/Edit */}
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Club Image (Optional)
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
                      id={isEdit ? "club-image-edit" : "club-image-create"}
                    />
                    <label
                      htmlFor={isEdit ? "club-image-edit" : "club-image-create"}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      <Upload size={16} />
                      {imageFile ? 'Change Image' : 'Select Image'}
                    </label>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          if (hasClub && club?.club_image) {
                            setImagePreview(club.club_image);
                          } else {
                            setImagePreview(null);
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Club Name *</label>
                  <input
                    type="text"
                    name="club_name"
                    value={formData.club_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Short Name *</label>
                  <input
                    type="text"
                    name="short_name"
                    value={formData.short_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {submitLoading ? 'Saving...' : (
                    <>
                      <Save size={16} />
                      {isEdit ? 'Update Club' : 'Create Club'}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : hasClub ? (
            // Club Details
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={20} />
                Club Details
              </h3>
              
              {/* Image Upload Section */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Club Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview || club.club_image ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                      <img 
                        src={imagePreview || club.club_image} 
                        alt="Club" 
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
                      id="club-image-upload"
                    />
                    <label
                      htmlFor="club-image-upload"
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
                            setImageFile(null);
                            setImagePreview(club.club_image || null);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Club Name</label>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    {club.club_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Short Name</label>
                  <p className="text-gray-600">{club.short_name}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Description</label>
                  <p className="text-gray-600">{club.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Location</label>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    {club.location}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Active</label>
                  <p className="text-gray-600">{club.is_active ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Number of Players</label>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    {club.no_of_players || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Created At</label>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {new Date(club.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Add Player Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Users size={20} />
                  Add Player to Club
                </button>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    handleEdit();
                    if (club.club_image) {
                      setImagePreview(club.club_image);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              </div>
            </div>
          ) : (
            // No Club - Show Create Prompt
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Club Yet</h3>
              <p className="text-gray-600 mb-6">Create your club to manage players and tournaments.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Create Club
              </button>
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="flex flex-wrap gap-6">
            {manager.verifications.identity && (
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="text-gray-700 font-medium">Identity Verified</span>
              </div>
            )}
            {manager.verifications.phone && (
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-slate-600" />
                <span className="text-gray-700 font-medium">Phone Verified</span>
              </div>
            )}
            {manager.verifications.payment && (
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
                    ? "text-gray-900 border-b-2 border-blue-600 bg-gray-50"
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
                      <Users size={20} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">Role</label>
                        <p className="text-gray-600">{user?.role}</p>
                      </div>
                    </div>
                    {hasClub && (
                      <>
                        <div className="mb-8 flex items-center gap-3">
                          <Building2 size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">Club</label>
                            <p className="text-gray-600">{club.club_name}</p>
                          </div>
                        </div>
                        <div className="mb-8 flex items-center gap-3">
                          <MapPin size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1">Location</label>
                            <p className="text-gray-600">{club.location}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'players' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">
                    Club Players ({players.length})
                  </h4>
                  {profile?.club && (
                    <button
                      onClick={() => setShowAddPlayerModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Player
                    </button>
                  )}
                </div>

                {playersLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-4">Loading players...</p>
                  </div>
                ) : players.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Users size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No players in your club yet</p>
                    <p className="text-gray-400 text-sm mb-6">Add players to start building your team</p>
                    {profile?.club && (
                      <button
                        onClick={() => setShowAddPlayerModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Plus size={18} />
                        Add First Player
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-blue-700">
                                {player.user?.full_name?.charAt(0).toUpperCase() || 'P'}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                {player.user?.full_name || 'Unknown Player'}
                              </h5>
                              <p className="text-sm text-gray-500">
                                {player.player_profile?.cricb_id || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate">{player.user?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} className="text-gray-400" />
                            <span>{player.user?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            <span>Age: {player.player_profile?.age || 'N/A'} years</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="truncate">{player.player_profile?.address || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(player.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Add Player Modal */}
      {profile?.club && (
        <AddPlayerModal
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          clubId={profile.club.id}
          onPlayerAdded={() => {
            fetchProfile(); // Refresh profile to update player count
            fetchPlayers(); // Refresh players list
            setShowAddPlayerModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ClubProfile;


