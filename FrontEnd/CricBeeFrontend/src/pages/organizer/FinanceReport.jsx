import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layouts/Layout';
import { getFinanceReport } from '@/api/organizer/tournament';
import jsPDF from 'jspdf';
// Import jspdf-autotable - v5 uses function import
import autoTable from 'jspdf-autotable';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function FinanceReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async (customFilter = null) => {
    try {
      setLoading(true);
      const filter = customFilter || filterType;
      const data = await getFinanceReport(
        filter,
        filter === 'custom' ? startDate : null,
        filter === 'custom' ? endDate : null
      );
      setReportData(data);
    } catch (error) {
      console.error('Failed to load finance report:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to load finance report' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    if (newFilter !== 'custom') {
      loadReport(newFilter);
    }
  };

  const handleCustomDateFilter = () => {
    if (!startDate || !endDate) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select both start and end dates' });
      return;
    }
    loadReport('custom');
  };

  const downloadCSV = () => {
    if (!reportData || !reportData.transactions || reportData.transactions.length === 0) {
      Swal.fire({ icon: 'info', title: 'Info', text: 'No data to export' });
      return;
    }

    // Create CSV content
    const headers = [
      'Transaction ID',
      'Tournament Name',
      'Transaction Type',
      'Amount (₹)',
      'Status',
      'Description',
      'Direction',
      'Date'
    ];

    const rows = reportData.transactions.map(t => [
      t.transaction_id || '',
      t.tournament_name || '',
      formatTransactionType(t.transaction_type),
      parseFloat(t.amount || 0).toFixed(2),
      t.status || '',
      t.description || '',
      t.transaction_direction || '',
      new Date(t.created_at).toLocaleString('en-IN')
    ]);

    // Add summary rows
    rows.push([]);
    rows.push(['Summary', '', '', '', '', '', '', '', '']);
    rows.push(['Total Revenue', '', '', parseFloat(reportData.total_revenue || 0).toFixed(2), '', '', '', '', '']);
    rows.push(['Total Debits', '', '', parseFloat(reportData.total_debits || 0).toFixed(2), '', '', '', '', '']);
    rows.push(['Net Balance', '', '', parseFloat(reportData.net_balance || 0).toFixed(2), '', '', '', '', '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finance_report_${filterType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTransactionType = (type) => {
    if (!type) return '—';
    // Convert snake_case to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const downloadPDF = () => {
    if (!reportData || !reportData.transactions || reportData.transactions.length === 0) {
      Swal.fire({ icon: 'info', title: 'Info', text: 'No data to export' });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Finance Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Filter info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const filterText = `Period: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    doc.text(filterText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Summary boxes
    const boxWidth = (pageWidth - 40) / 3;
    const boxHeight = 25;
    const startX = 14;
    
    // Total Revenue
    doc.setDrawColor(34, 197, 94); // Green
    doc.setFillColor(240, 253, 244); // Light green
    doc.rect(startX, yPosition, boxWidth, boxHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Revenue', startX + 5, yPosition + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`₹${parseFloat(reportData.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, startX + 5, yPosition + 15);
    
    // Total Debits
    doc.setDrawColor(239, 68, 68); // Red
    doc.setFillColor(254, 242, 242); // Light red
    doc.rect(startX + boxWidth + 6, yPosition, boxWidth, boxHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Debits', startX + boxWidth + 11, yPosition + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`₹${parseFloat(reportData.total_debits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, startX + boxWidth + 11, yPosition + 15);
    
    // Net Balance
    doc.setDrawColor(59, 130, 246); // Blue
    doc.setFillColor(239, 246, 255); // Light blue
    doc.rect(startX + (boxWidth + 6) * 2, yPosition, boxWidth, boxHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('Net Balance', startX + (boxWidth + 6) * 2 + 5, yPosition + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`₹${parseFloat(reportData.net_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, startX + (boxWidth + 6) * 2 + 5, yPosition + 15);
    
    yPosition += boxHeight + 15;

    // Transaction Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Details', 14, yPosition);
    yPosition += 8;

    // Table headers
    const tableHeaders = [
      ['Transaction ID', 'Tournament', 'Type', 'Amount', 'Direction', 'Status', 'Date']
    ];

    // Table data
    const tableData = reportData.transactions.map(t => [
      (t.transaction_id || '—').substring(0, 12) + (t.transaction_id && t.transaction_id.length > 12 ? '...' : ''),
      (t.tournament_name || '—').substring(0, 20) + (t.tournament_name && t.tournament_name.length > 20 ? '...' : ''),
      formatTransactionType(t.transaction_type).substring(0, 15),
      `₹${parseFloat(t.amount || 0).toFixed(2)}`,
      t.transaction_direction === 'credit' ? 'Credit' : 'Debit',
      t.status || '—',
      new Date(t.created_at).toLocaleDateString('en-IN')
    ]);

    // Add table using autoTable (v5 uses function call)
    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 }
      }
    });

    // Get final Y position after table
    // autoTable stores the final Y position in doc.lastAutoTable.finalY
    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) 
      ? doc.lastAutoTable.finalY 
      : yPosition + (tableData.length * 6) + 20;

    // Add summary at bottom if there's space
    if (finalY < pageHeight - 40) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 14, finalY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Transactions: ${reportData.total_transactions || 0}`, 14, finalY + 18);
    }

    // Save PDF
    const fileName = `finance_report_${filterType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'refunded':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionBadge = (direction) => {
    if (direction === 'credit') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <TrendingUp className="w-3 h-3" />
          Credit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <TrendingDown className="w-3 h-3" />
        Debit
      </span>
    );
  };

  return (
    <Layout title="Finance Report" profilePath="/organizer/profile">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={18} className="mr-2" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finance Report</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive financial overview of your tournaments</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Options</h2>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              {/* Filter Type Buttons */}
              <div className="flex gap-2">
                {['weekly', 'monthly', 'yearly', 'custom'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {filterType === 'custom' && (
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleCustomDateFilter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Refresh and Export Buttons */}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => loadReport()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={!reportData || loading}
                >
                  <FileText size={18} />
                  Export PDF
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!reportData || loading}
                >
                  <Download size={18} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{parseFloat(reportData.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Enrollment fees received</p>
              </div>

              {/* Total Debits */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Debits</p>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{parseFloat(reportData.total_debits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Tournament creation fees</p>
              </div>

              {/* Net Balance */}
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Net Balance</p>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{parseFloat(reportData.net_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Revenue - Debits</p>
              </div>

              {/* Total Transactions */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-purple-100">Total Transactions</p>
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{reportData.total_transactions || 0}</p>
                <p className="text-xs text-purple-100 mt-1">In selected period</p>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading report...</p>
            </div>
          ) : !reportData ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a filter to view finance report</p>
            </div>
          ) : reportData.transactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found for the selected period</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Transaction Details</h2>
              </div>
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
                        Transaction Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Direction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.transactions.map((transaction, index) => (
                      <tr key={`${transaction.transaction_id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {transaction.transaction_id || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{transaction.tournament_name}</p>
                            <p className="text-xs text-gray-500">#{transaction.tournament_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                            {formatTransactionType(transaction.transaction_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{parseFloat(transaction.amount || 0).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getDirectionBadge(transaction.transaction_direction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm text-gray-600 truncate" title={transaction.description}>
                            {transaction.description || '—'}
                          </div>
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
          )}
        </div>
      </div>
    </Layout>
  );
}

