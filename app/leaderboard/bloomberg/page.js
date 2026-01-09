'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

// VARIATION B: Bloomberg Terminal
// Pure black background, orange accents, data-dense, monospace numbers

export default function BloombergLeaderboard() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [minGames, setMinGames] = useState(5)
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerGames, setPlayerGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [mounted, setMounted] = useState(false)

  const tooltips = {
    GP: { title: "GAMES PLAYED", description: "Total matches participated" },
    GD: { title: "GOAL DIFF", description: "Goals scored minus conceded" },
    OFF: { title: "OFF RTG", description: "Avg goals scored per game" },
    DEF: { title: "DEF RTG", description: "Avg goals conceded per game" },
    NET: { title: "NET RTG", description: "OFF minus DEF per game" },
    STREAK: { title: "STREAK", description: "Consecutive W/L results" },
    POWER: { title: "PWR INDEX", description: "Composite metric (0-100)" },
    LAST: { title: "LAST", description: "Most recent match" }
  }

  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return ''
    const codePoints = [...countryCode.toUpperCase()].map(
      char => 127397 + char.charCodeAt(0)
    )
    return String.fromCodePoint(...codePoints)
  }

  useEffect(() => {
    setMounted(true)
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('player_stats').select('*')
    if (!error) {
      const statsWithStreaks = await calculateStreaksForPlayers(data || [])
      setStats(statsWithStreaks)
    }
    setLoading(false)
  }

  const calculateStreaksForPlayers = async (playerStats) => {
    return playerStats.map(player => ({
      ...player,
      current_streak: player.current_streak || '-',
      power_rating: calculatePowerRating(player)
    }))
  }

  const calculatePowerRating = (player) => {
    const winPct = player.win_percentage || 0
    const avgGoalDiff = player.avg_goal_diff || 0
    const gamesPlayed = player.games_played || 0
    const winComponent = (winPct / 100) * 50
    const goalDiffNormalized = Math.max(0, Math.min(1, (avgGoalDiff + 3) / 6))
    const netRatingComponent = goalDiffNormalized * 35
    const experienceComponent = Math.min(15, (gamesPlayed / 20) * 15)
    return Math.min(100, Math.round((winComponent + netRatingComponent + experienceComponent) * 10) / 10)
  }

  const fetchPlayerGames = async (playerId, playerName, playerCountry) => {
    setSelectedPlayer({ id: playerId, name: playerName, country: playerCountry })
    setLoadingGames(true)
    try {
      const { data: gamePlayerData } = await supabase
        .from('game_players')
        .select('game_id, team')
        .eq('player_id', playerId)
        .order('game_id', { ascending: false })
        .limit(5)

      if (gamePlayerData?.length > 0) {
        const gameIds = gamePlayerData.map(gp => gp.game_id)
        const { data: games } = await supabase
          .from('games')
          .select('id, game_date, team_a_score, team_b_score')
          .in('id', gameIds)
          .order('game_date', { ascending: false })

        setPlayerGames(games?.map(game => {
          const playerGame = gamePlayerData.find(gp => gp.game_id === game.id)
          const playerTeam = playerGame.team
          const playerScore = playerTeam === 'A' ? game.team_a_score : game.team_b_score
          const opponentScore = playerTeam === 'A' ? game.team_b_score : game.team_a_score
          const result = playerScore > opponentScore ? 'W' : playerScore < opponentScore ? 'L' : 'T'
          return { ...game, date: game.game_date, playerTeam, playerScore, opponentScore, result }
        }) || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setLoadingGames(false)
  }

  const sortedStats = [...stats].filter(p => p.games_played >= minGames).sort((a, b) => {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-orange-500 font-mono text-sm animate-pulse">LOADING DATA...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header Bar */}
      <div className="border-b border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-orange-500 text-xs font-bold tracking-wider">LIVE</span>
            </div>
            <span className="text-zinc-500 text-xs">STRIKERS LEAGUE</span>
          </div>
          <div className="text-xs text-zinc-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title Section */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">POWER RANKINGS</h1>
            <p className="text-xs text-zinc-500 mt-1">SEASON STANDINGS BY PERFORMANCE INDEX</p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/team-builder"
              className="text-xs font-mono px-3 py-1.5 border transition-colors"
              style={{ background: '#f97316', borderColor: '#f97316', color: '#000' }}
            >
              TEAM BALANCER
            </a>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">SORT:</span>
              <select
              className="bg-zinc-900 border border-zinc-800 text-orange-500 text-xs px-3 py-1.5 font-mono focus:outline-none focus:border-orange-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">PWR INDEX</option>
              <option value="name">NAME</option>
              <option value="games_played">GAMES</option>
              <option value="wins">WINS</option>
              <option value="win_percentage">WIN%</option>
              <option value="goal_differential">GD</option>
              <option value="net_rating">NET</option>
            </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-3 py-2 text-left text-zinc-500 font-normal">RK</th>
                  <th className="px-3 py-2 text-left text-zinc-500 font-normal">PLAYER</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal">GP</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal">W</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal">L</th>
                  <th className="px-3 py-2 text-center text-zinc-600 font-normal">T</th>
                  <th className="px-3 py-2 text-center text-zinc-400 font-normal">WIN%</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal">GD</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal hidden lg:table-cell">OFF</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal hidden lg:table-cell">DEF</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal">NET</th>
                  <th className="px-3 py-2 text-center text-zinc-500 font-normal">STK</th>
                  <th className="px-3 py-2 text-center text-orange-500 font-bold">PWR</th>
                  <th className="px-3 py-2 text-center text-zinc-600 font-normal hidden sm:table-cell">LAST</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((player, index) => {
                  const rank = index + 1
                  const isTopThree = rank <= 3

                  return (
                    <tr
                      key={player.player_id}
                      className={`border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors ${isTopThree ? 'bg-orange-500/5' : ''}`}
                      style={{
                        animation: mounted ? `fadeIn 0.3s ease-out ${index * 20}ms both` : 'none'
                      }}
                    >
                      {/* Rank */}
                      <td className="px-3 py-2.5">
                        <span className={`${rank === 1 ? 'text-orange-500 font-bold' : rank <= 3 ? 'text-orange-400' : 'text-zinc-500'}`}>
                          {String(rank).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Player */}
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => fetchPlayerGames(player.player_id, player.name, player.country)}
                          className="flex items-center gap-2 hover:text-orange-500 transition-colors text-left"
                        >
                          {player.country && (
                            <span className="text-sm opacity-70">{getCountryFlag(player.country)}</span>
                          )}
                          <span className={`uppercase tracking-wide ${isTopThree ? 'text-white font-medium' : 'text-zinc-300'}`}>
                            {player.name}
                          </span>
                        </button>
                      </td>

                      {/* Stats */}
                      <td className="px-3 py-2.5 text-center text-zinc-400">{player.games_played || 0}</td>
                      <td className="px-3 py-2.5 text-center text-green-500">{player.wins || 0}</td>
                      <td className="px-3 py-2.5 text-center text-red-500">{player.losses || 0}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-600">{player.ties || 0}</td>
                      <td className="px-3 py-2.5 text-center text-white font-medium">{(player.win_percentage || 0).toFixed(1)}</td>

                      <td className="px-3 py-2.5 text-center">
                        <span className={player.goal_differential > 0 ? 'text-green-500' : player.goal_differential < 0 ? 'text-red-500' : 'text-zinc-600'}>
                          {player.goal_differential > 0 ? '+' : ''}{player.goal_differential || 0}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center text-zinc-400 hidden lg:table-cell">{player.avg_goals_for?.toFixed(1) || '0.0'}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-400 hidden lg:table-cell">{player.avg_goals_against?.toFixed(1) || '0.0'}</td>

                      <td className="px-3 py-2.5 text-center">
                        <span className={player.avg_goal_diff > 0 ? 'text-green-500' : player.avg_goal_diff < 0 ? 'text-red-500' : 'text-zinc-600'}>
                          {player.avg_goal_diff > 0 ? '+' : ''}{player.avg_goal_diff?.toFixed(1) || '0.0'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <span className={player.current_streak?.includes('W') ? 'text-green-500' : player.current_streak?.includes('L') ? 'text-red-500' : 'text-zinc-600'}>
                          {player.current_streak || '-'}
                        </span>
                      </td>

                      {/* PWR - Hero column */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`font-bold ${rank === 1 ? 'text-orange-500' : rank <= 3 ? 'text-orange-400' : player.power_rating >= 60 ? 'text-white' : 'text-zinc-400'}`}>
                          {player.power_rating?.toFixed(1)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center text-zinc-600 hidden sm:table-cell">
                        {player.last_played ? new Date(player.last_played + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-4">
            <span>GP:GAMES</span>
            <span>GD:GOAL DIFF</span>
            <span>NET:NET RATING</span>
            <span className="text-orange-500">PWR:POWER INDEX</span>
          </div>
          <span>DATA REFRESHED LIVE</span>
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/90"
          onClick={() => { setSelectedPlayer(null); setPlayerGames([]) }}
        >
          <div
            className="w-full max-w-md border border-zinc-800 bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedPlayer.country && <span>{getCountryFlag(selectedPlayer.country)}</span>}
                <span className="text-white uppercase font-bold">{selectedPlayer.name}</span>
              </div>
              <button onClick={() => { setSelectedPlayer(null); setPlayerGames([]) }} className="text-zinc-500 hover:text-white">
                [X]
              </button>
            </div>

            <div className="p-4">
              <div className="text-xs text-zinc-500 mb-3">RECENT MATCHES</div>
              {loadingGames ? (
                <div className="text-center py-8 text-orange-500 animate-pulse">LOADING...</div>
              ) : playerGames.length > 0 ? (
                <div className="space-y-2">
                  {playerGames.map((game) => (
                    <div key={game.id} className="border border-zinc-800 p-3 flex items-center justify-between">
                      <span className="text-zinc-500 text-xs">
                        {new Date(game.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      </span>
                      <span className="text-white font-bold">{game.playerScore} - {game.opponentScore}</span>
                      <span className={`text-xs font-bold ${game.result === 'W' ? 'text-green-500' : game.result === 'L' ? 'text-red-500' : 'text-zinc-500'}`}>
                        {game.result === 'W' ? 'WIN' : game.result === 'L' ? 'LOSS' : 'DRAW'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-600">NO DATA</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
