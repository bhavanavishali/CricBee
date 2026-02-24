import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getMyTournaments, getEnrolledClubs } from '@/api/organizer/tournament';
import { 
  createFixtureRound, 
  getTournamentRounds, 
  createMatch, 
  getRoundMatches,
  toggleMatchPublish,
  initializeLeagueFixtures,
  generateLeagueMatches,
  getLeagueStandings,
  getQualifiedTeams,
  updateMatchDetails,
  setTournamentFixtureMode
} from '@/api/organizer/fixture';
import { getPointTable } from '@/api/organizer/pointTable';
import { checkRoundStatus, addClubToRoundTwo, removeClubFromRoundTwo, getRoundTwoClubs } from '@/api/organizer/roundCompletion';
import { saveQualifiedTeams, getQualifiedTeams as getQualifiedTeamsForRound, completeTournamentWithWinner } from '@/api/organizer/roundProgression';
import Layout from '@/components/layouts/Layout';
import TossModal from '@/components/organizer/TossModal';
import { ArrowLeft, Plus, Calendar, Clock, MapPin, Users, Trophy, X, Check, Globe, EyeOff, RotateCcw, Play, Lock, Edit2, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const TournamentFixtures = () => {
  const navigate = useNavigate();
  const { tournamentId } = useParams();
  const [searchParams] = useSearchParams();
  const isLeagueMode = searchParams.get('type') === 'league';
  
  const [tournament, setTournament] = useState(null);
  const [enrolledClubs, setEnrolledClubs] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('rounds'); // 'rounds' or 'matches'
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundMatches, setRoundMatches] = useState([]);
  const [qualifiedTeams, setQualifiedTeams] = useState([]);
  const [leagueStandings, setLeagueStandings] = useState([]);
  const [initializingLeague, setInitializingLeague] = useState(false);
  const [generatingMatches, setGeneratingMatches] = useState(false);
  
  // Points table state
  const [pointTable, setPointTable] = useState([]);
  const [pointTableLoading, setPointTableLoading] = useState(false);
  
  // Round completion state
  const [roundStatus, setRoundStatus] = useState(null);
  const [showRoundCompleteModal, setShowRoundCompleteModal] = useState(false);
  const [selectedQualifiedTeams, setSelectedQualifiedTeams] = useState([]);
  const [submittingQualifiedTeams, setSubmittingQualifiedTeams] = useState(false);
  
  // Winner celebration modal state
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [tournamentWinner, setTournamentWinner] = useState(null);
  
  // Edit match state
  const [editingMatch, setEditingMatch] = useState(null);
  const [editMatchForm, setEditMatchForm] = useState({
    match_date: '',
    match_time: '',
    venue: ''
  });
  const [updatingMatch, setUpdatingMatch] = useState(false);
  
  // Round form state
  const [roundForm, setRoundForm] = useState({
    round_name: '',
    number_of_matches: 1
  });
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  
  // Match form state
  const [matchForm, setMatchForm] = useState({
    match_number: '',
    team_a_id: '',
    team_b_id: '',
    match_date: '',
    match_time: '',
    venue: ''
  });
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [selectedMatchForToss, setSelectedMatchForToss] = useState(null);

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  useEffect(() => {
    if (selectedRound) {
      loadRoundMatches(selectedRound.id);
    }
  }, [selectedRound]);

  useEffect(() => {
    if (selectedRound && roundMatches.length > 0) {
      checkRoundCompletion(selectedRound.id);
    }
  }, [selectedRound, roundMatches]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load tournament
      const tournaments = await getMyTournaments();
      const foundTournament = tournaments.find(t => t.id === parseInt(tournamentId));
      setTournament(foundTournament);
      
      // Check if fixture_mode_id is set, if not and we have a mode from URL, set it
      if (foundTournament && !foundTournament.fixture_mode_id) {
        if (isLeagueMode) {
          // Set fixture mode to League (ID: 2)
          try {
            await setTournamentFixtureMode(tournamentId, 2);
            // Reload tournament to get updated fixture_mode_id
            const updatedTournaments = await getMyTournaments();
            const updatedTournament = updatedTournaments.find(t => t.id === parseInt(tournamentId));
            setTournament(updatedTournament);
          } catch (error) {
            console.error('Failed to set fixture mode:', error);
            Swal.fire({ icon: 'error', title: 'Error!', text: 'Failed to set fixture mode. Please try again.' });
            return;
          }
        } else {
          // Set fixture mode to Manual (ID: 1)
          try {
            await setTournamentFixtureMode(tournamentId, 1);
            // Reload tournament to get updated fixture_mode_id
            const updatedTournaments = await getMyTournaments();
            const updatedTournament = updatedTournaments.find(t => t.id === parseInt(tournamentId));
            setTournament(updatedTournament);
          } catch (error) {
            console.error('Failed to set fixture mode:', error);
            Swal.fire({ icon: 'error', title: 'Error!', text: 'Failed to set fixture mode. Please try again.' });
            return;
          }
        }
      }
      
      // Load enrolled clubs (only clubs with successful payment are considered enrolled)
      const clubs = await getEnrolledClubs(tournamentId);
      // Filter to only show clubs that have successfully paid (actually enrolled)
      const enrolledClubsList = clubs.filter(c => c.payment_status === 'success');
      setEnrolledClubs(enrolledClubsList);
      
      // Log for debugging
      console.log('Enrolled clubs loaded:', enrolledClubsList.length, 'clubs');
      
      // Load rounds
      let roundsData = await getTournamentRounds(tournamentId);
      setRounds(roundsData);
      
      // If league mode and no rounds exist, initialize league structure
      if (isLeagueMode && roundsData.length === 0) {
        const newRounds = await handleInitializeLeagueFixtures();
        roundsData = newRounds || roundsData;
        setRounds(roundsData);
        
        // After initializing rounds, auto-generate matches for Round 1 (League)
        if (roundsData.length > 0) {
          const leagueRound = roundsData.find(r => r.round_no === 1 || r.round_name === 'League');
          if (leagueRound) {
            // First check if matches already exist
            const existingMatches = await loadRoundMatches(leagueRound.id);
            if (existingMatches.length === 0) {
              try {
                setGeneratingMatches(true);
                await generateLeagueMatches(leagueRound.id, tournamentId);
                await loadRoundMatches(leagueRound.id);
                // Auto-select Round 1 after generating matches
                setSelectedRound(leagueRound);
                setStep('matches');
              } catch (error) {
                console.error('Failed to auto-generate league matches:', error);
                // Don't show alert if matches already exist (backend returns existing matches)
                if (!error.response?.data?.detail?.includes('already exist')) {
                  Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to auto-generate league matches' });
                }
              } finally {
                setGeneratingMatches(false);
              }
            } else {
              // Matches already exist, just select the round
              setSelectedRound(leagueRound);
              setStep('matches');
            }
          }
        }
      }
      
      // If league mode and rounds exist, check if Round 1 matches need to be generated
      if (isLeagueMode && roundsData.length > 0) {
        const leagueRound = roundsData.find(r => r.round_no === 1 || r.round_name === 'League');
        if (leagueRound) {
          const existingMatches = await loadRoundMatches(leagueRound.id);
          if (existingMatches.length === 0) {
            // Auto-generate matches for Round 1 if they don't exist
            try {
              setGeneratingMatches(true);
              await generateLeagueMatches(leagueRound.id, tournamentId);
              await loadRoundMatches(leagueRound.id);
            } catch (error) {
              console.error('Failed to auto-generate league matches:', error);
              // Don't show alert if matches already exist (backend returns existing matches)
              if (!error.response?.data?.detail?.includes('already exist')) {
                Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to auto-generate league matches' });
              }
            } finally {
              setGeneratingMatches(false);
            }
          }
        }
        
        // Load qualified teams for playoff round
        try {
          const playoffRound = roundsData.find(r => r.round_name === 'Playoff');
          if (playoffRound) {
            const qualified = await getQualifiedTeams(tournamentId);
            setQualifiedTeams(qualified.qualified_team_ids || []);
          }
        } catch (error) {
          console.error('Failed to load qualified teams:', error);
        }
      }
      
      // Load points table
      try {
        const pointTableData = await getPointTable(tournamentId);
        setPointTable(pointTableData);
      } catch (error) {
        console.error('Failed to load points table:', error);
        // Don't show alert for points table error as it's not critical
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: 'Failed to load tournament data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeLeagueFixtures = async () => {
    try {
      setInitializingLeague(true);
      const newRounds = await initializeLeagueFixtures(tournamentId);
      return newRounds; // Return rounds so they can be used immediately
    } catch (error) {
      console.error('Failed to initialize league fixtures:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to initialize league fixtures' });
      return null;
    } finally {
      setInitializingLeague(false);
    }
  };

  const loadRoundMatches = async (roundId) => {
    try {
      const matches = await getRoundMatches(roundId, tournamentId);
      setRoundMatches(matches);
      return matches;
    } catch (error) {
      console.error('Failed to load matches:', error);
      return [];
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      setCreatingRound(true);
      const roundData = {
        tournament_id: parseInt(tournamentId),
        round_name: roundForm.round_name,
        number_of_matches: parseInt(roundForm.number_of_matches)
      };
      await createFixtureRound(roundData);
      setRoundForm({ round_name: '', number_of_matches: 1 });
      setShowRoundForm(false);
      await loadData();
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Round created successfully!' });
    } catch (error) {
      console.error('Failed to create round:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to create round' });
    } finally {
      setCreatingRound(false);
    }
  };

  // Get available teams for match creation based on round type
  const getAvailableTeams = () => {
    if (!selectedRound) return enrolledClubs;
    
    // For League round, all enrolled teams are available
    if (selectedRound.round_name === 'League') {
      return enrolledClubs;
    }
    
    // For Playoff round, only show qualified teams
    if (selectedRound.round_name === 'Playoff' && qualifiedTeams.length > 0) {
      return enrolledClubs.filter(club => qualifiedTeams.includes(club.club_id));
    }
    
    // For Final round, all enrolled teams (will be filtered based on playoff results)
    return enrolledClubs;
  };

  // Check if teams should be locked (League round matches are auto-generated)
  const isTeamsLocked = () => {
    return isLeagueMode && selectedRound && selectedRound.round_name === 'League';
  };

  // Check if match creation should be disabled
  const isMatchCreationDisabled = () => {
    return isLeagueMode && selectedRound && selectedRound.round_name === 'League';
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    if (matchForm.team_a_id === matchForm.team_b_id) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Team A and Team B cannot be the same' });
      return;
    }
    try {
      setCreatingMatch(true);
      const matchData = {
        round_id: selectedRound.id,
        tournament_id: parseInt(tournamentId),
        match_number: matchForm.match_number,
        team_a_id: parseInt(matchForm.team_a_id),
        team_b_id: parseInt(matchForm.team_b_id),
        match_date: matchForm.match_date,
        match_time: matchForm.match_time,
        venue: matchForm.venue
      };
      await createMatch(matchData);
      setMatchForm({
        match_number: '',
        team_a_id: '',
        team_b_id: '',
        match_date: '',
        match_time: '',
        venue: ''
      });
      setShowMatchForm(false);
      await loadRoundMatches(selectedRound.id);
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Match created successfully!' });
    } catch (error) {
      console.error('Failed to create match:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to create match' });
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleSelectRound = async (round) => {
    setSelectedRound(round);
    setStep('matches');
    setShowMatchForm(false);
    
    // If league mode and Round 1 (League) has no matches, auto-generate them
    if (isLeagueMode && round.round_name === 'League') {
      const matches = await loadRoundMatches(round.id);
      if (matches.length === 0) {
        try {
          setGeneratingMatches(true);
          await generateLeagueMatches(round.id, tournamentId);
          await loadRoundMatches(round.id);
          Swal.fire({ icon: 'success', title: 'Success!', text: 'League matches generated successfully! Please assign date and venue for each match.' });
        } catch (error) {
          console.error('Failed to generate league matches:', error);
          Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to generate league matches' });
        } finally {
          setGeneratingMatches(false);
        }
      } else {
        // Load standings for league round
        try {
          const standings = await getLeagueStandings(tournamentId, round.id);
          setLeagueStandings(standings.standings || []);
        } catch (error) {
          console.error('Failed to load standings:', error);
        }
      }
    }
    
    // If league mode and Playoff round, load qualified teams
    if (isLeagueMode && round.round_name === 'Playoff') {
      try {
        const qualified = await getQualifiedTeams(tournamentId);
        setQualifiedTeams(qualified.qualified_team_ids || []);
      } catch (error) {
        console.error('Failed to load qualified teams:', error);
      }
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Convert HH:MM:SS to HH:MM if needed
    return timeString.substring(0, 5);
  };

  const handleTogglePublish = async (matchId, currentStatus) => {
    try {
      const updatedMatch = await toggleMatchPublish(matchId);
      // Update the match in the local state
      setRoundMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchId 
            ? { ...match, is_fixture_published: updatedMatch.is_fixture_published }
            : match
        )
      );
      Swal.fire({ icon: 'success', title: 'Success!', text: updatedMatch.is_fixture_published ? 'Match published successfully!' : 'Match unpublished successfully!' });
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to toggle publish status' });
    }
  };

  const handleOpenToss = (match) => {
    // Check preconditions: match must be published and status should be "toss_pending"
    if (!match.is_fixture_published) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please publish the match before conducting the toss.' });
      return;
    }
    if (match.match_status && match.match_status !== 'toss_pending' && match.match_status !== 'upcoming') {
      if (match.toss_winner_id && match.toss_decision) {
        // Toss already completed, just show it
        setSelectedMatchForToss(match);
        setShowTossModal(true);
        return;
      } else {
        Swal.fire({ icon: 'warning', title: 'Warning', text: 'Match status does not allow toss at this time.' });
        return;
      }
    }
    setSelectedMatchForToss(match);
    setShowTossModal(true);
  };

  const handleTossSaved = async () => {
    // Reload matches to get updated toss info
    if (selectedRound) {
      await loadRoundMatches(selectedRound.id);
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    // Format time for input field (HH:MM)
    let timeValue = '';
    if (match.match_time) {
      const timeStr = typeof match.match_time === 'string' ? match.match_time : match.match_time.toString();
      timeValue = timeStr.substring(0, 5); // Extract HH:MM
    }
    setEditMatchForm({
      match_date: match.match_date,
      match_time: timeValue,
      venue: match.venue || ''
    });
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    
    try {
      setUpdatingMatch(true);
      const updateData = {
        match_date: editMatchForm.match_date,
        match_time: editMatchForm.match_time,
        venue: editMatchForm.venue
      };
      await updateMatchDetails(editingMatch.id, updateData);
      setEditingMatch(null);
      setEditMatchForm({ match_date: '', match_time: '', venue: '' });
      await loadRoundMatches(selectedRound.id);
      Swal.fire({ icon: 'success', title: 'Success!', text: 'Match details updated successfully!' });
    } catch (error) {
      console.error('Failed to update match:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to update match details' });
    } finally {
      setUpdatingMatch(false);
    }
  };

  // Check if round is complete
  const checkRoundCompletion = async (roundId) => {
    try {
      console.log('Frontend: Checking round completion for roundId:', roundId);
      console.log('Frontend: tournamentId:', tournamentId);
      console.log('Frontend: selectedRound:', selectedRound);
      const status = await checkRoundStatus(roundId, parseInt(tournamentId));
      console.log('Round completion status for round', roundId, ':', status);
      setRoundStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to check round status:', error);
      return null;
    }
  };

  // Get next round name based on current round
  // Tournament structure: Round 1 → Round 2 (Semi Final) → Round 3 (Final)
  const getNextRoundName = (currentRound) => {
    if (currentRound === 'League' || currentRound === 'Round 1') return 'Round 2';
    if (currentRound === 'Round 2') return 'Round 3';
    return 'Next Round';
  };

  // Load qualified teams for current round
  const loadQualifiedTeams = async () => {
    if (!selectedRound) return;
    
    try {
      const fromRound = selectedRound.round_name;
      const toRound = getNextRoundName(fromRound);
      const data = await getQualifiedTeamsForRound(parseInt(tournamentId), fromRound, toRound);
      setSelectedQualifiedTeams(data.club_ids || []);
    } catch (error) {
      console.error('Failed to load qualified teams:', error);
      setSelectedQualifiedTeams([]);
    }
  };

  // Show round complete modal
  const handleShowRoundComplete = async () => {
    await loadQualifiedTeams();
    setShowRoundCompleteModal(true);
  };

  // Toggle team selection
  const handleToggleTeamSelection = (clubId) => {
    setSelectedQualifiedTeams(prev => {
      if (prev.includes(clubId)) {
        return prev.filter(id => id !== clubId);
      } else {
        return [...prev, clubId];
      }
    });
  };

  // Submit qualified teams
  const handleSubmitQualifiedTeams = async () => {
    if (selectedQualifiedTeams.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select at least one team to qualify for the next round' });
      return;
    }

    try {
      setSubmittingQualifiedTeams(true);
      const fromRound = selectedRound.round_name;
      
      // Check if this is Round 3 (Final round)
      if (fromRound === 'Round 3') {
        // For Round 3, only one team should be selected as the winner
        if (selectedQualifiedTeams.length !== 1) {
          Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select exactly one team as the tournament winner' });
          setSubmittingQualifiedTeams(false);
          return;
        }
        
        const winnerTeamId = selectedQualifiedTeams[0];
        console.log('Frontend: Declaring tournament winner - tournamentId:', tournamentId, 'winnerTeamId:', winnerTeamId);
        const result = await completeTournamentWithWinner(parseInt(tournamentId), winnerTeamId);
        
        // Get winner team name from point table
        const winnerTeam = pointTable.find(team => team.team_id === winnerTeamId);
        
        // Show winner celebration modal
        setTournamentWinner({
          team_id: winnerTeamId,
          team_name: result.winner_team_name || winnerTeam?.team_name || 'Winner',
          tournament_name: result.tournament_name || tournament?.tournament_name || 'Tournament'
        });
        setShowRoundCompleteModal(false);
        setShowWinnerModal(true);
        
        // Reload tournament data
        loadData();
      } else {
        // For Round 1 and Round 2, save qualified teams for next round
        const toRound = getNextRoundName(fromRound);
        
        await saveQualifiedTeams(
          parseInt(tournamentId),
          fromRound,
          toRound,
          selectedQualifiedTeams
        );
        
        Swal.fire({ icon: 'success', title: 'Success!', text: `Successfully saved ${selectedQualifiedTeams.length} qualified teams for ${toRound}` });
        setShowRoundCompleteModal(false);
      }
    } catch (error) {
      console.error('Failed to save qualified teams:', error);
      Swal.fire({ icon: 'error', title: 'Error!', text: error.response?.data?.detail || 'Failed to save qualified teams' });
    } finally {
      setSubmittingQualifiedTeams(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="text-center py-12">
            <p className="text-gray-600">Tournament not found</p>
            <button
              onClick={() => navigate('/organizer/manage-fixtures')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Go back to Manage Fixtures
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (step === 'matches') {
                setStep('rounds');
                setSelectedRound(null);
              } else {
                navigate('/organizer/manage-fixtures');
              }
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>{step === 'matches' ? 'Back to Rounds' : 'Back to Manage Fixtures'}</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 'rounds' ? 'Create Fixture Rounds' : `Matches - ${selectedRound?.round_name}`}
              </h1>
              <p className="text-gray-600">{tournament.tournament_name}</p>
            </div>
            <button
              onClick={() => navigate(`/organizer/tournaments/${tournamentId}/points-table`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2"
            >
              <Trophy size={20} />
              <span>Points Table</span>
            </button>
          </div>
        </div>

        {/* Points Table */}
        {pointTable.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Trophy size={24} className="mr-2 text-yellow-500" />
                Points Table
              </h2>
              <button
                onClick={() => navigate(`/organizer/tournaments/${tournamentId}/points-table`)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Full Details →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900">Pos</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900">Team</th>
                    <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">M</th>
                    <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">W</th>
                    <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">L</th>
                    <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">T</th>
                    <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">Pts</th>
                    <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {pointTable.map((team, index) => (
                    <tr key={team.team_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-4 py-2 text-center font-semibold">
                        {team.position}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {team.team_name}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{team.matches_played}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{team.matches_won}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{team.matches_lost}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{team.matches_tied}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center font-bold text-green-600">
                        {team.points}
                      </td>
                      <td className={`border border-gray-200 px-4 py-2 text-center font-medium ${
                        team.net_run_rate > 0 ? 'text-green-600' : 
                        team.net_run_rate < 0 ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {team.net_run_rate.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pointTable.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No points table data available yet</p>
                <p className="text-sm">Points table will be available when matches are completed</p>
              </div>
            )}
          </div>
        )}

        {step === 'rounds' ? (
          /* Round Step */
          <div className="space-y-6">
            {/* League Mode Info */}
            {isLeagueMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-1">League Fixture Mode</p>
                <p className="text-sm text-green-700">
                  Three rounds will be automatically created: League → Playoff → Final
                </p>
              </div>
            )}
            
            {/* Create Round Form */}
            {!isLeagueMode && showRoundForm ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Create New Round</h2>
                  <button
                    onClick={() => {
                      setShowRoundForm(false);
                      setRoundForm({ round_name: '', number_of_matches: 1 });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateRound} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Round Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={roundForm.round_name}
                      onChange={(e) => setRoundForm({ ...roundForm, round_name: e.target.value })}
                      placeholder="e.g., Quarter Finals, Semi Finals, Finals"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Matches <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={roundForm.number_of_matches}
                      onChange={(e) => setRoundForm({ ...roundForm, number_of_matches: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={creatingRound}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {creatingRound ? 'Creating...' : 'Create Round'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoundForm(false);
                        setRoundForm({ round_name: '', number_of_matches: 1 });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              !isLeagueMode && (
                <button
                  onClick={() => setShowRoundForm(true)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Create New Round</span>
                </button>
              )
            )}

            {/* Rounds List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Fixture Rounds</h2>
              {rounds.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No rounds created yet</p>
                  <p className="text-sm text-gray-500 mt-2">Create your first round to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rounds.map((round) => (
                    <div
                      key={round.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectRound(round)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{round.round_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {round.number_of_matches} {round.number_of_matches === 1 ? 'match' : 'matches'}
                        </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">View Matches</span>
                          <ArrowLeft size={20} className="text-gray-400 rotate-180" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Match Step */
          <div className="space-y-6">
            {/* Create Match Form */}
            {showMatchForm ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Match</h2>
                    {enrolledClubs.length === 0 && (
                      <p className="text-sm text-orange-600 mt-1">
                        No enrolled clubs available. Please ensure clubs have enrolled and paid for this tournament.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowMatchForm(false);
                      setMatchForm({
                        match_number: '',
                        team_a_id: '',
                        team_b_id: '',
                        match_date: '',
                        match_time: '',
                        venue: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={matchForm.match_number}
                      onChange={(e) => setMatchForm({ ...matchForm, match_number: e.target.value })}
                      placeholder="e.g., Match 1, Match 2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team A <span className="text-red-500">*</span>
                        {isTeamsLocked() && <Lock size={14} className="inline ml-2 text-gray-500" />}
                      </label>
                      <select
                        required
                        disabled={enrolledClubs.length === 0 || isTeamsLocked()}
                        value={matchForm.team_a_id}
                        onChange={(e) => setMatchForm({ ...matchForm, team_a_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Team A</option>
                        {getAvailableTeams().length > 0 ? (
                          getAvailableTeams().map((club) => (
                            <option key={club.club_id} value={club.club_id}>
                              {club.club_name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No teams available</option>
                        )}
                      </select>
                      {isLeagueMode && selectedRound?.round_name === 'Playoff' && qualifiedTeams.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">Only qualified teams from League round are available</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team B <span className="text-red-500">*</span>
                        {isTeamsLocked() && <Lock size={14} className="inline ml-2 text-gray-500" />}
                      </label>
                      <select
                        required
                        disabled={enrolledClubs.length === 0 || isTeamsLocked()}
                        value={matchForm.team_b_id}
                        onChange={(e) => setMatchForm({ ...matchForm, team_b_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Team B</option>
                        {getAvailableTeams().length > 0 ? (
                          getAvailableTeams().map((club) => (
                            <option key={club.club_id} value={club.club_id}>
                              {club.club_name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No teams available</option>
                        )}
                      </select>
                      {isLeagueMode && selectedRound?.round_name === 'Playoff' && qualifiedTeams.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">Only qualified teams from League round are available</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Match Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={matchForm.match_date}
                        onChange={(e) => setMatchForm({ ...matchForm, match_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Match Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={matchForm.match_time}
                        onChange={(e) => setMatchForm({ ...matchForm, match_time: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={matchForm.venue}
                      onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                      placeholder="Enter venue name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={creatingMatch}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {creatingMatch ? 'Creating...' : 'Create Match'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMatchForm(false);
                        setMatchForm({
                          match_number: '',
                          team_a_id: '',
                          team_b_id: '',
                          match_date: '',
                          match_time: '',
                          venue: ''
                        });
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              !isMatchCreationDisabled() && (
                <button
                  onClick={() => setShowMatchForm(true)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Create New Match</span>
                </button>
              )
            )}
            
            {/* League Round Info */}
            {isLeagueMode && selectedRound?.round_name === 'League' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>League Round:</strong> Matches are auto-generated. Teams are pre-selected and locked. 
                  Please assign match date and venue for each match.
                </p>
              </div>
            )}
            
            {/* Playoff Round Info */}
            {isLeagueMode && selectedRound?.round_name === 'Playoff' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Playoff Round:</strong> Only qualified teams from League round can participate. 
                  {qualifiedTeams.length === 0 && ' Please complete League round first to see qualified teams.'}
                </p>
              </div>
            )}

            {/* League Standings for League Round */}
            {isLeagueMode && selectedRound?.round_name === 'League' && leagueStandings.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">League Standings</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">M</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">NRR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {leagueStandings.map((team, index) => (
                        <tr key={team.team_id} className={index < qualifiedTeams.length ? 'bg-green-50' : ''}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{team.team_name}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{team.matches_played}</td>
                          <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">{team.wins}</td>
                          <td className="px-4 py-3 text-center text-sm text-red-600">{team.losses}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-blue-600">{team.points}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{parseFloat(team.net_run_rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {qualifiedTeams.length > 0 && (
                  <p className="mt-4 text-sm text-green-600">
                    Top {qualifiedTeams.length} teams (highlighted) qualify for Playoff round
                  </p>
                )}
              </div>
            )}

            {/* Matches List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Matches in {selectedRound?.round_name}</h2>
                {/* Round Completion Check */}
                {isLeagueMode && selectedRound && (
                  <div className="flex items-center space-x-2">
                    {roundMatches.length > 0 && roundMatches.every(m => m.match_status === 'completed') ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        <Check size={16} className="mr-1" />
                        Round Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                        In Progress
                      </span>
                    )}
                  </div>
                )}
              </div>
              {roundMatches.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No matches created yet</p>
                  <p className="text-sm text-gray-500 mt-2">Create your first match to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roundMatches.map((match) => (
                    <div
                      key={match.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{match.match_number}</h3>
                            {match.is_fixture_published && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <Globe size={12} className="mr-1" />
                                Published
                              </span>
                            )}
                            {!match.is_fixture_published && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                <EyeOff size={12} className="mr-1" />
                                Unpublished
                              </span>
                            )}
                            {match.match_status === 'toss_pending' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                Toss Pending
                              </span>
                            )}
                            {match.match_status === 'toss_completed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                Toss Completed
                              </span>
                            )}
                            {match.match_status === 'live' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                🔴 Live
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users size={16} className="text-gray-600" />
                              <span className="font-semibold flex items-center">
                                {match.team_a_name}
                                {isLeagueMode && selectedRound?.round_name === 'League' && (
                                  <Lock size={12} className="ml-1 text-gray-400" title="Team locked (auto-generated)" />
                                )}
                              </span>
                              <span className="text-gray-500">vs</span>
                              <span className="font-semibold flex items-center">
                                {match.team_b_name}
                                {isLeagueMode && selectedRound?.round_name === 'League' && (
                                  <Lock size={12} className="ml-1 text-gray-400" title="Team locked (auto-generated)" />
                                )}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-gray-600">
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-2" />
                                <span>{new Date(match.match_date).toLocaleDateString('en-GB')}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock size={16} className="mr-2" />
                                <span>{formatTime(match.match_time)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-2" />
                                <span>{match.venue}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          {/* Edit button for league matches - always active */}
                          {isLeagueMode && selectedRound?.round_name === 'League' && (
                            <button
                              onClick={() => handleEditMatch(match)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center space-x-1"
                              title="Edit match date, time, and venue"
                            >
                              <Edit2 size={16} />
                              <span>Edit</span>
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenToss(match)}
                              disabled={!match.is_fixture_published}
                              className={`px-4 py-2 rounded-lg font-semibold flex items-center space-x-1 ${
                                match.is_fixture_published
                                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                              title={match.is_fixture_published ? 'Digital Toss' : 'Publish match first'}
                            >
                              <RotateCcw size={16} />
                              <span>Toss</span>
                            </button>
                            <button
                              onClick={() => navigate(`/organizer/matches/${match.id}/live-scoring`, { state: { match } })}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-1"
                              title="Live Scoring"
                            >
                              <Play size={16} />
                              <span>Score</span>
                            </button>
                          </div>
                          {/* Publish button - always active for league matches */}
                          <button
                            onClick={() => handleTogglePublish(match.id, match.is_fixture_published)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                              match.is_fixture_published
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {match.is_fixture_published ? (
                              <span className="flex items-center space-x-1">
                                <EyeOff size={16} />
                                <span>Unpublish</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1">
                                <Globe size={16} />
                                <span>Publish</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Confirm Round Completion Button */}
              {selectedRound && (() => {
                console.log('Button render - roundStatus:', roundStatus);
                console.log('Button render - is_complete:', roundStatus?.is_complete);
                console.log('Button render - completed/total:', roundStatus?.completed_matches, '/', roundStatus?.total_matches);
                return true;
              })() && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                        <CheckCircle size={24} className="mr-2" />
                        Confirm {selectedRound.round_name} Completion
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {roundStatus?.is_complete ? (
                          <>All {roundStatus.total_matches} matches completed. Click to confirm this round.</>
                        ) : (
                          <>Complete all matches to enable this button. ({roundStatus?.completed_matches || 0}/{roundStatus?.total_matches || 0} completed)</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleShowRoundComplete}
                      disabled={!roundStatus?.is_complete}
                      className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all ${
                        roundStatus?.is_complete
                          ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Trophy size={20} />
                      <span>Confirm Round Completion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Round Complete Modal - Points Table with Add to Round 2 */}
        {showRoundCompleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Trophy size={28} className="mr-2 text-yellow-500" />
                    {selectedRound?.round_name} Complete - Points Table
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedRound?.round_name === 'Round 3' ? (
                      <>Select the tournament winner ({selectedQualifiedTeams.length} selected - must select exactly 1)</>
                    ) : (
                      <>Select teams to qualify for {getNextRoundName(selectedRound?.round_name)} ({selectedQualifiedTeams.length} selected)</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowRoundCompleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                {pointTable.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">Select</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Pos</th>
                          <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Team</th>
                          <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">M</th>
                          <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">W</th>
                          <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">L</th>
                          <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">Pts</th>
                          <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900">NRR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointTable.map((team, index) => {
                          const isSelected = selectedQualifiedTeams.includes(team.team_id);
                          return (
                            <tr key={team.team_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-200 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleTeamSelection(team.team_id)}
                                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              </td>
                              <td className="border border-gray-200 px-4 py-3 text-center font-semibold">
                                {team.position}
                              </td>
                              <td className="border border-gray-200 px-4 py-3 font-medium">
                                {team.team_name}
                              </td>
                              <td className="border border-gray-200 px-4 py-3 text-center">{team.matches_played}</td>
                              <td className="border border-gray-200 px-4 py-3 text-center">{team.matches_won}</td>
                              <td className="border border-gray-200 px-4 py-3 text-center">{team.matches_lost}</td>
                              <td className="border border-gray-200 px-4 py-3 text-center font-bold text-green-600">
                                {team.points}
                              </td>
                              <td className={`border border-gray-200 px-4 py-3 text-center font-medium ${
                                team.net_run_rate > 0 ? 'text-green-600' : 
                                team.net_run_rate < 0 ? 'text-red-600' : 
                                'text-gray-600'
                              }`}>
                                {team.net_run_rate.toFixed(3)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No points table data available</p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedQualifiedTeams.length > 0 ? (
                      <span className="text-green-600 font-semibold">
                        {selectedQualifiedTeams.length} team{selectedQualifiedTeams.length !== 1 ? 's' : ''} selected
                      </span>
                    ) : (
                      <span className="text-orange-600">Please select at least one team</span>
                    )}
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowRoundCompleteModal(false)}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitQualifiedTeams}
                      disabled={submittingQualifiedTeams || selectedQualifiedTeams.length === 0}
                      className={`px-6 py-2 rounded-lg font-semibold flex items-center space-x-2 ${
                        submittingQualifiedTeams || selectedQualifiedTeams.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {submittingQualifiedTeams ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          <span>{selectedRound?.round_name === 'Round 3' ? 'Declare Tournament Winner' : 'Submit Qualified Teams'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toss Modal */}
        {showTossModal && selectedMatchForToss && (
          <TossModal
            isOpen={showTossModal}
            onClose={() => {
              setShowTossModal(false);
              setSelectedMatchForToss(null);
            }}
            match={selectedMatchForToss}
            onTossSaved={handleTossSaved}
          />
        )}

        {/* Edit Match Modal */}
        {editingMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Match Details</h2>
                <button
                  onClick={() => {
                    setEditingMatch(null);
                    setEditMatchForm({ match_date: '', match_time: '', venue: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Update date, time, and venue for <strong>{editingMatch.match_number}</strong>
              </p>
              <p className="text-xs text-blue-600 mb-2 flex items-center">
                <Lock size={14} className="mr-1" />
                Teams are locked: {editingMatch.team_a_name} vs {editingMatch.team_b_name}
              </p>
              {editingMatch.is_fixture_published && (
                <p className="text-xs text-orange-600 mb-4">
                  Note: Match is currently published. Changes will be visible to users.
                </p>
              )}
              <form onSubmit={handleUpdateMatch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editMatchForm.match_date}
                      onChange={(e) => setEditMatchForm({ ...editMatchForm, match_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Match Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={editMatchForm.match_time}
                      onChange={(e) => setEditMatchForm({ ...editMatchForm, match_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editMatchForm.venue}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, venue: e.target.value })}
                    placeholder="Enter venue name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={updatingMatch}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {updatingMatch ? 'Updating...' : 'Update Match'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMatch(null);
                      setEditMatchForm({ match_date: '', match_time: '', venue: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Winner Celebration Modal */}
        {showWinnerModal && tournamentWinner && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-2xl max-w-2xl w-full p-8 text-center animate-fadeIn">
              {/* Trophy Animation */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <Trophy size={100} className="text-yellow-500 animate-bounce" />
                  <div className="absolute -top-2 -right-2 text-4xl animate-pulse">🎉</div>
                  <div className="absolute -top-2 -left-2 text-4xl animate-pulse">🎊</div>
                  <div className="absolute -bottom-2 -right-2 text-4xl animate-pulse">⭐</div>
                  <div className="absolute -bottom-2 -left-2 text-4xl animate-pulse">✨</div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                🏆 Tournament Champion! 🏆
              </h2>

              {/* Winner Team Name */}
              <div className="bg-white rounded-xl p-6 mb-6 shadow-lg border-4 border-yellow-400">
                <p className="text-lg text-gray-600 mb-2">Tournament Winner</p>
                <p className="text-5xl font-bold text-yellow-600 mb-2">
                  {tournamentWinner.team_name}
                </p>
                <p className="text-xl text-gray-700 italic">
                  {tournamentWinner.tournament_name}
                </p>
              </div>

              {/* Celebration Message */}
              <div className="mb-6 text-lg text-gray-700">
                <p className="mb-2">🎊 Congratulations to the champions! 🎊</p>
                <p className="text-sm text-gray-600">
                  The tournament has been marked as <span className="font-semibold text-green-600">Completed</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    setTournamentWinner(null);
                  }}
                  className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    setTournamentWinner(null);
                    navigate(`/organizer/tournaments/${tournamentId}/details`);
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
                >
                  View Tournament Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TournamentFixtures;

