import { useState, useEffect } from 'react';
import Layout from '@/components/layouts/Layout';
import { getTransactions, getWalletBalance, getFinancialStats, downloadFinancialReport } from '@/api/adminService';
import { DollarSign, Calendar, CheckCircle, XCircle, Clock, Wallet, TrendingUp, TrendingDown, Download, X } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadWalletBalance();
    loadFinancialStats();
  }, [skip]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions(skip, limit);
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const result = await getWalletBalance();
      if (result.success) {
        setWalletBalance(result.data);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadFinancialStats = async () => {
    try {
      setStatsLoading(true);
      const result = await getFinancialStats();
      if (result.success) {
        setFinancialStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load financial stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const result = await downloadFinancialReport(
        reportType,
        reportType === 'custom' ? customStartDate : null,
        reportType === 'custom' ? customEndDate : null
      );
      if (result.success) {
        setShowReportModal(false);
      } else {
        alert(result.message || 'Failed to download report');
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout title="Transactions" profilePath="/admin/profile">
      <div className="space-y-6">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-lg">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/90 mb-1">Admin Wallet Balance</p>
                {walletLoading ? (
                  <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold">
                    ₹{walletBalance ? parseFloat(walletBalance.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Total Transactions</p>
              <p className="text-2xl font-semibold">{total}</p>
            </div>
          </div>
        </div>

        {/* Financial Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                {statsLoading ? (
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    ₹{financialStats ? financialStats.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Debits</p>
                {statsLoading ? (
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-red-600">
                    ₹{financialStats ? financialStats.total_debits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                )}
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Refunds</p>
                {statsLoading ? (
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{financialStats ? financialStats.total_refunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                )}
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Net Balance</p>
                {statsLoading ? (
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <p className={`text-2xl font-bold ${financialStats && financialStats.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ₹{financialStats ? financialStats.net_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
            <p className="text-sm text-gray-600 mt-1">Total: {total} transactions</p>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tournament
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Direction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {transaction.transaction_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {transaction.tournament_name || '-'}
                          </div>
                          {transaction.tournament_status && (
                            <div className="text-xs text-gray-500 capitalize">
                              {transaction.tournament_status.replace('_', ' ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {transaction.user_name || '-'}
                          </div>
                          {transaction.user_email && (
                            <div className="text-xs text-gray-500">
                              {transaction.user_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {transaction.transaction_type.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.transaction_direction === 'credit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.transaction_direction === 'credit' ? '↑ Credit' : '↓ Debit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(transaction.created_at).toLocaleString('en-IN')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Showing {skip + 1} to {Math.min(skip + limit, total)} of {total}
              </span>
              <button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Report Download Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Download Financial Report</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {reportType === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={downloading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={downloading || (reportType === 'custom' && (!customStartDate || !customEndDate))}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}