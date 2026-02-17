import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTournament, getPricingPlans, verifyPayment } from '@/api/organizer/tournament';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft } from 'lucide-react';

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
      is_public: true,
      enrollment_fee: ''
    }
  });

  useEffect(() => {
    loadPricingPlans();
    // Preload Razorpay script when component mounts
    // Check if script is already in HTML
    const scriptInHTML = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (scriptInHTML) {
      console.log('Razorpay script found in HTML, waiting for initialization...');
      // Check if script has loaded
      if (scriptInHTML.readyState) {
        console.log('Script readyState:', scriptInHTML.readyState);
      }
    }
    
    // Try to preload Razorpay
    loadRazorpayScript().catch(err => {
      console.warn('Razorpay preload warning:', err);
      console.warn('This is not critical - Razorpay will be loaded when needed');
      // Don't show error on mount, just log it - user will see error when they try to create tournament
    });
  }, []);

  const loadPricingPlans = async () => {
    try {
      const data = await getPricingPlans();
      setPlans(data.filter(plan => plan.status === 'active'));
    } catch (error) {
      console.error('Failed to load pricing plans:', error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is already available and is a constructor
      if (window.Razorpay && typeof window.Razorpay === 'function') {
        console.log('Razorpay already available');
        resolve();
        return;
      }

      // Check if script is already in the DOM (from index.html or previous load)
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      
      // If script exists, wait for it to initialize
      if (existingScript) {
        console.log('Razorpay script found in DOM, waiting for initialization...');
        let attempts = 0;
        const maxAttempts = 200; // 20 seconds
        const checkInterval = setInterval(() => {
          attempts++;
          // Check multiple ways Razorpay might be available
          if (window.Razorpay && typeof window.Razorpay === 'function') {
            clearInterval(checkInterval);
            console.log('Razorpay initialized successfully');
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('Razorpay initialization timeout. Script exists but Razorpay not available.');
            console.log('Window.Razorpay:', window.Razorpay);
            console.log('Type of window.Razorpay:', typeof window.Razorpay);
            
            // Try to remove and reload the script
            if (existingScript.parentNode) {
              existingScript.parentNode.removeChild(existingScript);
            }
            
            // Load script dynamically
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            const loadTimeout = setTimeout(() => {
              if (script.parentNode) {
                script.parentNode.removeChild(script);
              }
              reject(new Error('Razorpay SDK script load timeout. Please check your internet connection and refresh the page.'));
            }, 15000);

            script.onload = () => {
              clearTimeout(loadTimeout);
              console.log('Razorpay script loaded, waiting for initialization...');
              // Wait for Razorpay to initialize
              let initAttempts = 0;
              const maxInitAttempts = 100; // 10 seconds
              const initInterval = setInterval(() => {
                initAttempts++;
                if (window.Razorpay && typeof window.Razorpay === 'function') {
                  clearInterval(initInterval);
                  console.log('Razorpay initialized after reload');
                  resolve();
                } else if (initAttempts >= maxInitAttempts) {
                  clearInterval(initInterval);
                  reject(new Error('Razorpay SDK failed to initialize after script loaded. Please check browser console for errors.'));
                }
              }, 100);
            };
            
            script.onerror = () => {
              clearTimeout(loadTimeout);
              if (script.parentNode) {
                script.parentNode.removeChild(script);
              }
              reject(new Error('Failed to load Razorpay SDK. Please check your internet connection and refresh the page.'));
            };
            
            document.head.appendChild(script);
          }
        }, 100);
        return;
      }

      // Script doesn't exist, load it dynamically
      console.log('Loading Razorpay script dynamically...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      const loadTimeout = setTimeout(() => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(new Error('Razorpay SDK script load timeout. Please check your internet connection and refresh the page.'));
      }, 15000);

      script.onload = () => {
        clearTimeout(loadTimeout);
        console.log('Razorpay script loaded, waiting for initialization...');
        // Wait for Razorpay to initialize
        let initAttempts = 0;
        const maxInitAttempts = 100; // 10 seconds
        const initInterval = setInterval(() => {
          initAttempts++;
          if (window.Razorpay && typeof window.Razorpay === 'function') {
            clearInterval(initInterval);
            console.log('Razorpay initialized successfully');
            resolve();
          } else if (initAttempts >= maxInitAttempts) {
            clearInterval(initInterval);
            reject(new Error('Razorpay SDK failed to initialize after script loaded. Please check browser console for errors.'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        clearTimeout(loadTimeout);
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(new Error('Failed to load Razorpay SDK. Please check your internet connection and refresh the page.'));
      };
      
      document.head.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure enrollment_fee is a number and at least 1.00 (required for Razorpay)
      const enrollmentFee = formData.details.enrollment_fee === '' 
        ? 0 
        : parseFloat(formData.details.enrollment_fee) || 0;
      
      if (enrollmentFee < 1) {
        alert('Enrollment fee must be at least ₹1.00');
        setLoading(false);
        return;
      }
      
      const submitData = {
        ...formData,
        details: {
          ...formData.details,
          enrollment_fee: enrollmentFee
        }
      };
      
      const result = await createTournament(submitData);
      
      // Ensure Razorpay SDK is loaded before proceeding
      try {
        await loadRazorpayScript();
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        console.error('Razorpay load error:', error);
        
        // Provide more helpful error message
        if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
          alert('Payment gateway is taking too long to load. This might be due to:\n\n1. Slow internet connection\n2. Network firewall blocking Razorpay\n3. Ad blocker blocking the script\n\nPlease:\n- Check your internet connection\n- Disable ad blockers\n- Refresh the page and try again');
        } else {
          alert(`Failed to load payment gateway: ${errorMessage}\n\nPlease refresh the page and try again.`);
        }
        
        setLoading(false);
        return;
      }
      
      // Double check Razorpay is available and is a constructor
      if (!window.Razorpay) {
        alert('Payment gateway not loaded. Please refresh the page and try again.');
        console.error('Razorpay not found in window object');
        setLoading(false);
        return;
      }
      
      if (typeof window.Razorpay !== 'function') {
        alert('Payment gateway not properly initialized. Please refresh the page and try again.');
        console.error('Razorpay is not a constructor:', typeof window.Razorpay, window.Razorpay);
        setLoading(false);
        return;
      }
      
      // Initialize Razorpay payment
      const amountInPaise = Math.round(parseFloat(result.razorpay_order.amount) * 100);
      
      const options = {
        key: result.razorpay_order.key,
        amount: amountInPaise,
        currency: result.razorpay_order.currency || 'INR',
        name: 'CricBee',
        description: `Payment for ${formData.tournament_name}`,
        order_id: result.razorpay_order.order_id,
        handler: async function (response) {
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
            console.error('Payment verification error:', error);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setLoading(false);
          }
        }
      };

      try {
        console.log('Initializing Razorpay with options:', options);
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        razorpay.on('payment.failed', function (response) {
          setLoading(false);
          alert(`Payment failed: ${response.error.description || 'Please try again.'}`);
          console.error('Payment failed:', response.error);
        });
      } catch (error) {
        alert(`Failed to initialize payment: ${error.message || 'Please try again.'}`);
        console.error('Razorpay initialization error:', error);
        console.error('Razorpay type:', typeof window.Razorpay);
        console.error('Window.Razorpay:', window.Razorpay);
        setLoading(false);
      }

    } catch (error) {
      let errorMessage = 'Failed to create tournament. Please try again.';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Show more detailed error in console for debugging
      console.error('Tournament creation error:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
        fullError: error
      });
      
      // Display user-friendly error message
      alert(`Tournament Creation Error:\n\n${errorMessage}\n\nPlease check:\n- All required fields are filled\n- Razorpay credentials are configured\n- Network connection is stable`);
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Tournament" profilePath="/organizer/profile">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Dashboard</span>
          </button>

          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Tournament</h1>
            <p className="text-gray-600">Fill in the details to create your tournament</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tournament Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.tournament_name}
                  onChange={(e) => setFormData({...formData, tournament_name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tournament name"
                />
              </div>

              {/* Pricing Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pricing Plan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.plan_id}
                  onChange={(e) => setFormData({...formData, plan_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overs <span className="text-red-500">*</span>
                </label>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter number of overs"
                />
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.details.start_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      details: {...formData.details, start_date: e.target.value}
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.details.end_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      details: {...formData.details, end_date: e.target.value}
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.details.registration_start_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      details: {...formData.details, registration_start_date: e.target.value}
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.details.registration_end_date}
                    onChange={(e) => setFormData({
                      ...formData,
                      details: {...formData.details, registration_end_date: e.target.value}
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.details.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: {...formData.details, location: e.target.value}
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter location"
                />
              </div>

              {/* Venue Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Details
                </label>
                <textarea
                  value={formData.details.venue_details}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: {...formData.details, venue_details: e.target.value}
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter venue details"
                />
              </div>

              {/* Team Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Range <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 4-8 teams"
                  value={formData.details.team_range}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: {...formData.details, team_range: e.target.value}
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Enrollment Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Fee (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="1.00"
                  value={formData.details.enrollment_fee}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : (parseFloat(e.target.value) || 0);
                    setFormData({
                      ...formData,
                      details: {...formData.details, enrollment_fee: value}
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Amount clubs need to pay to enroll in this tournament (minimum ₹1.00)
                </p>
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Make tournament public
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/organizer/dashboard')}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Tournament & Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateTournament;
