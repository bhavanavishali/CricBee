import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { verifyEnrollmentPayment } from '@/api/clubService';
import { Trophy, ArrowLeft, DollarSign, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function EnrollTournament() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tournament, enrollment, razorpayOrder, clubId } = location.state || {};
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournament || !enrollment || !razorpayOrder || !clubId) {
      navigate('/clubmanager/tournaments');
      return;
    }

    // Initialize Razorpay payment
    initializePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is already available and is a constructor
      if (window.Razorpay && typeof window.Razorpay === 'function') {
        resolve();
        return;
      }

      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        // Script exists, wait for it to load and initialize
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds (100 * 100ms)
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.Razorpay && typeof window.Razorpay === 'function') {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('Razorpay SDK loading timeout'));
          }
        }, 100);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        // Wait for Razorpay to initialize (may take a moment)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.Razorpay && typeof window.Razorpay === 'function') {
            clearInterval(checkInterval);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            reject(new Error('Razorpay SDK failed to initialize'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  };

  const initializePayment = async () => {
    try {
      // Ensure Razorpay SDK is loaded
      await loadRazorpayScript();
    } catch (error) {
      setError('Failed to load Razorpay SDK. Please refresh the page.');
      console.error('Razorpay load error:', error);
      return;
    }

    if (!window.Razorpay) {
      setError('Razorpay SDK not available. Please refresh the page.');
      return;
    }

    // Ensure payment amount matches enrollment fee
    const enrollmentFee = parseFloat(tournament.details?.enrollment_fee || 0);
    const amountInPaise = Math.round(enrollmentFee * 100);

    // Verify amount matches
    if (Math.abs(enrollmentFee - parseFloat(razorpayOrder.amount)) > 0.01) {
      setError('Payment amount mismatch. Please try again.');
      return;
    }

    const options = {
      key: razorpayOrder.key,
      amount: amountInPaise,
      currency: razorpayOrder.currency || 'INR',
      name: 'CricBee',
      description: `Tournament Enrollment Fee: ₹${enrollmentFee.toLocaleString('en-IN')} for ${tournament.tournament_name}`,
      order_id: razorpayOrder.order_id,
      handler: async function (response) {
        try {
          setProcessing(true);
          await verifyEnrollmentPayment({
            tournament_id: tournament.id,
            club_id: clubId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          
          // Success - navigate to success page or back to tournaments
          navigate('/clubmanager/tournaments?enrolled=true');
        } catch (error) {
          setError(error.response?.data?.detail || 'Payment verification failed. Please contact support.');
          console.error('Payment verification error:', error);
        } finally {
          setProcessing(false);
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
          navigate('/clubmanager/tournaments');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    
    razorpay.on('payment.failed', function (response) {
      setError(`Payment failed: ${response.error.description || 'Please try again.'}`);
      console.error('Payment failed:', response.error);
    });


    razorpay.open();
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!tournament || !enrollment || !razorpayOrder) {
    return (
      <Layout title="Enroll in Tournament" profilePath="/clubmanager/profile">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Enrollment</h2>
            <p className="text-gray-600 mb-4">Tournament enrollment data is missing.</p>
            <button
              onClick={() => navigate('/clubmanager/tournaments')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Enroll in Tournament" profilePath="/clubmanager/profile">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/clubmanager/tournaments')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Tournaments</span>
          </button>

          {/* Tournament Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg p-4 flex-shrink-0">
                <Trophy size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {tournament.tournament_name}
                </h2>
                <p className="text-gray-600 mb-4">
                  {tournament.details?.location || 'Location not specified'}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <span className="ml-2 font-semibold">
                      {tournament.details?.start_date ? formatDate(tournament.details.start_date) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <span className="ml-2 font-semibold">
                      {tournament.details?.overs ? `${tournament.details.overs} overs` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Enrollment Fee</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(tournament.details?.enrollment_fee || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(tournament.details?.enrollment_fee || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Processing State */}
          {processing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800">Processing payment verification...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Payment Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      initializePayment();
                    }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> The Razorpay payment window should open automatically. 
              If it doesn't, please check your browser's popup blocker settings.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

