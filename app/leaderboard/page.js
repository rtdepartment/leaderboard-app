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
      'SV': '🇸🇻', 'ENGLAND': '🏴󐁧󐁢󐁥󐁮󐁧󐁿', 'GQ': '🇬🇶', 'ER': '🇪🇷', 'EE': '🇪🇪', 'SZ': '🇸🇿',
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
      'VC': '🇻🇨', 'WS': '🇼🇸', 'SM': '🇸🇲', 'ST': '🇸🇹', 'SA': '🇸🇦', 'SCOTLAND': '🏴󐁧󐁢󐁳󐁣󐁴󐁿',
      'SN': '🇸🇳', 'RS': '🇷🇸', 'SC': '🇸🇨', 'SL': '🇸🇱', 'SG': '🇸🇬', 'SX': '🇸🇽',
      'SK': '🇸🇰', 'SI': '🇸🇮', 'SB': '🇸🇧', 'SO': '🇸🇴', 'ZA': '🇿🇦', 'KR': '🇰🇷',
      'SS': '🇸🇸', 'ES': '🇪🇸', 'LK': '🇱🇰', 'SD': '🇸🇩', 'SR': '🇸🇷', 'SE': '🇸🇪',
      'CH': '🇨🇭', 'SY': '🇸🇾', 'TW': '🇹🇼', 'TJ': '🇹🇯', 'TZ': '🇹🇿', 'TH': '🇹🇭',
      'TL': '🇹🇱', 'TG': '🇹🇬', 'TK': '🇹🇰', 'TO': '🇹🇴', 'TT': '🇹🇹', 'TN': '🇹🇳',
      'TR': '🇹🇷', 'TM': '🇹🇲', 'TC': '🇹🇨', 'TV': '🇹🇻', 'VI': '🇻🇮', 'UG': '🇺🇬',
      'UA': '🇺🇦', 'AE': '🇦🇪', 'GB': '🇬🇧', 'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿',
      'VU': '🇻🇺', 'VA': '🇻🇦', 'VE': '🇻🇪', 'VN': '🇻🇳', 'WALES': '🏴󐁧󐁢󐁷󐁬󐁳󐁿', 'WF': '🇼🇫',
      'EH': '🇪🇭', 'YE': '🇾🇪', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
    }
    return countryCode ? (flags[countryCode] || '') : ''
  }

  useEffect(() => {
    fetchStats()
  }, [])


  // Add CSS animations for power ratings
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulseGlow {
        0%, 100% { 
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.15);
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5), 0 0 30px rgba(16, 185, 129, 0.25);
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

  const fetchStats = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')

    if (error) {
      console.error('Error fetching stats:', error)
    } else {
      // If streaks are not calculated in the database, calculate them here
      const statsWithStreaks = await calculateStreaksForPlayers(data || [])
      setStats(statsWithStreaks)
    }
    setLoading(false)
  }

  // Frontend streak calculation as fallback
  const calculateStreaksForPlayers = async (playerStats) => {
    const statsWithStreaks = []
    
    for (const player of playerStats) {
      let streak = player.current_streak
      
      // Only calculate if streak is missing or shows as '-'
      if (!streak || streak === '-' || streak === '') {
        // Fetch last few games for this player to calculate streak
        const { data: gameData } = await supabase
          .from('game_players')
          .select('game_id, team')
          .eq('player_id', player.player_id)
          .order('game_id', { ascending: false })
          .limit(10)

        if (gameData && gameData.length > 0) {
          const gameIds = gameData.map(g => g.game_id)
          
          const { data: games } = await supabase
            .from('games')
            .select('id, team_a_score, team_b_score, game_date')
            .in('id', gameIds)
            .order('game_date', { ascending: false })

          if (games && games.length > 0) {
            // Calculate streak from games
            let streakType = ''
            let streakCount = 0
            
            for (const game of games) {
              const playerGame = gameData.find(gd => gd.game_id === game.id)
              const playerTeam = playerGame?.team
              
              let result = 'T'
              if (game.team_a_score === game.team_b_score) {
                result = 'T'
              } else if (playerTeam === 'A' && game.team_a_score > game.team_b_score) {
                result = 'W'
              } else if (playerTeam === 'B' && game.team_b_score > game.team_a_score) {
                result = 'W'
              } else {
                result = 'L'
              }
              
              if (streakCount === 0) {
                streakType = result
                streakCount = 1
              } else if (result === streakType) {
                streakCount++
              } else {
                break
              }
            }
            
            streak = streakCount > 0 ? `${streakType}${streakCount}` : '-'
          }
        }
      }
      
      // Calculate POWER rating (max 100 points)
      const power = calculatePowerRating(player)
      
      statsWithStreaks.push({
        ...player,
        current_streak: streak || '-',
        power_rating: power
      })
    }
    
    return statsWithStreaks
  }

  // Calculate POWER rating with max of 100 points
  const calculatePowerRating = (player) => {
    // Components of POWER rating:
    // 1. Win Percentage (max 50 points) - Most important factor
    // 2. Net Rating / Goal Differential per game (max 35 points) - Dominance factor
    // 3. Games Played (max 15 points) - Experience factor
    
    const winPct = player.win_percentage || 0
    const avgGoalDiff = player.avg_goal_diff || 0
    const gamesPlayed = player.games_played || 0
    
    // 1. Win percentage component (0-50 points)
    const winComponent = (winPct / 100) * 50
    
    // 2. Net Rating component (0-35 points)
    // Normalize: +3 avg diff = max points, -3 = 0 points
    const goalDiffNormalized = Math.max(0, Math.min(1, (avgGoalDiff + 3) / 6))
    const netRatingComponent = goalDiffNormalized * 35
    
    // 3. Experience component (0-15 points)
    // 20+ games = full points, scales down from there
    const experienceComponent = Math.min(15, (gamesPlayed / 20) * 15)
    
    // Calculate total POWER rating
    const totalPower = winComponent + netRatingComponent + experienceComponent
    
    // Round to 1 decimal place and ensure max of 100
    return Math.min(100, Math.round(totalPower * 10) / 10)
  }

  const fetchPlayerGames = async (playerId, playerName) => {
    console.log('Fetching games for player:', playerId, playerName) // Debug log
    setLoadingGames(true)
    setSelectedPlayer({ id: playerId, name: playerName })
    
    try {
      // First, get the game_players records for this player
      const { data: gamePlayerData, error: gpError } = await supabase
        .from('game_players')
        .select('game_id, team')
        .eq('player_id', playerId)
        .order('game_id', { ascending: false })
        .limit(5)

      if (gpError) {
        console.error('Error fetching game_players:', gpError)
        setPlayerGames([])
        setLoadingGames(false)
        return
      }

      if (!gamePlayerData || gamePlayerData.length === 0) {
        console.log('No games found for player')
        setPlayerGames([])
        setLoadingGames(false)
        return
      }

      // Get the game IDs
      const gameIds = gamePlayerData.map(gp => gp.game_id)
      
      // Fetch the actual game details
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, game_date, team_a_score, team_b_score')
        .in('id', gameIds)
        .order('game_date', { ascending: false })

      if (gamesError) {
        console.error('Error fetching games:', gamesError)
        setPlayerGames([])
        setLoadingGames(false)
        return
      }

      // Process the games to determine win/loss
      const processedGames = gamesData?.map(game => {
        // Find this player's team for this game
        const gamePlayer = gamePlayerData.find(gp => gp.game_id === game.id)
        const playerTeam = gamePlayer?.team || 'A'
        const teamAScore = game.team_a_score
        const teamBScore = game.team_b_score
        
        let result = 'tie'
        if (teamAScore === teamBScore) {
          result = 'tie'
        } else if (playerTeam === 'A' && teamAScore > teamBScore) {
          result = 'win'
        } else if (playerTeam === 'B' && teamBScore > teamAScore) {
          result = 'win'
        } else {
          result = 'loss'
        }

        return {
          gameId: game.id,
          date: game.game_date,
          playerTeam: playerTeam,
          teamAScore: teamAScore,
          teamBScore: teamBScore,
          result: result,
          score: `${teamAScore} - ${teamBScore}`
        }
      }) || []

      console.log('Processed games:', processedGames) // Debug log
      setPlayerGames(processedGames)
    } catch (error) {
      console.error('Error in fetchPlayerGames:', error)
      setPlayerGames([])
    }
    
    setLoadingGames(false)
  }

  const closePlayerModal = () => {
    setSelectedPlayer(null)
    setPlayerGames([])
  }

  const sortedStats = [...stats]
    .filter(player => player.games_played >= minGames)
    .sort((a, b) => {
      switch(sortBy) {
        case 'default':
          // Default sort by POWER rating
          return (b.power_rating || 0) - (a.power_rating || 0)
        case 'power':
          // Explicit POWER rating sort
          return (b.power_rating || 0) - (a.power_rating || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'games_played':
          return b.games_played - a.games_played
        case 'wins':
          return (b.wins || 0) - (a.wins || 0)
        case 'losses':
          return (b.losses || 0) - (a.losses || 0)
        case 'ties':
          return (b.ties || 0) - (a.ties || 0)
        case 'win_percentage':
          return (b.win_percentage || 0) - (a.win_percentage || 0)
        case 'goal_differential':
          return b.goal_differential - a.goal_differential
        case 'offensive_rating':
          return (b.avg_goals_for || 0) - (a.avg_goals_for || 0)
        case 'defensive_rating':
          return (a.avg_goals_against || 0) - (b.avg_goals_against || 0)
        case 'net_rating':
          return (b.avg_goal_diff || 0) - (a.avg_goal_diff || 0)
        case 'last_played':
          // Sort by most recent first (nulls last)
          if (!a.last_played && !b.last_played) return 0
          if (!a.last_played) return 1
          if (!b.last_played) return -1
          return new Date(b.last_played) - new Date(a.last_played)
        default:
          return 0
      }
    })

  const tooltips = {
    GP: {
      title: "GAMES PLAYED",
      description: "Total number of games the player has participated in"
    },
    W: {
      title: "WINS",
      description: "Number of games won"
    },
    L: {
      title: "LOSSES", 
      description: "Number of games lost"
    },
    T: {
      title: "TIES",
      description: "Number of games tied"
    },
    WINPCT: {
      title: "WIN PERCENTAGE",
      description: "Percentage of games won (ties count as 0.5 wins)"
    },
    STREAK: {
      title: "CURRENT STREAK",
      description: "Current winning (W) or losing (L) streak. Shows consecutive results of the same type."
    },
    GD: {
      title: "GOAL DIFFERENCE",
      description: "Total goals scored minus goals conceded"
    },
    OFF: {
      title: "OFFENSIVE RATING", 
      description: "Average goals your team scores per game when you're playing.",
      highlight: "HIGHER",
      highlightText: "is better"
    },
    DEF: {
      title: "DEFENSIVE RATING",
      description: "Average goals your team allows per game when you're playing.",
      highlight: "LOWER",
      highlightText: "is better"
    },
    NET: {
      title: "NET RATING",
      description: "Goal differential per game (OFF - DEF). Positive means teams with you outscore opponents on average."
    },
    LAST: {
      title: "LAST PLAYED",
      description: "Date of the player's most recent game"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
        }
        
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
      
      <div className="max-w-screen-xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Leaderboard</h1>
          <div className="h-px bg-gray-200"></div>
        </div>

        {/* Controls - Inline and minimal */}
        <div className="flex items-center gap-8 mb-8">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="default">Power Rating</option>
              <option value="power">Power Rating</option>
              <option value="name">Name</option>
              <option value="win_percentage">Win %</option>
              <option value="games_played">Games</option>
              <option value="wins">Wins</option>
              <option value="losses">Losses</option>
              <option value="ties">Ties</option>
              <option value="goal_differential">Goal Diff</option>
              <option value="offensive_rating">Offense</option>
              <option value="defensive_rating">Defense</option>
              <option value="net_rating">Net Rating</option>
              <option value="last_played">Last Played</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-500">Min Games</label>
            <input
              type="number"
              value={minGames}
              onChange={(e) => setMinGames(parseInt(e.target.value) || 0)}
              className="text-sm w-16 px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              min="0"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg">
          <table className="w-full relative">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  className="text-left px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900"
                >#</th>
                
                {/* Player Column */}
                <th 
                  className="text-left px-6 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 cursor-pointer hover:bg-gray-800"
                  onClick={() => setSortBy(sortBy === 'name' ? 'default' : 'name')}
                >
                  Player
                  {sortBy === 'name' && <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>}
                </th>
                
                {/* GP Column with Tooltip and Sorting */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('GP')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'games_played' ? 'default' : 'games_played')}
                >
                  GP
                  {sortBy === 'games_played' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'GP' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.GP.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.GP.description}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>
                
                {/* W Column */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 cursor-pointer hover:bg-gray-800"
                  onClick={() => setSortBy(sortBy === 'wins' ? 'default' : 'wins')}
                >
                  W
                  {sortBy === 'wins' && <span style={{ fontSize: '10px' }}>▼</span>}
                </th>
                
                {/* L Column */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 cursor-pointer hover:bg-gray-800"
                  onClick={() => setSortBy(sortBy === 'losses' ? 'default' : 'losses')}
                >
                  L
                  {sortBy === 'losses' && <span style={{ fontSize: '10px' }}>▼</span>}
                </th>
                
                {/* T Column */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 cursor-pointer hover:bg-gray-800"
                  onClick={() => setSortBy(sortBy === 'ties' ? 'default' : 'ties')}
                >
                  T
                  {sortBy === 'ties' && <span style={{ fontSize: '10px' }}>▼</span>}
                </th>
                
                {/* Win% Column */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 cursor-pointer hover:bg-gray-800"
                  onClick={() => setSortBy(sortBy === 'win_percentage' ? 'default' : 'win_percentage')}
                >
                  Win%
                  {sortBy === 'win_percentage' && <span style={{ fontSize: '10px' }}>▼</span>}
                </th>
                
                {/* GD Column with Tooltip */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('GD')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'goal_differential' ? 'default' : 'goal_differential')}
                >
                  GD
                  {sortBy === 'goal_differential' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'GD' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.GD.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.GD.description}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>
                
                {/* OFF Column with Enhanced Tooltip */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('OFF')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'offensive_rating' ? 'default' : 'offensive_rating')}
                >
                  OFF
                  {sortBy === 'offensive_rating' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'OFF' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.OFF.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.OFF.description}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>{tooltips.OFF.highlight}</span>
                        <span style={{ color: '#e5e7eb' }}> {tooltips.OFF.highlightText}</span>
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>
                
                {/* DEF Column with Enhanced Tooltip */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('DEF')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'defensive_rating' ? 'default' : 'defensive_rating')}
                >
                  DEF
                  {sortBy === 'defensive_rating' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'DEF' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.DEF.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.DEF.description}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>{tooltips.DEF.highlight}</span>
                        <span style={{ color: '#e5e7eb' }}> {tooltips.DEF.highlightText}</span>
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>
                
                {/* NET Column with Tooltip */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('NET')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'net_rating' ? 'default' : 'net_rating')}
                >
                  NET
                  {sortBy === 'net_rating' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'NET' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.NET.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.NET.description}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>
                
                {/* STREAK Column with Tooltip */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('STREAK')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'streak' ? 'default' : 'streak')}
                >
                  STREAK
                  {sortBy === 'streak' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'STREAK' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.STREAK.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.STREAK.description}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>
                
                {/* POWER Rating Column with Tooltip */}
                <th 
                  className="text-center px-3 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  onMouseEnter={() => setActiveTooltip('POWER')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'power' ? 'default' : 'power')}
                  style={{ minWidth: '80px' }}
                >
                  <span style={{ 
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold'
                  }}>
                    PWR
                  </span>
                  {sortBy === 'power' && <span style={{ fontSize: '10px', color: '#f59e0b' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px', color: '#f59e0b' }}>?</span>
                  {activeTooltip === 'POWER' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '280px',
                        textAlign: 'left',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
                        POWER Rating (0-100)
                      </div>
                      <div style={{ color: '#e5e7eb', marginBottom: '8px' }}>
                        Comprehensive player strength metric combining:
                      </div>
                      <div style={{ fontSize: '11px', color: '#d1d5db' }}>
                        <div style={{ marginBottom: '4px' }}>• <span style={{ color: '#60a5fa' }}>Win %</span> (50 pts max)</div>
                        <div style={{ marginBottom: '4px' }}>• <span style={{ color: '#34d399' }}>Net Rating</span> (35 pts)</div>
                        <div style={{ marginBottom: '4px' }}>• <span style={{ color: '#a78bfa' }}>Experience</span> (15 pts)</div>
                      </div>
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #374151', fontSize: '11px', color: '#9ca3af' }}>
                        Higher = Better Player Performance
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
                </th>

                
                {/* LAST Column with Tooltip */}
                <th 
                  className="text-center px-4 py-4 text-xs font-semibold text-white uppercase tracking-wider bg-gray-900 relative cursor-pointer hover:bg-gray-800"
                  style={{ minWidth: '110px' }}
                  onMouseEnter={() => setActiveTooltip('LAST')}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setSortBy(sortBy === 'last_played' ? 'default' : 'last_played')}
                >
                  LAST
                  {sortBy === 'last_played' && <span style={{ fontSize: '10px' }}>▼</span>}
                  <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '2px' }}>?</span>
                  {activeTooltip === 'LAST' && (
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '-50px',
                        backgroundColor: 'rgba(31, 41, 55, 0.95)',
                        color: 'white',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        whiteSpace: 'normal',
                        zIndex: 50,
                        marginBottom: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        width: '220px',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        fontWeight: 'normal',
                        pointerEvents: 'none'
                      }}
                    >
                      <div style={{ color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                        {tooltips.LAST.title}
                      </div>
                      <div style={{ color: '#e5e7eb' }}>
                        {tooltips.LAST.description}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid rgba(31, 41, 55, 0.95)',
                          marginTop: '-1px'
                        }}
                      />
                    </div>
                  )}
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
                        'hover:bg-gray-50/50'}
                    `}
                  >
                    {/* Rank */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`
                          ${rank <= 3 ? 'font-semibold' : 'font-normal'}
                          ${rank === 1 ? 'text-yellow-600' : 
                            rank === 2 ? 'text-gray-500' : 
                            rank === 3 ? 'text-orange-600' : 
                            'text-gray-400'}
                        `}>
                          {rank}
                        </span>
                      </div>
                    </td>
                    
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {player.country && (
                          <span className="text-lg">{getCountryFlag(player.country)}</span>
                        )}
                        <button
                          onClick={() => {
                            console.log('Player clicked:', player.name, player.player_id)
                            fetchPlayerGames(player.player_id, player.name)
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#2563eb'
                            e.target.style.textDecoration = 'underline'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#111827'
                            e.target.style.textDecoration = 'none'
                          }}
                          style={{ 
                            textTransform: 'capitalize',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            font: 'inherit',
                            cursor: 'pointer',
                            fontWeight: '500',
                            color: '#111827',
                            textAlign: 'left'
                          }}
                        >
                          {player.name}
                        </button>
                      </div>
                    </td>
                    
                    {/* Games Played */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-gray-600 tabular-nums">
                        {player.games_played || 0}
                      </span>
                    </td>
                    
                    {/* Wins */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-green-600 font-medium tabular-nums">
                        {player.wins || 0}
                      </span>
                    </td>
                    
                    {/* Losses */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-red-600 font-medium tabular-nums">
                        {player.losses || 0}
                      </span>
                    </td>
                    
                    {/* Ties */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-gray-500 font-medium tabular-nums">
                        {player.ties || 0}
                      </span>
                    </td>
                    
                    {/* Win Percentage */}
                    <td className="px-3 py-4 text-center">
                      <span className="font-medium text-gray-900 tabular-nums">
                        {winPct.toFixed(1)}%
                      </span>
                    </td>
                    
                    {/* Goal Differential */}
                    <td className="px-3 py-4 text-center">
                      <span className={`
                        font-medium tabular-nums
                        ${player.goal_differential > 0 ? 'text-green-600' : 
                          player.goal_differential < 0 ? 'text-red-600' : 
                          'text-gray-400'}
                      `}>
                        {player.goal_differential > 0 && '+'}
                        {player.goal_differential || 0}
                      </span>
                    </td>
                    
                    {/* Offensive Rating */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-gray-600 tabular-nums">
                        {player.avg_goals_for?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                    
                    {/* Defensive Rating */}
                    <td className="px-3 py-4 text-center">
                      <span className="text-gray-600 tabular-nums">
                        {player.avg_goals_against?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                    
                    {/* Net Rating */}
                    <td className="px-3 py-4 text-center">
                      <span className={`
                        font-medium tabular-nums
                        ${player.avg_goal_diff > 0 ? 'text-green-600' : 
                          player.avg_goal_diff < 0 ? 'text-red-600' : 
                          'text-gray-400'}
                      `}>
                        {player.avg_goal_diff > 0 && '+'}
                        {player.avg_goal_diff?.toFixed(1) || '0.0'}
                      </span>
                    </td>
                    
                    {/* Streak */}
                    <td className="px-3 py-4 text-center">
                      <span className={`
                        font-medium tabular-nums
                        ${player.current_streak && player.current_streak.includes('W') ? 'text-green-600' : 
                          player.current_streak && player.current_streak.includes('L') ? 'text-red-600' : 
                          'text-gray-400'}
                      `}>
                        {player.current_streak || '-'}
                      </span>
                    </td>
                    {/* POWER Rating */}
                    <td className="px-3 py-4 text-center">
                      <div 
                        className={index < 3 ? 'power-rating-top' : ''}
                        style={{
                          display: 'inline-block',
                          position: 'relative',
                          padding: '6px 14px',
                          borderRadius: player.power_rating >= 70 ? '16px' : 
                                       player.power_rating >= 50 ? '14px' :
                                       player.power_rating >= 30 ? '12px' : '10px',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          background: player.power_rating >= 70 
                            ? 'linear-gradient(135deg, #0F766E, #10B981)' // Deep Teal → Emerald
                            : player.power_rating >= 50 
                            ? 'linear-gradient(135deg, #3B82F6, #60A5FA)' // Blue → Light Blue
                            : player.power_rating >= 30
                            ? 'linear-gradient(135deg, #6366F1, #A78BFA)' // Indigo → Purple
                            : 'linear-gradient(135deg, #F472B6, #EF4444)', // Pink → Red
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          boxShadow: player.power_rating >= 70 
                            ? '0 4px 12px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.15)'
                            : index === 0 ? '0 4px 12px rgba(16, 185, 129, 0.3), 0 0 25px rgba(16, 185, 129, 0.2)'
                            : index === 1 ? '0 3px 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.15)'
                            : index === 2 ? '0 3px 10px rgba(99, 102, 241, 0.3), 0 0 15px rgba(99, 102, 241, 0.15)'
                            : '0 2px 6px rgba(0,0,0,0.15)',
                          minWidth: '55px',
                          transition: 'all 0.3s ease',
                          cursor: 'default',
                          animation: index === 0 ? 'pulseGlow 2s ease-in-out infinite' : 
                                    index < 3 ? 'subtleGlow 3s ease-in-out infinite' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                          e.currentTarget.style.filter = 'brightness(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                      >
                        {player.power_rating?.toFixed(1) || '0.0'}
                      </div>
                    </td>

                    
                    {/* Last Played */}
                    <td className="px-4 py-4 text-center" style={{ minWidth: '110px' }}>
                      <span className="text-gray-600 tabular-nums text-sm">
                        {player.last_played 
                          ? (() => {
                              // Parse the date and add timezone offset to fix the off-by-one issue
                              const date = new Date(player.last_played + 'T12:00:00')
                              return date.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                year: new Date(player.last_played).getFullYear() !== new Date().getFullYear() 
                                  ? 'numeric' 
                                  : undefined
                              })
                            })()
                          : 'Never'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Minimal legend */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex gap-6">
              <span><span className="font-medium">GP</span> Games Played</span>
              <span><span className="font-medium">W</span> Wins</span>
              <span><span className="font-medium">L</span> Losses</span>
              <span><span className="font-medium">T</span> Ties</span>
              <span><span className="font-medium">WIN%</span> Win Percentage</span>
              <span><span className="font-medium">GD</span> Goal Differential</span>
            </div>
            <div className="flex gap-6">
              <span><span className="font-medium">OFF</span> Goals For (avg)</span>
              <span><span className="font-medium">DEF</span> Goals Against (avg)</span>
              <span><span className="font-medium">NET</span> Goal Diff (avg)</span>
              <span><span className="font-medium">STREAK</span> Current Streak</span>
              <span><span className="font-medium">LAST</span> Last Game Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 9999
          }}
          onClick={closePlayerModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxWidth: '672px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                  {selectedPlayer.name}
                </h2>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Recent Games</span>
              </div>
              <button
                onClick={closePlayerModal}
                style={{
                  color: '#9ca3af',
                  fontSize: '24px',
                  lineHeight: 1,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                onMouseEnter={(e) => e.target.style.color = '#4b5563'}
                onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
              >
                Ã—
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {loadingGames ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>Loading games...</div>
              ) : playerGames.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>No games found</div>
              ) : (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                    Last {playerGames.length} Games
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {playerGames.map((game, index) => (
                      <div 
                        key={game.gameId}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: game.result === 'win' ? '#86efac' : game.result === 'loss' ? '#fca5a5' : '#d1d5db',
                          backgroundColor: game.result === 'win' ? '#f0fdf4' : game.result === 'loss' ? '#fef2f2' : '#f9fafb'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Game Number */}
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                              #{index + 1}
                            </div>
                            
                            {/* Result Badge */}
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: 'white',
                              backgroundColor: game.result === 'win' ? '#10b981' : game.result === 'loss' ? '#ef4444' : '#6b7280'
                            }}>
                              {game.result.toUpperCase()}
                            </div>
                            
                            {/* Score */}
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>
                              <span style={{ color: game.playerTeam === 'A' ? '#2563eb' : '#111827' }}>
                                {game.teamAScore}
                              </span>
                              <span style={{ margin: '0 8px' }}>-</span>
                              <span style={{ color: game.playerTeam === 'B' ? '#2563eb' : '#111827' }}>
                                {game.teamBScore}
                              </span>
                            </div>

                            {/* Team Indicator */}
                            <div style={{ fontSize: '14px', color: '#4b5563' }}>
                              {game.playerTeam === 'A' ? 'âšª White Team' : 'âš« Black Team'}
                            </div>
                          </div>

                          {/* Date */}
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {new Date(game.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>

                        {/* Score difference indicator */}
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                          {game.result === 'win' 
                            ? `Won by ${Math.abs(game.teamAScore - game.teamBScore)} goal${Math.abs(game.teamAScore - game.teamBScore) !== 1 ? 's' : ''}`
                            : game.result === 'loss'
                            ? `Lost by ${Math.abs(game.teamAScore - game.teamBScore)} goal${Math.abs(game.teamAScore - game.teamBScore) !== 1 ? 's' : ''}`
                            : 'Tied game'
                          }
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Stats */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Last {playerGames.length} Games Summary:</div>
                    <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                      <div>
                        <span style={{ fontWeight: '600', color: '#10b981' }}>
                          {playerGames.filter(g => g.result === 'win').length} Wins
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#ef4444' }}>
                          {playerGames.filter(g => g.result === 'loss').length} Losses
                        </span>
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: '#6b7280' }}>
                          {playerGames.filter(g => g.result === 'tie').length} Ties
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}