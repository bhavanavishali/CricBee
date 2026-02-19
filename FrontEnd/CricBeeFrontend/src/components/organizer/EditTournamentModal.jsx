import { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, Users, DollarSign, Trophy } from 'lucide-react';
import { updateTournament } from '@/api/organizer/tournament';

const EditTournamentModal = ({ tournament, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tournament_name: '',
    details: {
      overs: 10,
      start_date: '',
      end_date: '',
      registration_start_date: '',
      registration_end_date: '',
      location: '',
      venue_details: '',
      team_range: '',
      is_public: true,
      enrollment_fee: '',
      prize_amount: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tournament) {
      setFormData({
        tournament_name: tournament.tournament_name || '',
        details: {
          overs: tournament.details?.overs || 10,
          start_date: tournament.details?.start_date || '',
          end_date: tournament.details?.end_date || '',
          registration_start_date: tournament.details?.registration_start_date || '',
          registration_end_date: tournament.details?.registration_end_date || '',
          location: tournament.details?.location || '',
          venue_details: tournament.details?.venue_details || '',
          team_range: tournament.details?.team_range || '',
          is_public: tournament.details?.is_public ?? true,
          enrollment_fee: tournament.details?.enrollment_fee || '',
          prize_amount: tournament.details?.prize_amount || ''
        }
      });
    }
  }, [tournament]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'tournament_name') {
      setFormData(prev => ({
        ...prev,
        tournament_name: value
      }));
    } else if (name.startsWith('details.')) {
      const detailField = name.replace('details.', '');
      setFormData(prev => ({
        ...prev,
        details: {
          ...prev.details,
          [detailField]: type === 'checkbox' ? checked : value
        }
      }));
    }
  };

  const validateForm = () => {
    if (!formData.tournament_name.trim()) {
      setError('Tournament name is required');
      return false;
    }
    
    if (!formData.details.location.trim()) {
      setError('Location is required');
      return false;
    }
    
    if (!formData.details.team_range.trim()) {
      setError('Team range is required');
      return false;
    }
    
    if (!formData.details.overs || formData.details.overs < 1 || formData.details.overs > 50) {
      setError('Overs must be between 1 and 50');
      return false;
    }
    
    if (!formData.details.start_date) {
      setError('Start date is required');
      return false;
    }
    
    if (!formData.details.end_date) {
      setError('End date is required');
      return false;
    }
    
    if (!formData.details.registration_start_date) {
      setError('Registration start date is required');
      return false;
    }
    
    if (!formData.details.registration_end_date) {
      setError('Registration end date is required');
      return false;
    }
    
    if (!formData.details.enrollment_fee || parseFloat(formData.details.enrollment_fee) < 1) {
      setError('Enrollment fee must be at least ₹1');
      return false;
    }
    
    if (new Date(formData.details.start_date) < new Date(formData.details.registration_end_date)) {
      setError('Tournament start date should be after registration end date');
      return false;
    }
    
    if (new Date(formData.details.end_date) < new Date(formData.details.start_date)) {
      setError('End date should be after start date');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const updateData = {
        tournament_name: formData.tournament_name,
        details: {
          ...formData.details,
          overs: parseInt(formData.details.overs),
          enrollment_fee: parseFloat(formData.details.enrollment_fee),
          prize_amount: parseFloat(formData.details.prize_amount) || 0
        }
      };
      
      await updateTournament(tournament.id, updateData);
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update tournament';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tournament) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="text-purple-600" size={24} />
            Edit Tournament
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                name="tournament_name"
                value={formData.tournament_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter tournament name"
                required
              />
            </div>
          </div>

          {/* Tournament Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Tournament Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format (Overs) *
                </label>
                <input
                  type="number"
                  name="details.overs"
                  value={formData.details.overs}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter number of overs"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter number of overs (1-50)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Range *
                </label>
                <input
                  type="text"
                  name="details.team_range"
                  value={formData.details.team_range}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 4-8 teams"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                name="details.location"
                value={formData.details.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Mumbai, Maharashtra"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Details
              </label>
              <textarea
                name="details.venue_details"
                value={formData.details.venue_details}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Wankhede Stadium, Churchgate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Enrollment Fee (₹) *
              </label>
              <input
                type="number"
                name="details.enrollment_fee"
                value={formData.details.enrollment_fee}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Trophy size={16} className="inline mr-1" />
                Prize Amount (₹)
              </label>
              <input
                type="number"
                name="details.prize_amount"
                value={formData.details.prize_amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="5000"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="details.is_public"
                id="is_public"
                checked={formData.details.is_public}
                onChange={handleInputChange}
                className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                Make tournament public (visible to all clubs)
              </label>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              <Calendar size={18} className="inline mr-1" />
              Important Dates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Start Date *
                </label>
                <input
                  type="date"
                  name="details.registration_start_date"
                  value={formData.details.registration_start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration End Date *
                </label>
                <input
                  type="date"
                  name="details.registration_end_date"
                  value={formData.details.registration_end_date}
                  onChange={handleInputChange}
                  min={formData.details.registration_start_date}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Start Date *
                </label>
                <input
                  type="date"
                  name="details.start_date"
                  value={formData.details.start_date}
                  onChange={handleInputChange}
                  min={formData.details.registration_end_date}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament End Date *
                </label>
                <input
                  type="date"
                  name="details.end_date"
                  value={formData.details.end_date}
                  onChange={handleInputChange}
                  min={formData.details.start_date}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTournamentModal;
