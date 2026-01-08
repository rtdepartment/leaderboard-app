'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// VARIATION C: Linear Ultra-Clean
// Softer dark, purple accents, generous whitespace, floating cards

export default function LinearLeaderboard() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [minGames, setMinGames] = useState(5)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerGames, setPlayerGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [mounted, setMounted] = useState(false)

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
      const statsWithStreaks = data?.map(player => ({
        ...player,
        current_streak: player.current_streak || '-',
        power_rating: calculatePowerRating(player)
      })) || []
      setStats(statsWithStreaks)
    }
    setLoading(false)
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

  // Power badge with gradient
  const PowerBadge = ({ rating, rank }) => {
    const isTop3 = rank <= 3

    return (
      <div
        className="inline-flex items-center justify-center px-4 py-2 rounded-xl transition-all duration-300"
        style={{
          background: isTop3
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.1))'
            : rating >= 60
            ? 'rgba(139, 92, 246, 0.1)'
            : 'rgba(113, 113, 122, 0.08)',
          boxShadow: isTop3 ? '0 0 30px rgba(139, 92, 246, 0.15)' : 'none',
          border: isTop3 ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent'
        }}
      >
        <span
          className="text-sm font-semibold"
          style={{
            color: isTop3 ? '#a78bfa' : rating >= 60 ? '#8b5cf6' : '#71717a'
          }}
        >
          {rating?.toFixed(1)}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111113' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #8b5cf6)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)'
            }}
          />
          <span className="text-zinc-500 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#111113' }}>
      {/* Gradient orb */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-12 lg:py-16">
        {/* Header */}
        <header className="mb-12 lg:mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                Season Active
              </div>
              <h1
                className="text-4xl lg:text-5xl font-semibold tracking-tight"
                style={{ color: '#fafafa' }}
              >
                Strikers
              </h1>
              <p className="mt-2 text-zinc-500">League standings and performance metrics</p>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#1a1a1c', border: '1px solid #27272a' }}
            >
              <span className="text-xs text-zinc-500">Sort by</span>
              <select
                className="bg-transparent text-zinc-200 text-sm focus:outline-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default" style={{ background: '#1a1a1c' }}>Power Index</option>
                <option value="name" style={{ background: '#1a1a1c' }}>Name</option>
                <option value="games_played" style={{ background: '#1a1a1c' }}>Games Played</option>
                <option value="wins" style={{ background: '#1a1a1c' }}>Wins</option>
                <option value="win_percentage" style={{ background: '#1a1a1c' }}>Win Rate</option>
                <option value="goal_differential" style={{ background: '#1a1a1c' }}>Goal Diff</option>
                <option value="net_rating" style={{ background: '#1a1a1c' }}>Net Rating</option>
              </select>
            </div>
          </div>
        </header>

        {/* Player Cards */}
        <div className="space-y-3">
          {sortedStats.map((player, index) => {
            const rank = index + 1
            const isTopThree = rank <= 3

            return (
              <div
                key={player.player_id}
                className="group rounded-2xl p-5 transition-all duration-300 cursor-pointer"
                style={{
                  background: isTopThree ? 'rgba(139, 92, 246, 0.03)' : '#161618',
                  border: `1px solid ${isTopThree ? 'rgba(139, 92, 246, 0.1)' : '#1f1f23'}`,
                  boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
                  animation: mounted ? `slideUp 0.5s ease-out ${index * 50}ms both` : 'none'
                }}
                onClick={() => fetchPlayerGames(player.player_id, player.name, player.country)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.3)'
                  e.currentTarget.style.borderColor = isTopThree ? 'rgba(139, 92, 246, 0.2)' : '#27272a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.2)'
                  e.currentTarget.style.borderColor = isTopThree ? 'rgba(139, 92, 246, 0.1)' : '#1f1f23'
                }}
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className="w-10 flex-shrink-0">
                    <span
                      className="text-2xl font-light"
                      style={{
                        color: rank === 1 ? '#a78bfa' : rank === 2 ? '#9ca3af' : rank === 3 ? '#cd7f32' : '#3f3f46'
                      }}
                    >
                      {rank}
                    </span>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {player.country && (
                        <span className="text-xl">{getCountryFlag(player.country)}</span>
                      )}
                      <span
                        className="text-lg font-medium capitalize truncate"
                        style={{ color: isTopThree ? '#fafafa' : '#e4e4e7' }}
                      >
                        {player.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span>{player.games_played} games</span>
                      <span>{(player.win_percentage || 0).toFixed(0)}% win rate</span>
                      <span className={player.goal_differential > 0 ? 'text-emerald-500' : player.goal_differential < 0 ? 'text-rose-400' : ''}>
                        {player.goal_differential > 0 ? '+' : ''}{player.goal_differential || 0} GD
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid - Desktop */}
                  <div className="hidden lg:flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <div className="text-zinc-500 text-xs mb-1">W-L-T</div>
                      <div className="text-zinc-300">
                        <span className="text-emerald-500">{player.wins || 0}</span>
                        <span className="text-zinc-600">-</span>
                        <span className="text-rose-400">{player.losses || 0}</span>
                        <span className="text-zinc-600">-</span>
                        <span className="text-zinc-500">{player.ties || 0}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-zinc-500 text-xs mb-1">NET</div>
                      <div className={player.avg_goal_diff > 0 ? 'text-emerald-500' : player.avg_goal_diff < 0 ? 'text-rose-400' : 'text-zinc-500'}>
                        {player.avg_goal_diff > 0 ? '+' : ''}{player.avg_goal_diff?.toFixed(1) || '0.0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-zinc-500 text-xs mb-1">STRK</div>
                      <div className={player.current_streak?.includes('W') ? 'text-emerald-500' : player.current_streak?.includes('L') ? 'text-rose-400' : 'text-zinc-500'}>
                        {player.current_streak || '-'}
                      </div>
                    </div>
                  </div>

                  {/* Power Badge */}
                  <div className="flex-shrink-0">
                    <PowerBadge rating={player.power_rating} rank={rank} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-zinc-800/50">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-600">
            <div className="flex items-center gap-4">
              <span>Power Index = Performance composite (0-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span>Click any player to view match history</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => { setSelectedPlayer(null); setPlayerGames([]) }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: '#161618',
              border: '1px solid #27272a',
              boxShadow: '0 25px 80px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedPlayer.country && (
                    <span className="text-2xl">{getCountryFlag(selectedPlayer.country)}</span>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold capitalize text-zinc-100">{selectedPlayer.name}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Recent performance</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedPlayer(null); setPlayerGames([]) }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {loadingGames ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-8 h-8 rounded-full animate-spin"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, #8b5cf6)',
                      WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 0)'
                    }}
                  />
                </div>
              ) : playerGames.length > 0 ? (
                <div className="space-y-2">
                  {playerGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-4 rounded-xl"
                      style={{ background: '#1a1a1c', border: '1px solid #27272a' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{
                            background: game.result === 'W' ? 'rgba(52, 211, 153, 0.1)' : game.result === 'L' ? 'rgba(251, 113, 133, 0.1)' : 'rgba(113, 113, 122, 0.1)',
                            color: game.result === 'W' ? '#34d399' : game.result === 'L' ? '#fb7185' : '#a1a1aa'
                          }}
                        >
                          {game.result === 'W' ? 'Victory' : game.result === 'L' ? 'Defeat' : 'Draw'}
                        </span>
                      </div>
                      <div className="text-center my-3">
                        <span className="text-3xl font-light text-zinc-100">
                          {game.playerScore} – {game.opponentScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">No recent matches</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
