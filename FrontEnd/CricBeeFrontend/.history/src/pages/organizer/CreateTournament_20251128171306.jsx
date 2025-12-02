import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTournament, getPricingPlans, verifyPayment } from '@/api/tournamentService';
import Layout from '@/components/layouts/Layout';

const CreateTournament = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tournament_name: '',
    plan_id: '',
    details: {
      overs: '',
      start_date: '',
      end_date: '',
      registration_start_date: '',
      registration_end_date: '',
      location: '',
      venue_details: '',
      team_range: '',
      is_public: true
    }
  });

  useEffect(() => {
    loadPricingPlans();
  }, []);

  const loadPricingPlans = async () => {
    try {
      const data = await getPricingPlans();
      setPlans(data.filter(plan => plan.status === 'active'));
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createTournament(formData);
      
      // Initialize Razorpay payment
      const options = {
        key: result.razorpay_order.key,
        amount: result.razorpay_order.amount * 100, // Convert to paise
        currency: result.razorpay_order.currency,
        name: 'CricBee',
        description: `Payment for ${formData.tournament_name}`,
        order_id: result.razorpay_order.order_id,
        handler: async function (response) {
          // Verify payment on backend
          try {
            await verifyPayment({
              tournament_id: result.tournament.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            alert('Payment successful! Tournament created.');
            navigate('/organizer/dashboard');
          } catch (error) {
            alert('Payment verification failed. Please contact support.');
            console.error(error);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3399cc'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', function (response) {
        alert('Payment failed. Please try again.');
        console.error(response.error);
      });

    } catch (error) {
      alert('Failed to create tournament. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Tournament Name</label>
            <input
              type="text"
              required
              value={formData.tournament_name}
              onChange={(e) => setFormData({...formData, tournament_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Pricing Plan */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Pricing Plan</label>
            <select
              required
              value={formData.plan_id}
              onChange={(e) => setFormData({...formData, plan_id: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select a plan</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.plan_name} - {plan.plan_range} (₹{plan.amount})
                </option>
              ))}
            </select>
          </div>

          {/* Overs */}
          <div>
            <label className="block text-sm font-medium mb-2">Overs</label>
            <input
              type="number"
              required
              min="1"
              max="50"
              value={formData.details.overs}
              onChange={(e) => setFormData({
                ...formData,
                details: {...formData.details, overs: parseInt(e.target.value)}
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formData.details.start_date}
                onChange={(e) => setFormData({
                  ...formData,
                  details: {...formData.details, start_date: e.target.value}
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                required
                value={formData.details.end_date}
                onChange={(e) => setFormData({
                  ...formData,
                  details: {...formData.details, end_date: e.target.value}
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Registration Start Date</label>
              <input
                type="date"
                required
                value={formData.details.registration_start_date}
                onChange={(e) => setFormData({
                  ...formData,
                  details: {...formData.details, registration_start_date: e.target.value}
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Registration End Date</label>
              <input
                type="date"
                required
                value={formData.details.registration_end_date}
                onChange={(e) => setFormData({
                  ...formData,
                  details: {...formData.details, registration_end_date: e.target.value}
                })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              required
              value={formData.details.location}
              onChange={(e) => setFormData({
                ...formData,
                details: {...formData.details, location: e.target.value}
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Venue Details */}
          <div>
            <label className="block text-sm font-medium mb-2">Venue Details</label>
            <textarea
              value={formData.details.venue_details}
              onChange={(e) => setFormData({
                ...formData,
                details: {...formData.details, venue_details: e.target.value}
              })}
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
            />
          </div>

          {/* Team Range */}
          <div>
            <label className="block text-sm font-medium mb-2">Team Range</label>
            <input
              type="text"
              required
              placeholder="e.g., 4-8 teams"
              value={formData.details.team_range}
              onChange={(e) => setFormData({
                ...formData,
                details: {...formData.details, team_range: e.target.value}
              })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* Is Public */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.details.is_public}
              onChange={(e) => setFormData({
                ...formData,
                details: {...formData.details, is_public: e.target.checked}
              })}
              className="mr-2"
            />
            <label className="text-sm font-medium">Make tournament public</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Tournament & Proceed to Payment'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTournament;