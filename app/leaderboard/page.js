'use client'

import { useState, useEffect } from 'react'
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

  // Add CSS animations and mobile styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulseGlow {
        0%, 100% { 
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4), 0 0 20px rgba(22, 163, 74, 0.15);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 4px 16px rgba(22, 163, 74, 0.5), 0 0 30px rgba(22, 163, 74, 0.25);
          transform: scale(1.02);
        }
      }
      
      @keyframes subtleGlow {
        0%, 100% { 
          opacity: 1;
        }
        50% { 
          opacity: 0.95;
        }
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          max-width: 100vw;
          position: relative;
        }

        .table-container::-webkit-scrollbar {
          height: 6px;
        }

        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .leaderboard-table {
          min-width: 800px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .leaderboard-table th {
          padding: 6px 2px;
          font-size: 9px;
          white-space: nowrap;
        }

        .leaderboard-table td {
          padding: 6px 2px;
          font-size: 11px;
          white-space: nowrap;
        }

        /* Sticky columns with fixed positioning */
        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 12;
          width: 25px;
          min-width: 25px;
          max-width: 25px;
        }

        .sticky-col-player {
          position: sticky;
          left: 25px;
          z-index: 11;
          width: 80px;
          min-width: 80px;
          max-width: 80px;
          border-right: 1px solid #e5e7eb;
        }

        /* Header sticky columns */
        thead th.sticky-col,
        thead th.sticky-col-player {
          background-color: #111827 !important;
        }

        /* Body sticky columns with proper backgrounds */
        tbody td.sticky-col,
        tbody td.sticky-col-player {
          background-color: white;
        }

        tbody tr.bg-yellow-50 td.sticky-col,
        tbody tr.bg-yellow-50 td.sticky-col-player {
          background-color: #fef3c7 !important;
        }

        tbody tr.bg-gray-50 td.sticky-col,
        tbody tr.bg-gray-50 td.sticky-col-player {
          background-color: #f9fafb !important;
        }

        tbody tr.bg-orange-50 td.sticky-col,
        tbody tr.bg-orange-50 td.sticky-col-player {
          background-color: #fed7aa !important;
        }

        /* Hover states */
        tbody tr:hover td.sticky-col,
        tbody tr:hover td.sticky-col-player {
          background-color: #f3f4f6 !important;
        }
        
        tbody tr.bg-yellow-50:hover td.sticky-col,
        tbody tr.bg-yellow-50:hover td.sticky-col-player {
          background-color: #fde68a !important;
        }

        tbody tr.bg-gray-50:hover td.sticky-col,
        tbody tr.bg-gray-50:hover td.sticky-col-player {
          background-color: #e5e7eb !important;
        }

        tbody tr.bg-orange-50:hover td.sticky-col,
        tbody tr.bg-orange-50:hover td.sticky-col-player {
          background-color: #fed7aa !important;
        }

        .power-badge {
          padding: 1px 4px !important;
          font-size: 10px !important;
          min-width: 35px !important;
        }

        .player-name {
          max-width: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          display: inline-block;
          cursor: pointer;
        }

        .player-name:active {
          color: #2563eb;
        }

        .country-flag {
          font-size: 14px;
        }

        /* Make Win% text darker on mobile */
        .win-pct-mobile {
          color: #1f2937 !important;
          font-weight: 600 !important;
        }

        /* Mobile tooltips */
        .mobile-tooltip {
          position: fixed;
          background: rgba(31, 41, 55, 0.95);
          color: white;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 11px;
          z-index: 9999;
          pointer-events: none;
          max-width: 200px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .mobile-tooltip-title {
          color: #60a5fa;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .mobile-tooltip-desc {
          color: #e5e7eb;
          font-size: 10px;
        }
      }

      @media (max-width: 480px) {
        .leaderboard-table th {
          padding: 4px 2px;
          font-size: 8px;
        }

        .leaderboard-table td {
          padding: 4px 2px;
          font-size: 10px;
        }

        .player-name {
          max-width: 55px;
          font-size: 9px;
        }

        .sticky-col-player {
          width: 75px;
          min-width: 75px;
          max-width: 75px;
        }
      }

      /* Player modal styles */
      .player-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 9999;
      }

      .player-modal-content {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        width: 100%;
        max-height: 70vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Tooltip definitions
  const tooltips = {
    GP: {
      title: 'Games Played',
      description: 'Total number of games participated in'
    },
    GD: {
      title: 'Goal Differential',
      description: 'Total goals scored minus goals conceded'
    },
    OFF: {
      title: 'Offensive Rating',
      description: 'Average goals scored per game'
    },
    DEF: {
      title: 'Defensive Rating',
      description: 'Average goals conceded per game'
    },
    NET: {
      title: 'Net Rating',
      description: 'Average goal differential per game'
    },
    STREAK: {
      title: 'Current Streak',
      description: 'Consecutive wins (W) or losses (L)'
    },
    POWER: {
      title: 'Power Rating',
      description: 'Overall performance score (0-100)'
    },
    LAST: {
      title: 'Last Played',
      description: 'Date of most recent game'
    }
  }

  // Country flag helper function
  const getCountryFlag = (countryCode) => {
    const flags = {
      'AF': '🇦🇫', 'AL': '🇦🇱', 'DZ': '🇩🇿', 'AS': '🇦🇸', 'AD': '🇦🇩', 'AO': '🇦🇴',
      'AI': '🇦🇮', 'AG': '🇦🇬', 'AR': '🇦🇷', 'AM': '🇦🇲', 'AW': '🇦🇼', 'AU': '🇦🇺',
      'AT': '🇦🇹', 'AZ': '🇦🇿', 'BS': '🇧🇸', 'BH': '🇧🇭', 'BD': '🇧🇩', 'BB': '🇧🇧',
      'BY': '🇧🇾', 'BE': '🇧🇪', 'BZ': '🇧🇿', 'BJ': '🇧🇯', 'BM': '🇧🇲', 'BT': '🇧🇹',
      'BO': '🇧🇴', 'BA': '🇧🇦', 'BW': '🇧🇼', 'BR': '🇧🇷', 'VG': '🇻🇬', 'BN': '🇧🇳',
      'BG': '🇧🇬', 'BF': '🇧🇫', 'BI': '🇧🇮', 'CV': '🇨🇻', 'KH': '🇰🇭', 'CM': '🇨🇲',
      'CA': '🇨🇦', 'KY': '🇰🇾', 'CF': '🇨🇫', 'TD': '🇹🇩', 'CL': '🇨🇱', 'CN': '🇨🇳',
      'CO': '🇨🇴', 'KM': '🇰🇲', 'CG': '🇨🇬', 'CD': '🇨🇩', 'CK': '🇨🇰', 'CR': '🇨🇷',
      'CI': '🇨🇮', 'HR': '🇭🇷', 'CU': '🇨🇺', 'CW': '🇨🇼', 'CY': '🇨🇾', 'CZ': '🇨🇿',
      'DK': '🇩🇰', 'DJ': '🇩🇯', 'DM': '🇩🇲', 'DO': '🇩🇴', 'EC': '🇪🇨', 'EG': '🇪🇬',
      'SV': '🇸🇻', 'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'GQ': '🇬🇶', 'ER': '🇪🇷', 'EE': '🇪🇪', 'SZ': '🇸🇿',
      'ET': '🇪🇹', 'FO': '🇫🇴', 'FJ': '🇫🇯', 'FI': '🇫🇮', 'FR': '🇫🇷', 'GF': '🇬🇫',
      'PF': '🇵🇫', 'GA': '🇬🇦', 'GM': '🇬🇲', 'GE': '🇬🇪', 'DE': '🇩🇪', 'GH': '🇬🇭',
      'GI': '🇬🇮', 'GR': '🇬🇷', 'GL': '🇬🇱', 'GD': '🇬🇩', 'GP': '🇬🇵', 'GU': '🇬🇺',
      'GT': '🇬🇹', 'GG': '🇬🇬', 'GN': '🇬🇳', 'GW': '🇬🇼', 'GY': '🇬🇾', 'HT': '🇭🇹',
      'HN': '🇭🇳', 'HK': '🇭🇰', 'HU': '🇭🇺', 'IS': '🇮🇸', 'IN': '🇮🇳', 'ID': '🇮🇩',
      'IR': '🇮🇷', 'IQ': '🇮🇶', 'IE': '🇮🇪', 'IM': '🇮🇲', 'IL': '🇮🇱', 'IT': '🇮🇹',
      'JM': '🇯🇲', 'JP': '🇯🇵', 'JE': '🇯🇪', 'JO': '🇯🇴', 'KZ': '🇰🇿', 'KE': '🇰🇪',
      'KI': '🇰🇮', 'XK': '🇽🇰', 'KW': '🇰🇼', 'KG': '🇰🇬', 'LA': '🇱🇦', 'LV': '🇱🇻',
      'LB': '🇱🇧', 'LS': '🇱🇸', 'LR': '🇱🇷', 'LY': '🇱🇾', 'LI': '🇱🇮', 'LT': '🇱🇹',
      'LU': '🇱🇺', 'MO': '🇲🇴', 'MG': '🇲🇬', 'MW': '🇲🇼', 'MY': '🇲🇾', 'MV': '🇲🇻',
      'ML': '🇲🇱', 'MT': '🇲🇹', 'MH': '🇲🇭', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MU': '🇲🇺',
      'YT': '🇾🇹', 'MX': '🇲🇽', 'FM': '🇫🇲', 'MD': '🇲🇩', 'MC': '🇲🇨', 'MN': '🇲🇳',
      'ME': '🇲🇪', 'MS': '🇲🇸', 'MA': '🇲🇦', 'MZ': '🇲🇿', 'MM': '🇲🇲', 'NA': '🇳🇦',
      'NR': '🇳🇷', 'NP': '🇳🇵', 'NL': '🇳🇱', 'NC': '🇳🇨', 'NZ': '🇳🇿', 'NI': '🇳🇮',
      'NE': '🇳🇪', 'NG': '🇳🇬', 'NU': '🇳🇺', 'KP': '🇰🇵', 'MK': '🇲🇰', 'MP': '🇲🇵',
      'NO': '🇳🇴', 'OM': '🇴🇲', 'PK': '🇵🇰', 'PW': '🇵🇼', 'PS': '🇵🇸', 'PA': '🇵🇦',
      'PG': '🇵🇬', 'PY': '🇵🇾', 'PE': '🇵🇪', 'PH': '🇵🇭', 'PL': '🇵🇱', 'PT': '🇵🇹',
      'PR': '🇵🇷', 'QA': '🇶🇦', 'RE': '🇷🇪', 'RO': '🇷🇴', 'RU': '🇷🇺', 'RW': '🇷🇼',
      'BL': '🇧🇱', 'SH': '🇸🇭', 'KN': '🇰🇳', 'LC': '🇱🇨', 'MF': '🇲🇫', 'PM': '🇵🇲',
      'VC': '🇻🇨', 'WS': '🇼🇸', 'SM': '🇸🇲', 'ST': '🇸🇹', 'SA': '🇸🇦', 'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'SN': '🇸🇳', 'RS': '🇷🇸', 'SC': '🇸🇨', 'SL': '🇸🇱', 'SG': '🇸🇬', 'SX': '🇸🇽',
      'SK': '🇸🇰', 'SI': '🇸🇮', 'SB': '🇸🇧', 'SO': '🇸🇴', 'ZA': '🇿🇦', 'KR': '🇰🇷',
      'SS': '🇸🇸', 'ES': '🇪🇸', 'LK': '🇱🇰', 'SD': '🇸🇩', 'SR': '🇸🇷', 'SE': '🇸🇪',
      'CH': '🇨🇭', 'SY': '🇸🇾', 'TW': '🇹🇼', 'TJ': '🇹🇯', 'TZ': '🇹🇿', 'TH': '🇹🇭',
      'TL': '🇹🇱', 'TG': '🇹🇬', 'TK': '🇹🇰', 'TO': '🇹🇴', 'TT': '🇹🇹', 'TN': '🇹🇳',
      'TR': '🇹🇷', 'TM': '🇹🇲', 'TC': '🇹🇨', 'TV': '🇹🇻', 'VI': '🇻🇮', 'UG': '🇺🇬',
      'UA': '🇺🇦', 'AE': '🇦🇪', 'GB': '🇬🇧', 'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿',
      'VU': '🇻🇺', 'VA': '🇻🇦', 'VE': '🇻🇪', 'VN': '🇻🇳', 'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'WF': '🇼🇫',
      'EH': '🇪🇭', 'YE': '🇾🇪', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
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
      let streak = player.current_streak
      
      if (!streak || streak === '-' || streak === '') {
        const { data: gameData } = await supabase
          .from('game_players')
          .select('game_id, team')
          .eq('player_id', player.player_id)
          .order('game_id', { ascending: false })
          .limit(10)

        if (gameData && gameData.length > 0) {
          const { data: games } = await supabase
            .from('games')
            .select('*')
            .in('id', gameData.map(g => g.game_id))
            .order('date', { ascending: false })

          if (games && games.length > 0) {
            streak = calculatePlayerStreak(games, gameData, player.player_id)
          }
        }
      }
      
      const power = calculatePowerRating(player)
      
      statsWithStreaks.push({
        ...player,
        current_streak: streak || '-',
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

  const calculatePlayerStreak = (games, playerGames, playerId) => {
    // Simplified streak calculation
    return '-'
  }

  // Fetch player's last 5 games
  const fetchPlayerGames = async (playerId, playerName) => {
    setSelectedPlayer({ id: playerId, name: playerName })
    setLoadingGames(true)
    
    try {
      // Get player's game participations
      const { data: gameData, error: gameError } = await supabase
        .from('game_players')
        .select('game_id, team')
        .eq('player_id', playerId)
        .order('game_id', { ascending: false })
        .limit(5)

      if (gameError) throw gameError

      if (gameData && gameData.length > 0) {
        // Get game details
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .in('id', gameData.map(g => g.game_id))
          .order('date', { ascending: false })

        if (gamesError) throw gamesError

        // Format games with player's team info
        const formattedGames = games.map(game => {
          const playerGame = gameData.find(g => g.game_id === game.id)
          const playerTeam = playerGame.team
          const opponentTeam = playerTeam === 1 ? 2 : 1
          const playerScore = playerTeam === 1 ? game.team1_score : game.team2_score
          const opponentScore = playerTeam === 1 ? game.team2_score : game.team1_score
          
          let result = 'T'
          if (playerScore > opponentScore) result = 'W'
          else if (playerScore < opponentScore) result = 'L'
          
          return {
            ...game,
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

  // Mobile tooltip handler
  const handleMobileTooltip = (e, tooltip) => {
    if (window.innerWidth > 768) return // Only for mobile
    
    const existingTooltip = document.querySelector('.mobile-tooltip')
    if (existingTooltip) existingTooltip.remove()
    
    if (activeTooltip === tooltip) {
      setActiveTooltip(null)
      return
    }
    
    const tooltipDiv = document.createElement('div')
    tooltipDiv.className = 'mobile-tooltip'
    tooltipDiv.innerHTML = `
      <div class="mobile-tooltip-title">${tooltips[tooltip].title}</div>
      <div class="mobile-tooltip-desc">${tooltips[tooltip].description}</div>
    `
    
    document.body.appendChild(tooltipDiv)
    
    const rect = e.target.getBoundingClientRect()
    tooltipDiv.style.left = Math.min(rect.left, window.innerWidth - 210) + 'px'
    tooltipDiv.style.top = (rect.top - tooltipDiv.offsetHeight - 5) + 'px'
    
    setActiveTooltip(tooltip)
    
    setTimeout(() => {
      tooltipDiv.remove()
      setActiveTooltip(null)
    }, 3000)
  }

  // Sorting logic
  const sortedStats = [...stats].filter(player => player.games_played >= minGames).sort((a, b) => {
    switch(sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'games_played': return (b.games_played || 0) - (a.games_played || 0)
      case 'wins': return (b.wins || 0) - (a.wins || 0)
      case 'losses': return (b.losses || 0) - (a.losses || 0)
      case 'ties': return (b.ties || 0) - (a.ties || 0)
      case 'win_percentage': return (b.win_percentage || 0) - (a.win_percentage || 0)
      case 'goal_differential': return (b.goal_differential || 0) - (a.goal_differential || 0)
      case 'offensive_rating': return (b.avg_goals_for || 0) - (a.avg_goals_for || 0)
      case 'defensive_rating': return (a.avg_goals_against || 0) - (b.avg_goals_against || 0)
      case 'net_rating': return (b.avg_goal_diff || 0) - (a.avg_goal_diff || 0)
      case 'power': return (b.power_rating || 0) - (a.power_rating || 0)
      case 'streak': return 0
      case 'last_played': return 0
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
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 px-2">
            Leaderboard
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-3 sm:p-4 rounded-lg shadow-sm mx-2 sm:mx-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Sort By
            </label>
            <select 
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
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
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Min Games
            </label>
            <input 
              type="number" 
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-20"
              value={minGames}
              onChange={(e) => setMinGames(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-2 sm:mx-0">
          <div className="table-container">
            <table className="w-full leaderboard-table">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="sticky-col px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-900">
                    #
                  </th>
                  <th className="sticky-col-player px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-800 bg-gray-900"
                      onClick={() => setSortBy(sortBy === 'name' ? 'default' : 'name')}>
                    Player {sortBy === 'name' && '▼'}
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'GP')}>
                    GP
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">
                    T
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Win%
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'GD')}>
                    GD
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'OFF')}>
                    OFF
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'DEF')}>
                    DEF
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'NET')}>
                    NET
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'STREAK')}>
                    STRK
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'POWER')}>
                    <span style={{ 
                      background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 'bold'
                    }}>
                      PWR
                    </span>
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider"
                      onClick={(e) => handleMobileTooltip(e, 'LAST')}>
                    LAST
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedStats.map((player, index) => {
                  const rank = index + 1
                  const winPct = player.win_percentage || 0
                  const bgClass = rank === 1 ? 'bg-yellow-50' : 
                                 rank === 2 ? 'bg-gray-50' : 
                                 rank === 3 ? 'bg-orange-50' : ''
                  const bgColor = rank === 1 ? '#fef3c7' : 
                                 rank === 2 ? '#f9fafb' : 
                                 rank === 3 ? '#fed7aa' : 'white'
                  
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
                      <td className={`sticky-col px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${bgClass}`}
                          style={{ backgroundColor: bgColor }}>
                        <span className={`
                          ${rank <= 3 ? 'font-bold' : 'font-normal'}
                          ${rank === 1 ? 'text-yellow-600' : 
                            rank === 2 ? 'text-gray-500' : 
                            rank === 3 ? 'text-orange-500' : 'text-gray-700'}
                        `}>
                          {rank}
                        </span>
                      </td>
                      
                      <td className={`sticky-col-player px-1 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm ${bgClass}`}
                          style={{ backgroundColor: bgColor }}>
                        <div className="flex items-center gap-1" style={{ maxWidth: '80px' }}>
                          {player.country && (
                            <span className="country-flag flex-shrink-0">{getCountryFlag(player.country)}</span>
                          )}
                          <span 
                            className="player-name font-medium text-gray-900 capitalize"
                            onClick={() => fetchPlayerGames(player.player_id, player.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            {player.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-gray-600">{player.games_played || 0}</span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-green-600 font-medium">{player.wins || 0}</span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-red-600 font-medium">{player.losses || 0}</span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-gray-500">{player.ties || 0}</span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="win-pct-mobile font-medium sm:text-gray-900">
                          {winPct.toFixed(1)}%
                        </span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className={`font-medium ${
                          player.goal_differential > 0 ? 'text-green-600' : 
                          player.goal_differential < 0 ? 'text-red-600' : 'text-gray-400'
                        }`}>
                          {player.goal_differential > 0 && '+'}{player.goal_differential || 0}
                        </span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-gray-600">
                          {player.avg_goals_for?.toFixed(1) || '0.0'}
                        </span>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-gray-600">
                          {player.avg_goals_against?.toFixed(1) || '0.0'}
                        </span>
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

                      {/* Power Rating */}
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center">
                        <div 
                          className="power-badge"
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: player.power_rating >= 70 ? '10px' : 
                                         player.power_rating >= 50 ? '8px' :
                                         player.power_rating >= 30 ? '6px' : '4px',
                            fontWeight: 'bold',
                            fontSize: '10px',
                            background: player.power_rating >= 70 
                              ? 'linear-gradient(135deg, #0F766E, #10B981)'
                              : player.power_rating >= 50 
                              ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
                              : player.power_rating >= 30
                              ? 'linear-gradient(135deg, #6366F1, #A78BFA)'
                              : 'linear-gradient(135deg, #F472B6, #EF4444)',
                            color: 'white',
                            boxShadow: player.power_rating >= 70 
                              ? '0 1px 3px rgba(16, 185, 129, 0.3)'
                              : '0 1px 2px rgba(0,0,0,0.1)',
                            minWidth: '35px'
                          }}
                        >
                          {player.power_rating?.toFixed(1) || '0.0'}
                        </div>
                      </td>
                      
                      <td className="px-2 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm">
                        <span className="text-gray-600" style={{ fontSize: '9px' }}>
                          {player.last_played 
                            ? new Date(player.last_played + 'T12:00:00').toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })
                            : '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile scroll indicator */}
        <div className="sm:hidden mt-2 text-center text-xs text-gray-500">
          ← Swipe to see more | Tap headers for info | Tap player to see games →
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <div className="player-modal" onClick={closePlayerModal}>
          <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {selectedPlayer.name}'s Last 5 Games
              </h2>
              <button 
                onClick={closePlayerModal}
                className="text-gray-400 hover:text-gray-600"
                style={{ fontSize: '24px', lineHeight: '1' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {loadingGames ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : playerGames.length > 0 ? (
                <div className="space-y-3">
                  {playerGames.map((game, idx) => (
                    <div key={game.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          {new Date(game.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className={`
                          px-2 py-1 rounded text-xs font-bold
                          ${game.result === 'W' ? 'bg-green-100 text-green-800' : 
                            game.result === 'L' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'}
                        `}>
                          {game.result}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-2xl font-bold">
                          {game.playerScore} - {game.opponentScore}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        Team {game.playerTeam} vs Team {game.playerTeam === 1 ? 2 : 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600">No games found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}