import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api';
import { ArrowLeft, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

const PointsTable = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [pointsTable, setPointsTable] = useState([]);
  const [tournamentName, setTournamentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPointsTable();
    fetchTournamentDetails();
  }, [tournamentId]);

  const fetchPointsTable = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/point_table/tournament/${tournamentId}`);
      setPointsTable(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching points table:', err);
      setError(err.response?.data?.detail || 'Failed to fetch points table');
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentDetails = async () => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}`);
      setTournamentName(response.data.tournament_name);
    } catch (err) {
      console.error('Error fetching tournament details:', err);
    }
  };

  const formatNRR = (nrr) => {
    const value = parseFloat(nrr);
    if (isNaN(value)) return '0.000';
    const formatted = value.toFixed(3);
    return value > 0 ? `+${formatted}` : formatted;
  };

  const getNRRColor = (nrr) => {
    const value = parseFloat(nrr);
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading points table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Points Table</h1>
              {tournamentName && (
                <p className="text-gray-600 mt-1">{tournamentName}</p>
              )}
            </div>
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Points Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    M
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    T
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NRR
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pointsTable.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No data available. Points table will be updated after matches are completed.
                    </td>
                  </tr>
                ) : (
                  pointsTable.map((entry) => (
                    <tr
                      key={entry.team_id}
                      className={`hover:bg-gray-50 ${
                        entry.position <= 4 ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {entry.position}
                          </span>
                          {entry.position === 1 && (
                            <Trophy className="w-4 h-4 text-yellow-500 ml-2" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.team_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {entry.matches_played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                        {entry.matches_won}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                        {entry.matches_lost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {entry.matches_tied}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {entry.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`flex items-center justify-center text-sm font-medium ${getNRRColor(entry.net_run_rate)}`}>
                          {parseFloat(entry.net_run_rate) > 0 && (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          )}
                          {parseFloat(entry.net_run_rate) < 0 && (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {formatNRR(entry.net_run_rate)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Pos:</span>
              <span className="text-gray-600 ml-2">Position</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">M:</span>
              <span className="text-gray-600 ml-2">Matches Played</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">W:</span>
              <span className="text-gray-600 ml-2">Matches Won</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">L:</span>
              <span className="text-gray-600 ml-2">Matches Lost</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">T:</span>
              <span className="text-gray-600 ml-2">Matches Tied</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Pts:</span>
              <span className="text-gray-600 ml-2">Points (Win=2, Tie=1)</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">NRR:</span>
              <span className="text-gray-600 ml-2">Net Run Rate</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Note:</span> Points table is automatically updated after each match is completed. 
              Teams are ranked by Points, then NRR, then Wins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsTable;
