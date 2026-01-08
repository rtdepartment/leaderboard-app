'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function LeaderboardPage() {
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [minGames, setMinGames] = useState(5)
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerGames, setPlayerGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showMobileTooltip, setShowMobileTooltip] = useState(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const tableRef = useRef(null)

  // Tooltip definitions
  const tooltips = {
    GP: { title: "Games Played", description: "Total matches participated" },
    GD: { title: "Goal Difference", description: "Goals scored minus conceded" },
    OFF: { title: "Offensive Rating", description: "Avg goals scored per game" },
    DEF: { title: "Defensive Rating", description: "Avg goals conceded per game" },
    NET: { title: "Net Rating", description: "OFF minus DEF per game" },
    STREAK: { title: "Current Streak", description: "Consecutive W/L results" },
    POWER: { title: "Power Index", description: "Composite performance metric (0-100)" },
    LAST: { title: "Last Played", description: "Most recent match date" }
  }

  const getTeamName = (team) => team === 'A' ? 'Black' : 'White'

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

  // Track horizontal scroll to hide swipe indicator
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current && tableRef.current.scrollLeft > 20) {
        setHasScrolled(true)
      }
    }
    const ref = tableRef.current
    if (ref) {
      ref.addEventListener('scroll', handleScroll)
      return () => ref.removeEventListener('scroll', handleScroll)
    }
  }, [loading])

  // Mobile tooltip handler
  const handleMobileTooltip = (tooltipKey) => {
    if (window.innerWidth >= 768) return // Desktop uses hover

    if (showMobileTooltip === tooltipKey) {
      setShowMobileTooltip(null)
    } else {
      setShowMobileTooltip(tooltipKey)
      // Auto-dismiss after 3 seconds
      setTimeout(() => setShowMobileTooltip(null), 3000)
    }
  }

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

  const fetchPlayerGames = async (playerId, playerName, playerCountry) => {
    setSelectedPlayer({ id: playerId, name: playerName, country: playerCountry })
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

          return { ...game, date: game.game_date, playerTeam, playerScore, opponentScore, result }
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

  // Rank badge component
  const RankBadge = ({ rank }) => {
    if (rank === 1) {
      return (
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-full opacity-20" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }} />
          <span className="relative text-sm font-bold" style={{ color: '#fbbf24' }}>1</span>
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-full opacity-15" style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)' }} />
          <span className="relative text-sm font-bold" style={{ color: '#9ca3af' }}>2</span>
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-full opacity-15" style={{ background: 'linear-gradient(135deg, #cd7f32, #b87333)' }} />
          <span className="relative text-sm font-bold" style={{ color: '#cd7f32' }}>3</span>
        </div>
      )
    }
    return <span className="text-sm text-zinc-500 w-8 text-center tabular-nums">{rank}</span>
  }

  // Power Rating component with premium styling
  const PowerBadge = ({ rating, rank }) => {
    const isElite = rating >= 70
    const isStrong = rating >= 50

    let bgStyle = {}
    let glowStyle = {}
    let textColor = '#a1a1aa'

    if (rank === 1) {
      bgStyle = { background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))' }
      glowStyle = { boxShadow: '0 0 20px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }
      textColor = '#fbbf24'
    } else if (rank === 2) {
      bgStyle = { background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.15), rgba(107, 114, 128, 0.1))' }
      glowStyle = { boxShadow: '0 0 15px rgba(156, 163, 175, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }
      textColor = '#d1d5db'
    } else if (rank === 3) {
      bgStyle = { background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.1))' }
      glowStyle = { boxShadow: '0 0 15px rgba(205, 127, 50, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }
      textColor = '#cd7f32'
    } else if (isElite) {
      bgStyle = { background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08))' }
      textColor = '#4ade80'
    } else if (isStrong) {
      bgStyle = { background: 'rgba(59, 130, 246, 0.1)' }
      textColor = '#60a5fa'
    } else {
      bgStyle = { background: 'rgba(113, 113, 122, 0.1)' }
    }

    return (
      <div
        className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg transition-all duration-200"
        style={{
          ...bgStyle,
          ...glowStyle,
          minWidth: '52px',
          border: rank <= 3 ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
      >
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: textColor }}
        >
          {rating?.toFixed(1)}
        </span>
      </div>
    )
  }

  // Stat value with subtle coloring
  const StatValue = ({ value, positive, showSign = false, muted = false }) => {
    if (muted || value === 0) {
      return <span className="text-zinc-600 tabular-nums">{value}</span>
    }

    const isPositive = positive !== undefined ? positive : value > 0
    const color = isPositive ? '#4ade80' : '#f87171'
    const sign = showSign && value > 0 ? '+' : ''

    return (
      <span className="tabular-nums" style={{ color }}>
        {sign}{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
      </span>
    )
  }

  // Tooltip component
  const Tooltip = ({ tooltip, position = 'top' }) => {
    if (!tooltip) return null
    return (
      <div
        className="absolute z-50 pointer-events-none"
        style={{
          bottom: position === 'top' ? '100%' : 'auto',
          top: position === 'bottom' ? '100%' : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: position === 'top' ? '8px' : 0,
          marginTop: position === 'bottom' ? '8px' : 0
        }}
      >
        <div
          className="px-3 py-2 rounded-lg text-center"
          style={{
            background: 'rgba(24, 24, 27, 0.98)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            minWidth: '180px'
          }}
        >
          <div className="text-xs font-medium text-zinc-300 mb-0.5">{tooltip.title}</div>
          <div className="text-xs text-zinc-500">{tooltip.description}</div>
        </div>
      </div>
    )
  }

  // Column header with tooltip (hover on desktop, tap on mobile)
  const ColumnHeader = ({ label, tooltipKey, className = '', highlight = false }) => (
    <th
      className={`px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider relative cursor-help transition-colors duration-150 ${className}`}
      style={{ color: highlight ? '#fbbf24' : '#71717a' }}
      onMouseEnter={() => setActiveTooltip(tooltipKey)}
      onMouseLeave={() => setActiveTooltip(null)}
      onClick={() => handleMobileTooltip(tooltipKey)}
    >
      {label}
      {/* Desktop tooltip (hover) */}
      {activeTooltip === tooltipKey && <Tooltip tooltip={tooltips[tooltipKey]} />}
      {/* Mobile tooltip (tap) */}
      {showMobileTooltip === tooltipKey && (
        <div
          className="absolute z-50 sm:hidden"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px'
          }}
        >
          <div
            className="px-3 py-2 rounded-lg text-center"
            style={{
              background: 'rgba(24, 24, 27, 0.98)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              minWidth: '160px'
            }}
          >
            <div className="text-xs font-medium mb-0.5" style={{ color: '#fbbf24' }}>{tooltips[tooltipKey]?.title}</div>
            <div className="text-xs text-zinc-400">{tooltips[tooltipKey]?.description}</div>
          </div>
        </div>
      )}
    </th>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090b' }}>
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" />
          </div>
          <p className="text-zinc-500 text-sm">Loading standings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>
      {/* Subtle gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(251, 191, 36, 0.03) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: '#fbbf24' }}>
                Season Rankings
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight"
                style={{ color: '#fafafa' }}
              >
                Strikers
              </h1>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Sort</span>
              <select
                className="appearance-none px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#e4e4e7'
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Power Index</option>
                <option value="name">Name</option>
                <option value="games_played">Games Played</option>
                <option value="wins">Wins</option>
                <option value="win_percentage">Win Rate</option>
                <option value="goal_differential">Goal Diff</option>
                <option value="net_rating">Net Rating</option>
              </select>
            </div>
          </div>
        </header>

        {/* Main Table Card */}
        <div
          className="rounded-xl overflow-hidden relative"
          style={{
            background: '#0f0f11',
            border: '1px solid #1f1f23',
            boxShadow: '0 4px 40px rgba(0,0,0,0.4)'
          }}
        >
          {/* Mobile Swipe Indicator */}
          {!hasScrolled && (
            <div
              className="sm:hidden absolute top-0 right-0 bottom-0 w-12 pointer-events-none z-10 flex items-center justify-center"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(251, 191, 36, 0.1))',
              }}
            >
              <div
                className="flex flex-col items-center gap-1 animate-pulse"
                style={{ color: '#fbbf24' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                  swipe
                </span>
              </div>
            </div>
          )}

          {/* Mobile Tip Bar */}
          <div
            className="sm:hidden px-4 py-2.5 flex items-center justify-between"
            style={{ background: '#141417', borderBottom: '1px solid #1f1f23' }}
          >
            <span className="text-xs text-zinc-500">Tap headers for info</span>
            <span className="text-xs text-zinc-500">Tap names for history</span>
          </div>

          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#141417', borderBottom: '1px solid #1f1f23' }}>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 w-10 sm:w-16">#</th>
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Player</th>
                  <ColumnHeader label="GP" tooltipKey="GP" />
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">W</th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">L</th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider text-zinc-600">T</th>
                  <th className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">Win%</th>
                  <ColumnHeader label="GD" tooltipKey="GD" />
                  <ColumnHeader label="OFF" tooltipKey="OFF" className="hidden lg:table-cell" />
                  <ColumnHeader label="DEF" tooltipKey="DEF" className="hidden lg:table-cell" />
                  <ColumnHeader label="NET" tooltipKey="NET" />
                  <ColumnHeader label="STRK" tooltipKey="STREAK" />
                  <ColumnHeader label="PWR" tooltipKey="POWER" highlight />
                  <ColumnHeader label="Last" tooltipKey="LAST" className="hidden sm:table-cell" />
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((player, index) => {
                  const rank = index + 1
                  const winPct = player.win_percentage || 0
                  const isTopThree = rank <= 3
                  const animationDelay = mounted ? `${index * 30}ms` : '0ms'

                  return (
                    <tr
                      key={player.player_id}
                      className="group transition-all duration-200"
                      style={{
                        background: isTopThree ?
                          rank === 1 ? 'rgba(251, 191, 36, 0.03)' :
                          rank === 2 ? 'rgba(156, 163, 175, 0.02)' :
                          'rgba(205, 127, 50, 0.02)' :
                          'transparent',
                        borderBottom: '1px solid #1a1a1d',
                        animation: mounted ? `fadeSlideIn 0.4s ease-out ${animationDelay} both` : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isTopThree ?
                          rank === 1 ? 'rgba(251, 191, 36, 0.06)' :
                          rank === 2 ? 'rgba(156, 163, 175, 0.04)' :
                          'rgba(205, 127, 50, 0.04)' :
                          'rgba(255, 255, 255, 0.02)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isTopThree ?
                          rank === 1 ? 'rgba(251, 191, 36, 0.03)' :
                          rank === 2 ? 'rgba(156, 163, 175, 0.02)' :
                          'rgba(205, 127, 50, 0.02)' :
                          'transparent'
                      }}
                    >
                      {/* Rank */}
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <RankBadge rank={rank} />
                      </td>

                      {/* Player */}
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <button
                          onClick={() => fetchPlayerGames(player.player_id, player.name, player.country)}
                          className="flex items-center gap-2 sm:gap-3 transition-colors duration-150 hover:text-amber-400 text-left active:text-amber-500"
                        >
                          {player.country && (
                            <span className="text-base sm:text-lg opacity-80">{getCountryFlag(player.country)}</span>
                          )}
                          <span
                            className="text-sm font-medium capitalize"
                            style={{ color: isTopThree ? '#fafafa' : '#e4e4e7' }}
                          >
                            {player.name}
                          </span>
                        </button>
                      </td>

                      {/* GP */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm text-zinc-400 tabular-nums">
                        {player.games_played || 0}
                      </td>

                      {/* W */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm">
                        <StatValue value={player.wins || 0} positive={true} />
                      </td>

                      {/* L */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm">
                        <StatValue value={player.losses || 0} positive={false} />
                      </td>

                      {/* T */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm text-zinc-600 tabular-nums">
                        {player.ties || 0}
                      </td>

                      {/* Win% */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm font-medium text-zinc-200 tabular-nums">
                        {winPct.toFixed(1)}%
                      </td>

                      {/* GD */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm">
                        <StatValue value={player.goal_differential || 0} showSign />
                      </td>

                      {/* OFF - hidden on mobile */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm text-zinc-400 tabular-nums hidden lg:table-cell">
                        {player.avg_goals_for?.toFixed(1) || '0.0'}
                      </td>

                      {/* DEF - hidden on mobile */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm text-zinc-400 tabular-nums hidden lg:table-cell">
                        {player.avg_goals_against?.toFixed(1) || '0.0'}
                      </td>

                      {/* NET */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm">
                        <StatValue value={player.avg_goal_diff || 0} showSign />
                      </td>

                      {/* Streak */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm">
                        <span
                          className="font-medium tabular-nums"
                          style={{
                            color: player.current_streak?.includes('W') ? '#4ade80' :
                                   player.current_streak?.includes('L') ? '#f87171' : '#52525b'
                          }}
                        >
                          {player.current_streak || '-'}
                        </span>
                      </td>

                      {/* PWR */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center">
                        <PowerBadge rating={player.power_rating} rank={rank} />
                      </td>

                      {/* Last Played - hidden on mobile */}
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center text-xs sm:text-sm text-zinc-500 hidden sm:table-cell">
                        {player.last_played
                          ? new Date(player.last_played + 'T12:00:00').toLocaleDateString('en-US', {
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

        {/* Footer Legend */}
        <footer className="mt-6 px-2">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-600">
            <span>GP: Games</span>
            <span>GD: Goal Diff</span>
            <span className="hidden sm:inline">OFF: Offense</span>
            <span className="hidden sm:inline">DEF: Defense</span>
            <span>NET: Net Rating</span>
            <span>STRK: Streak</span>
            <span style={{ color: '#fbbf24' }}>PWR: Power Index</span>
          </div>
        </footer>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }}
          onClick={closePlayerModal}
        >
          <div
            className="w-full max-w-md rounded-xl overflow-hidden"
            style={{
              background: '#0f0f11',
              border: '1px solid #27272a',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid #1f1f23' }}
            >
              <div className="flex items-center gap-3">
                {selectedPlayer.country && (
                  <span className="text-xl">{getCountryFlag(selectedPlayer.country)}</span>
                )}
                <div>
                  <h2 className="text-lg font-medium capitalize text-zinc-100">
                    {selectedPlayer.name}
                  </h2>
                  <p className="text-xs text-zinc-500">Recent Matches</p>
                </div>
              </div>
              <button
                onClick={closePlayerModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loadingGames ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-amber-500 animate-spin" />
                </div>
              ) : playerGames.length > 0 ? (
                <div className="space-y-2">
                  {playerGames.map((game) => (
                    <div
                      key={game.id}
                      className="p-4 rounded-lg"
                      style={{ background: '#18181b', border: '1px solid #27272a' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-zinc-500">
                          {new Date(game.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background: game.result === 'W' ? 'rgba(74, 222, 128, 0.1)' :
                                       game.result === 'L' ? 'rgba(248, 113, 113, 0.1)' :
                                       'rgba(113, 113, 122, 0.1)',
                            color: game.result === 'W' ? '#4ade80' :
                                   game.result === 'L' ? '#f87171' : '#a1a1aa'
                          }}
                        >
                          {game.result === 'W' ? 'WIN' : game.result === 'L' ? 'LOSS' : 'DRAW'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-light text-zinc-100 tabular-nums">
                          {game.playerScore} – {game.opponentScore}
                        </span>
                      </div>
                      <div className="text-center mt-2 text-xs text-zinc-500">
                        <span>{game.playerTeam === 'A' ? 'Black' : 'White'}</span>
                        <span className="mx-2">vs</span>
                        <span>{game.playerTeam === 'A' ? 'White' : 'Black'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No recent matches</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Keyframes */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar for dark theme */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #09090b;
        }
        ::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }

        /* Tabular numbers */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}
