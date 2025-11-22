<<<<<<< HEAD


// import React, { useState, useEffect } from 'react';
// import { getClubProfile, createClub, updateClub } from '@/api/clubService'; // Adjust path as needed
// import { useNavigate } from 'react-router-dom'; // Optional: for navigation to add player page

// const ClubProfile = () => {
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showForm, setShowForm] = useState(false); // For create or edit form
//   const [isEdit, setIsEdit] = useState(false);
//   const [formData, setFormData] = useState({
//     club_name: '',
//     description: '',
//     short_name: '',
//     location: ''
//   });
//   const [submitLoading, setSubmitLoading] = useState(false);
//   const navigate = useNavigate(); // Optional

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const fetchProfile = async () => {
//     setLoading(true);
//     setError(null);
//     const result = await getClubProfile();
//     if (result.success) {
//       setProfile(result.profile);
//       // If no club, show create form by default
//       if (!result.profile.club) {
//         setShowForm(true);
//       }
//     } else {
//       setError(result.message);
//     }
//     setLoading(false);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitLoading(true);
//     setError(null);

//     let result;
//     if (isEdit && profile.club) {
//       // Update club
//       const updatePayload = { ...formData };
//       result = await updateClub(profile.club.id, updatePayload);
//       if (result.success) {
//         setProfile(prev => ({ ...prev, club: result.club }));
//         setShowForm(false);
//         setIsEdit(false);
//         setFormData({ club_name: '', description: '', short_name: '', location: '' });
//       }
//     } else {
//       // Create club
//       result = await createClub(formData);
//       if (result.success) {
//         setProfile(prev => ({ ...prev, club: result.club }));
//         setShowForm(false);
//         setFormData({ club_name: '', description: '', short_name: '', location: '' });
//       }
//     }

//     if (!result.success) {
//       setError(result.message);
//     }
//     setSubmitLoading(false);
//   };

//   const handleEdit = () => {
//     if (profile.club) {
//       setFormData({
//         club_name: profile.club.club_name,
//         description: profile.club.description,
//         short_name: profile.club.short_name,
//         location: profile.club.location
//       });
//       setIsEdit(true);
//       setShowForm(true);
//     }
//   };

//   const handleAddPlayer = () => {
//     // Navigate to add player page or open modal
//     if (profile && profile.club) {
//       navigate(`/club/${profile.club.id}/add-player`); // Adjust route as needed
//     } else {
//       setError('Please create a club first.');
//     }
//   };

//   if (loading) {
//     return <div className="loading">Loading profile...</div>;
//   }

//   if (error && !profile) {
//     return <div className="error">Error: {error}</div>;
//   }

//   const user = profile?.user;
//   const club = profile?.club;

//   return (
//     <div className="club-profile">
//       <h1>Club Manager Profile</h1>
      
//       {/* User Basic Details */}
//       <section className="user-details">
//         <h2>Personal Details</h2>
//         <div className="detail-card">
//           <p><strong>Name:</strong> {user?.full_name}</p>
//           <p><strong>Email:</strong> {user?.email}</p>
//           <p><strong>Phone:</strong> {user?.phone}</p>
//           <p><strong>Role:</strong> {user?.role}</p>
//         </div>
//       </section>

//       {/* Club Details or Create Form */}
//       <section className="club-section">
//         {club ? (
//           // Club exists: Display details with buttons
//           <>
//             <h2>Club Details</h2>
//             <div className="detail-card">
//               <p><strong>Club Name:</strong> {club.club_name}</p>
//               <p><strong>Description:</strong> {club.description}</p>
//               <p><strong>Short Name:</strong> {club.short_name}</p>
//               <p><strong>Location:</strong> {club.location}</p>
//               <p><strong>Active:</strong> {club.is_active ? 'Yes' : 'No'}</p>
//               <p><strong>Number of Players:</strong> {club.no_of_players}</p>
//               <p><strong>Created At:</strong> {new Date(club.created_at).toLocaleDateString()}</p>
//             </div>
//             <div className="actions">
//               <button onClick={handleEdit} className="btn btn-primary">Edit Club</button>
//               <button onClick={handleAddPlayer} className="btn btn-secondary">Add Player</button>
//             </div>
//           </>
//         ) : (
//           // No club: Show create form if not already showing, but we set it in useEffect
//           !showForm ? (
//             <div className="no-club">
//               <h2>No Club Created</h2>
//               <p>You haven't created a club yet. Get started by filling in the details below.</p>
//               <button onClick={() => setShowForm(true)} className="btn btn-primary">Create Club</button>
//             </div>
//           ) : null
//         )}

//         {/* Conditional Form: Create or Edit */}
//         {showForm && (
//           <div className="club-form">
//             <h2>{isEdit ? 'Edit Club' : 'Create Club'}</h2>
//             {error && <div className="error">{error}</div>}
//             <form onSubmit={handleSubmit}>
//               <div className="form-group">
//                 <label htmlFor="club_name">Club Name *</label>
//                 <input
//                   type="text"
//                   id="club_name"
//                   name="club_name"
//                   value={formData.club_name}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="description">Description *</label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="short_name">Short Name *</label>
//                 <input
//                   type="text"
//                   id="short_name"
//                   name="short_name"
//                   value={formData.short_name}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label htmlFor="location">Location *</label>
//                 <input
//                   type="text"
//                   id="location"
//                   name="location"
//                   value={formData.location}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-actions">
//                 <button type="submit" disabled={submitLoading} className="btn btn-primary">
//                   {submitLoading ? 'Saving...' : (isEdit ? 'Update Club' : 'Create Club')}
//                 </button>
//                 <button type="button" onClick={() => {
//                   setShowForm(false);
//                   setIsEdit(false);
//                   setFormData({ club_name: '', description: '', short_name: '', location: '' });
//                   setError(null);
//                 }} className="btn btn-secondary">Cancel</button>
//               </div>
//             </form>
//           </div>
//         )}
//       </section>

//       <style jsx>{`
//         .club-profile { max-width: 800px; margin: 0 auto; padding: 20px; }
//         .detail-card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
//         .actions { display: flex; gap: 10px; margin-top: 10px; }
//         .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
//         .btn-primary { background: #007bff; color: white; }
//         .btn-secondary { background: #6c757d; color: white; }
//         .club-form { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-top: 20px; }
//         .form-group { margin-bottom: 15px; }
//         .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
//         .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
//         .no-club { text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; }
//         .loading, .error { text-align: center; padding: 20px; }
//         .error { color: red; }
//       `}</style>
//     </div>
//   );
// };

// export default ClubProfile;




=======
>>>>>>> feature/player
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
} from 'lucide-react';
import { getClubProfile, createClub, updateClub } from '@/api/clubService'; // Adjust path as needed

const ClubProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    club_name: '',
    description: '',
    short_name: '',
    location: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    const result = await getClubProfile();
    if (result.success) {
      setProfile(result.profile);
      if (!result.profile.club) {
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
        setProfile(prev => ({ ...prev, club: result.club }));
        setShowForm(false);
        setIsEdit(false);
        setFormData({ club_name: '', description: '', short_name: '', location: '' });
      }
    } else {
      result = await createClub(formData);
      if (result.success) {
        setProfile(prev => ({ ...prev, club: result.club }));
        setShowForm(false);
        setFormData({ club_name: '', description: '', short_name: '', location: '' });
      }
    }

    if (!result.success) {
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
      setIsEdit(true);
      setShowForm(true);
    }
  };

  const handleAddPlayer = () => {
    if (profile && profile.club) {
      navigate(`/club/${profile.club.id}/add-player`);
    } else {
      setError('Please create a club first.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEdit(false);
    setFormData({ club_name: '', description: '', short_name: '', location: '' });
    setError(null);
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

  // Placeholder data for enhancements
  const manager = {
    avatar: user?.full_name?.charAt(0).toUpperCase() || 'M',
    joinedYear: new Date().getFullYear() - 1,
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
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-5xl font-bold text-blue-700">{manager.avatar}</span>
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
              {hasClub && (
                <button 
                  onClick={handleAddPlayer}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Player
                </button>
              )}
            </div>
          </div>
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
                    {club.no_of_players}
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
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleEdit}
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
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Players list coming soon. Use "Add Player" button to get started.</p>
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

export default ClubProfile;