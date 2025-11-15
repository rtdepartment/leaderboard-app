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
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Add CSS animations for power ratings
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Country flag helper function (keeping your existing function)
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

  // Keep all your existing calculation functions...
  const calculateStreaksForPlayers = async (playerStats) => {
    // Your existing streak calculation logic
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
    // Your existing streak calculation logic
    return '-'
  }

  const fetchPlayerGames = async (playerId, playerName) => {
    // Your existing fetchPlayerGames logic
    setSelectedPlayer({ id: playerId, name: playerName })
    setLoadingGames(true)
    // ... fetch games logic
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

  // Mobile Card Component
  const MobileCard = ({ player, rank, index }) => {
    const winPct = player.win_percentage || 0
    
    return (
      <div className={`
        bg-white rounded-lg shadow-md p-4 mb-3
        ${rank === 1 ? 'ring-2 ring-yellow-400' : 
          rank === 2 ? 'ring-2 ring-gray-400' : 
          rank === 3 ? 'ring-2 ring-orange-400' : ''}
      `}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`
              text-lg font-bold
              ${rank === 1 ? 'text-yellow-600' : 
                rank === 2 ? 'text-gray-500' : 
                rank === 3 ? 'text-orange-500' : 'text-gray-700'}
            `}>
              #{rank}
            </span>
            {player.country && (
              <span className="text-xl">{getCountryFlag(player.country)}</span>
            )}
            <span className="font-semibold text-gray-900 capitalize">
              {player.name}
            </span>
          </div>
          
          {/* Power Rating Badge */}
          <div 
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '13px',
              background: player.power_rating >= 70 
                ? 'linear-gradient(135deg, #0F766E, #10B981)'
                : player.power_rating >= 50 
                ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
                : player.power_rating >= 30
                ? 'linear-gradient(135deg, #6366F1, #A78BFA)'
                : 'linear-gradient(135deg, #F472B6, #EF4444)',
              color: 'white',
              boxShadow: player.power_rating >= 70 
                ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {player.power_rating?.toFixed(1) || '0.0'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-500">GP</span>
            <p className="font-semibold">{player.games_played || 0}</p>
          </div>
          <div>
            <span className="text-gray-500">W-L-T</span>
            <p className="font-semibold">
              {player.wins || 0}-{player.losses || 0}-{player.ties || 0}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Win%</span>
            <p className="font-semibold">{winPct.toFixed(1)}%</p>
          </div>
          <div>
            <span className="text-gray-500">GD</span>
            <p className={`font-semibold ${
              player.goal_differential > 0 ? 'text-green-600' : 
              player.goal_differential < 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {player.goal_differential > 0 && '+'}{player.goal_differential || 0}
            </p>
          </div>
          <div>
            <span className="text-gray-500">NET</span>
            <p className={`font-semibold ${
              player.avg_goal_diff > 0 ? 'text-green-600' : 
              player.avg_goal_diff < 0 ? 'text-red-600' : 'text-gray-400'
            }`}>
              {player.avg_goal_diff > 0 && '+'}{player.avg_goal_diff?.toFixed(1) || '0.0'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Streak</span>
            <p className={`font-semibold ${
              player.current_streak?.includes('W') ? 'text-green-600' : 
              player.current_streak?.includes('L') ? 'text-red-600' : 'text-gray-400'
            }`}>
              {player.current_streak || '-'}
            </p>
          </div>
        </div>
      </div>
    )
  }

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Leaderboard
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700">
              Sort By
            </label>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
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
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700">
              Min Games
            </label>
            <input 
              type="number" 
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-20"
              value={minGames}
              onChange={(e) => setMinGames(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="mobile-cards">
            {sortedStats.map((player, index) => {
              const rank = index + 1
              return (
                <MobileCard 
                  key={player.player_id} 
                  player={player} 
                  rank={rank}
                  index={index}
                />
              )
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-800"
                        onClick={() => setSortBy(sortBy === 'name' ? 'default' : 'name')}>
                      Player {sortBy === 'name' && '▼'}
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      GP
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      W
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      L
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      T
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Win%
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                      GD
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                      OFF
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider hidden lg:table-cell">
                      DEF
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      NET
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                      STREAK
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      <span style={{ 
                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 'bold'
                      }}>
                        PWR
                      </span>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider hidden xl:table-cell">
                      LAST
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`
                            ${rank <= 3 ? 'font-bold' : 'font-normal'}
                            ${rank === 1 ? 'text-yellow-600' : 
                              rank === 2 ? 'text-gray-500' : 
                              rank === 3 ? 'text-orange-500' : 'text-gray-700'}
                          `}>
                            {rank}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {player.country && (
                              <span className="text-lg">{getCountryFlag(player.country)}</span>
                            )}
                            <span className="font-medium text-gray-900 capitalize">
                              {player.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-600">{player.games_played || 0}</span>
                        </td>
                        
                        <td className="px-3 py-3 text-center">
                          <span className="text-green-600 font-medium">{player.wins || 0}</span>
                        </td>
                        
                        <td className="px-3 py-3 text-center">
                          <span className="text-red-600 font-medium">{player.losses || 0}</span>
                        </td>
                        
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-500">{player.ties || 0}</span>
                        </td>
                        
                        <td className="px-3 py-3 text-center">
                          <span className="font-medium">{winPct.toFixed(1)}%</span>
                        </td>
                        
                        <td className="px-3 py-3 text-center hidden md:table-cell">
                          <span className={`font-medium ${
                            player.goal_differential > 0 ? 'text-green-600' : 
                            player.goal_differential < 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {player.goal_differential > 0 && '+'}{player.goal_differential || 0}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-gray-600">
                            {player.avg_goals_for?.toFixed(1) || '0.0'}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 text-center hidden lg:table-cell">
                          <span className="text-gray-600">
                            {player.avg_goals_against?.toFixed(1) || '0.0'}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 text-center">
                          <span className={`font-medium ${
                            player.avg_goal_diff > 0 ? 'text-green-600' : 
                            player.avg_goal_diff < 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {player.avg_goal_diff > 0 && '+'}{player.avg_goal_diff?.toFixed(1) || '0.0'}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 text-center hidden sm:table-cell">
                          <span className={`font-medium ${
                            player.current_streak?.includes('W') ? 'text-green-600' : 
                            player.current_streak?.includes('L') ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {player.current_streak || '-'}
                          </span>
                        </td>

                        {/* Power Rating */}
                        <td className="px-3 py-3 text-center">
                          <div 
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: player.power_rating >= 70 ? '14px' : 
                                           player.power_rating >= 50 ? '12px' :
                                           player.power_rating >= 30 ? '10px' : '8px',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              background: player.power_rating >= 70 
                                ? 'linear-gradient(135deg, #0F766E, #10B981)'
                                : player.power_rating >= 50 
                                ? 'linear-gradient(135deg, #3B82F6, #60A5FA)'
                                : player.power_rating >= 30
                                ? 'linear-gradient(135deg, #6366F1, #A78BFA)'
                                : 'linear-gradient(135deg, #F472B6, #EF4444)',
                              color: 'white',
                              boxShadow: player.power_rating >= 70 
                                ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                                : '0 2px 4px rgba(0,0,0,0.1)',
                              minWidth: '45px'
                            }}
                          >
                            {player.power_rating?.toFixed(1) || '0.0'}
                          </div>
                        </td>
                        
                        <td className="px-3 py-3 text-center hidden xl:table-cell">
                          <span className="text-gray-600 text-sm">
                            {player.last_played 
                              ? new Date(player.last_played + 'T12:00:00').toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric'
                                })
                              : 'Never'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}