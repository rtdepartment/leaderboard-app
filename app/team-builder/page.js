'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function TeamBuilderPage() {
  const [playerInput, setPlayerInput] = useState('')
  const [allPlayers, setAllPlayers] = useState([])
  const [playerStats, setPlayerStats] = useState([])
  const [matchedPlayers, setMatchedPlayers] = useState([])
  const [unmatchedNames, setUnmatchedNames] = useState([])
  const [teamA, setTeamA] = useState([]) // Black team
  const [teamB, setTeamB] = useState([]) // White team
  const [unassigned, setUnassigned] = useState([])
  const [loading, setLoading] = useState(true)
  const [balanceInfo, setBalanceInfo] = useState(null)
  const [teamSize, setTeamSize] = useState(6)
  const [showStats, setShowStats] = useState(true)
  const [draggedPlayer, setDraggedPlayer] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [balanceHistory, setBalanceHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)

    // Fetch all active players
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('name')

    // Fetch player stats
    const { data: statsData, error: statsError } = await supabase
      .from('player_stats')
      .select('*')

    if (!playersError && !statsError) {
      setAllPlayers(playersData || [])
      // Calculate power rating for each player
      const statsWithPower = (statsData || []).map(player => ({
        ...player,
        power_rating: calculatePowerRating(player)
      }))
      setPlayerStats(statsWithPower)
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

    const totalPower = winComponent + netRatingComponent + experienceComponent
    return Math.min(100, Math.round(totalPower * 10) / 10)
  }

  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return ''
    const codePoints = [...countryCode.toUpperCase()].map(
      char => 127397 + char.charCodeAt(0)
    )
    return String.fromCodePoint(...codePoints)
  }

  // Fuzzy matching function
  const fuzzyMatch = (input, target) => {
    const inputLower = input.toLowerCase().trim()
    const targetLower = target.toLowerCase()

    // Exact match
    if (inputLower === targetLower) return { match: true, score: 100 }

    // Starts with
    if (targetLower.startsWith(inputLower)) return { match: true, score: 90 }

    // Contains
    if (targetLower.includes(inputLower)) return { match: true, score: 80 }

    // First name match
    const targetFirstName = targetLower.split(' ')[0]
    if (targetFirstName === inputLower) return { match: true, score: 85 }

    // Levenshtein distance for typos (simple version)
    const distance = levenshteinDistance(inputLower, targetLower)
    if (distance <= 2 && inputLower.length > 3) return { match: true, score: 70 - distance * 10 }

    return { match: false, score: 0 }
  }

  const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length

    const matrix = []
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[b.length][a.length]
  }

  // Parse player names from textarea input
  const parsePlayerNames = () => {
    const lines = playerInput.split('\n')
    const names = []

    lines.forEach(line => {
      // Split by comma, tab, or multiple spaces
      const parts = line.split(/[,\t]|\s{2,}/).map(s => s.trim()).filter(s => s.length > 0)
      names.push(...parts)
    })

    return names.filter(name => name.length > 0)
  }

  // Match input names to database players
  const matchPlayers = () => {
    const inputNames = parsePlayerNames()
    const matched = []
    const unmatched = []
    const usedPlayerIds = new Set()

    inputNames.forEach(inputName => {
      let bestMatch = null
      let bestScore = 0

      allPlayers.forEach(player => {
        if (usedPlayerIds.has(player.id)) return

        const { match, score } = fuzzyMatch(inputName, player.name)
        if (match && score > bestScore) {
          bestScore = score
          bestMatch = player
        }
      })

      if (bestMatch && bestScore >= 50) {
        const stats = playerStats.find(s => s.player_id === bestMatch.id)
        matched.push({
          ...bestMatch,
          stats: stats || null,
          power_rating: stats?.power_rating || 50, // Default to 50 if no stats
          inputName: inputName
        })
        usedPlayerIds.add(bestMatch.id)
      } else {
        unmatched.push(inputName)
      }
    })

    setMatchedPlayers(matched)
    setUnmatchedNames(unmatched)
    setUnassigned(matched.map(p => p.id))
    setTeamA([])
    setTeamB([])
    setBalanceInfo(null)
  }

  // Karmarkar-Karp inspired differencing algorithm for optimal team balance
  const balanceTeams = () => {
    if (matchedPlayers.length < 2) return

    const players = matchedPlayers.map(p => ({
      id: p.id,
      power: p.power_rating
    }))

    const totalPlayers = players.length
    const teamSizeA = Math.ceil(totalPlayers / 2)
    const teamSizeB = Math.floor(totalPlayers / 2)

    // Sort players by power rating (descending)
    const sortedPlayers = [...players].sort((a, b) => b.power - a.power)

    // Greedy algorithm with optimization
    // Alternate assignment while trying to keep teams balanced
    let teamAPlayers = []
    let teamBPlayers = []
    let teamASum = 0
    let teamBSum = 0

    sortedPlayers.forEach((player, index) => {
      // For first few picks, use snake draft (1-2-2-1 pattern)
      if (index < 4) {
        if (index === 0 || index === 3) {
          teamAPlayers.push(player.id)
          teamASum += player.power
        } else {
          teamBPlayers.push(player.id)
          teamBSum += player.power
        }
      } else {
        // After initial picks, assign to team with lower total
        // But respect team size limits
        const canAddToA = teamAPlayers.length < teamSizeA
        const canAddToB = teamBPlayers.length < teamSizeB

        if (canAddToA && canAddToB) {
          if (teamASum <= teamBSum) {
            teamAPlayers.push(player.id)
            teamASum += player.power
          } else {
            teamBPlayers.push(player.id)
            teamBSum += player.power
          }
        } else if (canAddToA) {
          teamAPlayers.push(player.id)
          teamASum += player.power
        } else if (canAddToB) {
          teamBPlayers.push(player.id)
          teamBSum += player.power
        }
      }
    })

    // Local search optimization - try swaps to improve balance
    let improved = true
    while (improved) {
      improved = false
      for (let i = 0; i < teamAPlayers.length; i++) {
        for (let j = 0; j < teamBPlayers.length; j++) {
          const playerA = players.find(p => p.id === teamAPlayers[i])
          const playerB = players.find(p => p.id === teamBPlayers[j])

          const currentDiff = Math.abs(teamASum - teamBSum)
          const newTeamASum = teamASum - playerA.power + playerB.power
          const newTeamBSum = teamBSum - playerB.power + playerA.power
          const newDiff = Math.abs(newTeamASum - newTeamBSum)

          if (newDiff < currentDiff) {
            // Swap improves balance
            teamAPlayers[i] = playerB.id
            teamBPlayers[j] = playerA.id
            teamASum = newTeamASum
            teamBSum = newTeamBSum
            improved = true
            break
          }
        }
        if (improved) break
      }
    }

    setTeamA(teamAPlayers)
    setTeamB(teamBPlayers)
    setUnassigned([])

    // Calculate balance info
    const avgA = teamAPlayers.length > 0 ? teamASum / teamAPlayers.length : 0
    const avgB = teamBPlayers.length > 0 ? teamBSum / teamBPlayers.length : 0
    const powerDiff = Math.abs(teamASum - teamBSum)
    const balanceScore = Math.max(0, 100 - powerDiff * 2)

    setBalanceInfo({
      teamATotal: Math.round(teamASum * 10) / 10,
      teamBTotal: Math.round(teamBSum * 10) / 10,
      teamAAvg: Math.round(avgA * 10) / 10,
      teamBAvg: Math.round(avgB * 10) / 10,
      powerDiff: Math.round(powerDiff * 10) / 10,
      balanceScore: Math.round(balanceScore)
    })

    // Add to history
    const historyEntry = {
      timestamp: new Date().toISOString(),
      teamA: teamAPlayers.map(id => matchedPlayers.find(p => p.id === id)?.name),
      teamB: teamBPlayers.map(id => matchedPlayers.find(p => p.id === id)?.name),
      balanceScore: Math.round(balanceScore)
    }
    setBalanceHistory(prev => [historyEntry, ...prev.slice(0, 9)])
  }

  // Drag and drop handlers
  const handleDragStart = (e, playerId, source) => {
    setDraggedPlayer({ id: playerId, source })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, target) => {
    e.preventDefault()
    if (!draggedPlayer) return

    const { id: playerId, source } = draggedPlayer
    if (source === target) return

    // Remove from source
    if (source === 'unassigned') {
      setUnassigned(prev => prev.filter(id => id !== playerId))
    } else if (source === 'teamA') {
      setTeamA(prev => prev.filter(id => id !== playerId))
    } else if (source === 'teamB') {
      setTeamB(prev => prev.filter(id => id !== playerId))
    }

    // Add to target
    if (target === 'unassigned') {
      setUnassigned(prev => [...prev, playerId])
    } else if (target === 'teamA') {
      setTeamA(prev => [...prev, playerId])
    } else if (target === 'teamB') {
      setTeamB(prev => [...prev, playerId])
    }

    setDraggedPlayer(null)
    recalculateBalance()
  }

  const movePlayer = (playerId, from, to) => {
    if (from === 'unassigned') {
      setUnassigned(prev => prev.filter(id => id !== playerId))
    } else if (from === 'teamA') {
      setTeamA(prev => prev.filter(id => id !== playerId))
    } else if (from === 'teamB') {
      setTeamB(prev => prev.filter(id => id !== playerId))
    }

    if (to === 'unassigned') {
      setUnassigned(prev => [...prev, playerId])
    } else if (to === 'teamA') {
      setTeamA(prev => [...prev, playerId])
    } else if (to === 'teamB') {
      setTeamB(prev => [...prev, playerId])
    }

    // Recalculate after state updates
    setTimeout(recalculateBalance, 0)
  }

  const recalculateBalance = () => {
    setTimeout(() => {
      const getTeamPower = (teamIds) => {
        return teamIds.reduce((sum, id) => {
          const player = matchedPlayers.find(p => p.id === id)
          return sum + (player?.power_rating || 50)
        }, 0)
      }

      const teamASum = getTeamPower(teamA)
      const teamBSum = getTeamPower(teamB)
      const avgA = teamA.length > 0 ? teamASum / teamA.length : 0
      const avgB = teamB.length > 0 ? teamBSum / teamB.length : 0
      const powerDiff = Math.abs(teamASum - teamBSum)
      const balanceScore = Math.max(0, 100 - powerDiff * 2)

      if (teamA.length > 0 || teamB.length > 0) {
        setBalanceInfo({
          teamATotal: Math.round(teamASum * 10) / 10,
          teamBTotal: Math.round(teamBSum * 10) / 10,
          teamAAvg: Math.round(avgA * 10) / 10,
          teamBAvg: Math.round(avgB * 10) / 10,
          powerDiff: Math.round(powerDiff * 10) / 10,
          balanceScore: Math.round(balanceScore)
        })
      }
    }, 50)
  }

  // Swap teams entirely
  const swapTeams = () => {
    const tempA = [...teamA]
    setTeamA([...teamB])
    setTeamB(tempA)
  }

  // Reset everything
  const resetTeams = () => {
    setTeamA([])
    setTeamB([])
    setUnassigned(matchedPlayers.map(p => p.id))
    setBalanceInfo(null)
  }

  // Export teams as text
  const exportTeams = () => {
    const getPlayerNames = (teamIds) => {
      return teamIds.map(id => {
        const player = matchedPlayers.find(p => p.id === id)
        return player?.name || 'Unknown'
      }).join('\n')
    }

    const text = `STRIKERS TEAM BALANCE
Generated: ${new Date().toLocaleString()}
Balance Score: ${balanceInfo?.balanceScore || 'N/A'}%

BLACK TEAM (PWR: ${balanceInfo?.teamATotal || 0})
${getPlayerNames(teamA) || 'No players'}

WHITE TEAM (PWR: ${balanceInfo?.teamBTotal || 0})
${getPlayerNames(teamB) || 'No players'}`

    navigator.clipboard.writeText(text).then(() => {
      alert('Teams copied to clipboard!')
    })
  }

  // Player card component matching premium aesthetic
  const PlayerCard = ({ playerId, source, showPower = true }) => {
    const player = matchedPlayers.find(p => p.id === playerId)
    if (!player) return null

    const getPowerColor = (power) => {
      if (power >= 70) return '#22c55e' // Green
      if (power >= 50) return '#eab308' // Yellow
      return '#ef4444' // Red
    }

    return (
      <div
        draggable="true"
        onDragStart={(e) => handleDragStart(e, playerId, source)}
        onDragEnd={() => setDraggedPlayer(null)}
        className="group relative"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          margin: '4px 0',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          cursor: 'grab',
          userSelect: 'none',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.05) 100%)'
          e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        }}
      >
        <span className="text-lg">{getCountryFlag(player.country)}</span>
        <span className="flex-1 text-white font-medium">{player.name}</span>

        {showPower && showStats && (
          <span
            className="text-sm font-bold px-2 py-0.5 rounded"
            style={{
              color: getPowerColor(player.power_rating),
              background: `${getPowerColor(player.power_rating)}20`
            }}
          >
            {player.power_rating}
          </span>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {source === 'unassigned' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  movePlayer(playerId, source, 'teamA')
                }}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10"
                style={{ color: '#a3a3a3' }}
                title="Move to Black Team"
              >
                B
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  movePlayer(playerId, source, 'teamB')
                }}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10"
                style={{ color: '#f5f5f5' }}
                title="Move to White Team"
              >
                W
              </button>
            </>
          )}

          {source === 'teamA' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  movePlayer(playerId, source, 'teamB')
                }}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10"
                style={{ color: '#fbbf24' }}
                title="Swap to White Team"
              >
                ⇄
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  movePlayer(playerId, source, 'unassigned')
                }}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10"
                style={{ color: '#ef4444' }}
                title="Remove"
              >
                ×
              </button>
            </>
          )}

          {source === 'teamB' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  movePlayer(playerId, source, 'teamA')
                }}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10"
                style={{ color: '#fbbf24' }}
                title="Swap to Black Team"
              >
                ⇄
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  movePlayer(playerId, source, 'unassigned')
                }}
                className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10"
                style={{ color: '#ef4444' }}
                title="Remove"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Team panel component
  const TeamPanel = ({ title, teamIds, teamKey, color, total, avg }) => (
    <div
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, teamKey)}
      className="flex-1 min-h-[300px] rounded-xl p-4"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ background: color }}
          />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-sm text-neutral-400">({teamIds.length})</span>
        </div>
        {balanceInfo && (
          <div className="text-right">
            <div className="text-sm font-bold" style={{ color: '#fbbf24' }}>
              PWR {total}
            </div>
            <div className="text-xs text-neutral-400">avg {avg}</div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {teamIds.map(id => (
          <PlayerCard key={id} playerId={id} source={teamKey} />
        ))}
        {teamIds.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Drag players here or use auto-balance
          </div>
        )}
      </div>
    </div>
  )

  if (!mounted) return null

  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
                <span className="text-xs font-semibold tracking-widest" style={{ color: '#fbbf24' }}>
                  STRIKERS
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Team Balancer
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Intelligent fair team generation powered by PWR ratings
              </p>
            </div>
            <a
              href="/leaderboard"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#a3a3a3',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              ← Leaderboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fbbf24', borderTopColor: 'transparent' }} />
            <p className="text-neutral-400 mt-4">Loading player data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Input */}
            <div className="lg:col-span-1">
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <h2 className="text-lg font-semibold text-white mb-4">Player Input</h2>

                <textarea
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  placeholder="Paste player names here (one per line, or comma-separated)&#10;&#10;Examples:&#10;John, Mike, Sarah&#10;Alex&#10;Chris"
                  className="w-full h-48 px-4 py-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                />

                <button
                  onClick={matchPlayers}
                  disabled={!playerInput.trim()}
                  className="w-full mt-4 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                  style={{
                    background: playerInput.trim() ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.1)',
                    color: playerInput.trim() ? '#000' : '#666'
                  }}
                >
                  Match Players
                </button>

                {unmatchedNames.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <p className="text-sm font-medium text-red-400 mb-2">Unmatched names:</p>
                    <p className="text-xs text-red-300">{unmatchedNames.join(', ')}</p>
                  </div>
                )}

                {matchedPlayers.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <p className="text-sm font-medium text-green-400">
                      {matchedPlayers.length} players matched
                    </p>
                  </div>
                )}

                {/* Options */}
                <div className="mt-6 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStats}
                      onChange={(e) => setShowStats(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-neutral-300">Show PWR ratings</span>
                  </label>
                </div>

                {/* History */}
                {balanceHistory.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                      <span>{showHistory ? '▼' : '▶'}</span>
                      Recent Balances ({balanceHistory.length})
                    </button>

                    {showHistory && (
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {balanceHistory.map((entry, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded text-xs"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                          >
                            <div className="flex justify-between text-neutral-400 mb-1">
                              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                              <span style={{ color: entry.balanceScore >= 80 ? '#22c55e' : '#eab308' }}>
                                {entry.balanceScore}%
                              </span>
                            </div>
                            <div className="text-neutral-300">
                              B: {entry.teamA?.slice(0, 3).join(', ')}{entry.teamA?.length > 3 ? '...' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Teams */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Bar */}
              {matchedPlayers.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={balanceTeams}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      color: '#000'
                    }}
                  >
                    Auto-Balance Teams
                  </button>

                  <button
                    onClick={swapTeams}
                    disabled={teamA.length === 0 && teamB.length === 0}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: '#a3a3a3',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    Swap Teams
                  </button>

                  <button
                    onClick={resetTeams}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: '#a3a3a3',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    Reset
                  </button>

                  {balanceInfo && (
                    <button
                      onClick={exportTeams}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto"
                      style={{
                        background: 'rgba(34,197,94,0.1)',
                        color: '#22c55e',
                        border: '1px solid rgba(34,197,94,0.3)'
                      }}
                    >
                      Copy to Clipboard
                    </button>
                  )}
                </div>
              )}

              {/* Balance Score */}
              {balanceInfo && (
                <div
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{
                    background: balanceInfo.balanceScore >= 80
                      ? 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(234,179,8,0.1) 0%, transparent 100%)',
                    border: `1px solid ${balanceInfo.balanceScore >= 80 ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`
                  }}
                >
                  <div>
                    <span className="text-sm text-neutral-400">Balance Score</span>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: balanceInfo.balanceScore >= 80 ? '#22c55e' : '#eab308' }}
                    >
                      {balanceInfo.balanceScore}%
                    </div>
                  </div>
                  <div className="text-right text-sm text-neutral-400">
                    <div>Power Difference: <span className="text-white">{balanceInfo.powerDiff}</span></div>
                    <div className="mt-1">
                      Teams: {teamA.length} vs {teamB.length}
                    </div>
                  </div>
                </div>
              )}

              {/* Unassigned Players */}
              {unassigned.length > 0 && (
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'unassigned')}
                  className="rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}
                >
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">
                    Unassigned ({unassigned.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {unassigned.map(id => (
                      <div key={id} className="flex-shrink-0">
                        <PlayerCard playerId={id} source="unassigned" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TeamPanel
                  title="Black Team"
                  teamIds={teamA}
                  teamKey="teamA"
                  color="#525252"
                  total={balanceInfo?.teamATotal}
                  avg={balanceInfo?.teamAAvg}
                />
                <TeamPanel
                  title="White Team"
                  teamIds={teamB}
                  teamKey="teamB"
                  color="#f5f5f5"
                  total={balanceInfo?.teamBTotal}
                  avg={balanceInfo?.teamBAvg}
                />
              </div>

              {/* Empty State */}
              {matchedPlayers.length === 0 && (
                <div
                  className="rounded-xl p-12 text-center"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
                    border: '1px dashed rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="text-4xl mb-4">⚽</div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Players Yet</h3>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto">
                    Paste player names in the input box on the left, then click "Match Players" to find them in the database.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tips */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 px-4 py-3 text-center text-xs"
        style={{
          background: 'linear-gradient(to top, #09090b 0%, transparent 100%)',
          color: '#737373'
        }}
      >
        Tap and hold to drag players between teams
      </div>
    </div>
  )
}
