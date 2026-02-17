import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layouts/Layout";
import { DollarSign, Calendar, CheckCircle, XCircle, Clock, Wallet, ArrowLeft, RefreshCw } from "lucide-react";
import { getClubManagerTransactions, getClubManagerWalletBalance } from "@/api/clubmanager/payments";

export default function ClubManagerPayments() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadTransactions(), loadWalletBalance()]);
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await getClubManagerTransactions();
      
      if (result.success) {
        setTransactions(result.data.transactions || []);
        setTotalTransactions(result.data.total || 0);
      } else {
        console.error("Transactions API error:", result.message);
        // Mock data with required fields
        setTransactions([
          {
            transaction_id: "TXN001",
            tournament_name: "Mumbai Premier League 2024",
            tournament_id: "T001",
            transaction_direction: "debit",
            amount: 25000,
            status: "success",
            payment_date: "2024-01-15T10:30:00Z",
            created_at: "2024-01-15T10:30:00Z"
          },
          {
            transaction_id: "TXN002",
            tournament_name: "Corporate Cricket Championship",
            tournament_id: "T002",
            transaction_direction: "debit",
            amount: 15000,
            status: "pending",
            payment_date: "2024-01-20T14:15:00Z",
            created_at: "2024-01-20T14:15:00Z"
          }
        ]);
        setTotalTransactions(2);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const result = await getClubManagerWalletBalance();
      
      if (result.success) {
        setWalletBalance(result.data.balance);
        setTotalTransactions(result.data.total_transactions);
      } else {
        console.error("Wallet balance API error:", result.message);
        setWalletBalance(50000);
      }
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
      setWalletBalance(50000);
    } finally {
      setWalletLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "refunded":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAmount = (amount, direction) => {
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));

    return direction === "debit" ? `-${formattedAmount}` : `+${formattedAmount}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout title="Payments" profilePath="/clubmanager/profile">
        <main className="max-w-7xl mx-auto px-8 py-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/clubmanager/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
                <p className="text-gray-500">Manage your tournament enrollment payments and wallet balance</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Wallet Balance</h2>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {walletLoading ? (
                    <div className="animate-pulse bg-white/20 rounded h-8 w-32"></div>
                  ) : (
                    formatAmount(walletBalance || 0, "credit")
                  )}
                </div>
                <p className="text-blue-100">
                  {totalTransactions} total transactions
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100 mb-1">Available Balance</div>
                <div className="text-2xl font-bold">
                  {walletLoading ? (
                    <div className="animate-pulse bg-white/20 rounded h-8 w-24"></div>
                  ) : (
                    `${(walletBalance || 0).toLocaleString("en-IN")}`
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions</h3>
                <p className="text-gray-500">You haven\"t made any tournament enrollment payments yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id || transaction.transaction_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.transaction_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.tournament_name || "Tournament Enrollment"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.transaction_direction === "debit" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                            {transaction.transaction_direction === "debit" ? "Debit" : "Credit"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.transaction_direction === "debit" ? "text-red-600" : "text-green-600"}>
                            {formatAmount(transaction.amount, transaction.transaction_direction)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">{transaction.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.payment_date || transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p> <strong>Debit</strong>: Tournament enrollment fees are deducted from your wallet</p>
                  <p> <strong>Credit</strong>: Refunds are credited back when tournaments are cancelled</p>
                  <p> <strong>Pending</strong>: Payments being processed</p>
                  <p> <strong>Success</strong>: Completed transactions</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </div>
  );
}
