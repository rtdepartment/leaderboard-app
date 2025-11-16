'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LeaderboardPage() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [minGames, setMinGames] = useState(5)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerGames, setPlayerGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(false)

  // Helper function to get team name
  const getTeamName = (team) => {
    return team === 'A' ? 'Black' : 'White'
  }

  // Helper function to get team color styling
  const getTeamStyle = (team) => {
    if (team === 'A') {
      return { color: '#1f2937', fontWeight: '600' }
    } else {
      return { color: '#6b7280', fontWeight: '600' }
    }
  }

  // Country flag helper function
  const getCountryFlag = (countryCode) => {
    const flags = {
      'EG': '🇪🇬', 'HT': '🇭🇹', 'JO': '🇯🇴', 'VN': '🇻🇳', 'UZ': '🇺🇿', 'KE': '🇰🇪', 'FR': '🇫🇷',
      'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪', 'BR': '🇧🇷', 'IN': '🇮🇳'
    }
    return countryCode ? (flags[countryCode] || '') : ''
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')

    if (error) {
      console.error('Error fetching stats:', error)
    } else {
      const statsWithStreaks = await calculateStreaksForPlayers(data || [])
      setStats(statsWithStreaks)
    }
    setLoading(false)
  }

  const calculateStreaksForPlayers = async (playerStats) => {
    const statsWithStreaks = []
    
    for (const player of playerStats) {
      let streak = player.current_streak || '-'
      const power = calculatePowerRating(player)
      
      statsWithStreaks.push({
        ...player,
        current_streak: streak,
        power_rating: power
      })
    }
    
    return statsWithStreaks
  }

  const calculatePowerRating = (player) => {
    const winPct = player.win_percentage || 0
    const avgGoalDiff = player.avg_goal_diff || 0
    const gamesPlayed = player.games_played || 0
    
    const winComponent = (winPct / 100) * 50
    const goalDiffNormalized = Math.max(0, Math.min(1, (avgGoalDiff + 3) / 6))
    const netRatingComponent = goalDiffNormalized * 35
    const experienceComponent = Math.min(15, (gamesPlayed / 20) * 15)
    
    const totalPower = winComponent + netRatingComponent + experienceComponent
    return Math.min(100, Math.round(totalPower * 10) / 10)
  }

  // Fetch player's last 5 games
  const fetchPlayerGames = async (playerId, playerName) => {
    setSelectedPlayer({ id: playerId, name: playerName })
    setLoadingGames(true)
    
    try {
      const { data: gamePlayerData, error: gpError } = await supabase
        .from('game_players')
        .select('game_id, team')
        .eq('player_id', playerId)
        .order('game_id', { ascending: false })
        .limit(5)

      if (gpError) throw gpError

      if (gamePlayerData && gamePlayerData.length > 0) {
        const gameIds = gamePlayerData.map(gp => gp.game_id)
        
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('id, game_date, team_a_score, team_b_score')
          .in('id', gameIds)
          .order('game_date', { ascending: false })

        if (gamesError) throw gamesError

        const formattedGames = games.map(game => {
          const playerGame = gamePlayerData.find(gp => gp.game_id === game.id)
          const playerTeam = playerGame.team
          const playerScore = playerTeam === 'A' ? game.team_a_score : game.team_b_score
          const opponentScore = playerTeam === 'A' ? game.team_b_score : game.team_a_score
          
          let result = 'T'
          if (playerScore > opponentScore) result = 'W'
          else if (playerScore < opponentScore) result = 'L'
          
          return {
            ...game,
            date: game.game_date,
            playerTeam,
            playerScore,
            opponentScore,
            result
          }
        })
        
        setPlayerGames(formattedGames)
      }
    } catch (error) {
      console.error('Error fetching player games:', error)
    }
    
    setLoadingGames(false)
  }

  const closePlayerModal = () => {
    setSelectedPlayer(null)
    setPlayerGames([])
  }

  // Sorting logic
  const sortedStats = [...stats].filter(player => player.games_played >= minGames).sort((a, b) => {
    switch(sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'games_played': return (b.games_played || 0) - (a.games_played || 0)
      case 'wins': return (b.wins || 0) - (a.wins || 0)
      case 'win_percentage': return (b.win_percentage || 0) - (a.win_percentage || 0)
      case 'goal_differential': return (b.goal_differential || 0) - (a.goal_differential || 0)
      case 'net_rating': return (b.avg_goal_diff || 0) - (a.avg_goal_diff || 0)
      default: return (b.power_rating || 0) - (a.power_rating || 0)
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add simple CSS for tooltips */}
      <style jsx>{`
        .has-tooltip {
          position: relative;
          cursor: help;
        }
        
        .has-tooltip .tooltip {
          visibility: hidden;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          margin-bottom: 8px;
          font-weight: normal;
          text-transform: none;
          max-width: 200px;
          text-align: center;
        }
        
        .has-tooltip:hover .tooltip {
          visibility: visible;
        }
        
        .has-tooltip .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1f2937;
        }

        @media (max-width: 768px) {
          .has-tooltip .tooltip {
            display: none;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 px-2">
            Strikers Leaderboard
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow-sm mx-2 sm:mx-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Sort By
            </label>
            <select 
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Power Rating</option>
              <option value="name">Name</option>
              <option value="games_played">Games Played</option>
              <option value="wins">Wins</option>
              <option value="win_percentage">Win %</option>
              <option value="goal_differential">Goal Diff</option>
              <option value="net_rating">Net Rating</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-2 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">Player</th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    GP
                    <span className="tooltip">Games Played: Total number of games</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">W</th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">L</th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">T</th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">Win%</th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    GD
                    <span className="tooltip">Goal Differential: Total goals scored minus conceded</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    OFF
                    <span className="tooltip">Offensive Rating: Avg goals scored per game</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    DEF
                    <span className="tooltip">Defensive Rating: Avg goals conceded per game</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    NET
                    <span className="tooltip">Net Rating: Avg goal differential per game</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    STRK
                    <span className="tooltip">Current Streak: Consecutive wins or losses</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    <span style={{ 
                      background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold'
                    }}>PWR</span>
                    <span className="tooltip">Power Rating: Overall performance score (0-100)</span>
                  </th>
                  
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider has-tooltip">
                    LAST
                    <span className="tooltip">Last Played: Date of most recent game</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedStats.map((player, index) => {
                  const rank = index + 1
                  const winPct = player.win_percentage || 0
                  
                  return (
                    <tr 
                      key={player.player_id}
                      className={`
                        transition-colors
                        ${rank === 1 ? 'bg-yellow-50 hover:bg-yellow-100' : 
                          rank === 2 ? 'bg-gray-50 hover:bg-gray-100' : 
                          rank === 3 ? 'bg-orange-50 hover:bg-orange-100' : 
                          'hover:bg-gray-50'}
                      `}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm">
                        <span className={`
                          ${rank <= 3 ? 'font-bold' : 'font-normal'}
                          ${rank === 1 ? 'text-yellow-600' : 
                            rank === 2 ? 'text-gray-500' : 
                            rank === 3 ? 'text-orange-500' : 'text-gray-700'}
                        `}>
                          {rank}
                        </span>
                      </td>
                      
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {player.country && (
                            <span className="text-sm sm:text-lg">{getCountryFlag(player.country)}</span>
                          )}
                          <span 
                            className="font-medium text-gray-900 capitalize cursor-pointer hover:text-blue-600"
                            onClick={() => fetchPlayerGames(player.player_id, player.name)}
                          >
                            {player.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600">
                        {player.games_played || 0}
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-green-600 font-medium">{player.wins || 0}</span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-red-600 font-medium">{player.losses || 0}</span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-500">
                        {player.ties || 0}
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium">
                        {winPct.toFixed(1)}%
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className={`font-medium ${
                          player.goal_differential > 0 ? 'text-green-600' : 
                          player.goal_differential < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {player.goal_differential > 0 && '+'}{player.goal_differential || 0}
                        </span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600">
                        {player.avg_goals_for?.toFixed(1) || '0.0'}
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600">
                        {player.avg_goals_against?.toFixed(1) || '0.0'}
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className={`font-medium ${
                          player.avg_goal_diff > 0 ? 'text-green-600' : 
                          player.avg_goal_diff < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {player.avg_goal_diff > 0 && '+'}{player.avg_goal_diff?.toFixed(1) || '0.0'}
                        </span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className={`font-medium ${
                          player.current_streak?.includes('W') ? 'text-green-600' : 
                          player.current_streak?.includes('L') ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {player.current_streak || '-'}
                        </span>
                      </td>

                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                        <div style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          background: player.power_rating >= 70 
                            ? 'linear-gradient(135deg, #0F766E, #10B981)'
                            : player.power_rating >= 50 
                            ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
                            : player.power_rating >= 30
                            ? 'linear-gradient(135deg, #6366F1, #A78BFA)'
                            : 'linear-gradient(135deg, #F472B6, #EF4444)',
                          color: 'white',
                          minWidth: '35px'
                        }}>
                          {player.power_rating?.toFixed(1) || '0.0'}
                        </div>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600">
                        {player.last_played 
                          ? new Date(player.last_played + 'T12:00:00').toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric'
                            })
                          : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closePlayerModal}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold capitalize">
                {selectedPlayer.name}'s Last 5 Games
              </h2>
              <button 
                onClick={closePlayerModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {loadingGames ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading games...</p>
                </div>
              ) : playerGames.length > 0 ? (
                <div className="space-y-2">
                  {playerGames.map((game, idx) => (
                    <div key={game.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          {new Date(game.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className={`
                          px-2 py-1 rounded text-xs font-bold
                          ${game.result === 'W' ? 'bg-green-100 text-green-800' : 
                            game.result === 'L' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {game.result === 'W' ? 'WIN' : game.result === 'L' ? 'LOSS' : 'TIE'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-xl font-bold text-gray-900">
                          {game.playerScore} - {game.opponentScore}
                        </span>
                      </div>
                      <div className="text-center mt-1 text-xs">
                        <span style={getTeamStyle(game.playerTeam)}>
                          {game.playerTeam === 'A' ? '⚫' : '⚪'} {getTeamName(game.playerTeam)}
                        </span>
                        <span className="text-gray-400 mx-1">vs</span>
                        <span style={getTeamStyle(game.playerTeam === 'A' ? 'B' : 'A')}>
                          {game.playerTeam === 'A' ? '⚪' : '⚫'} {getTeamName(game.playerTeam === 'A' ? 'B' : 'A')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recent games found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}