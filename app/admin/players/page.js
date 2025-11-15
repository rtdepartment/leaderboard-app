'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Country data with emoji flags
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
].sort((a, b) => a.name.localeCompare(b.name))

export default function PlayerCountryPage() {
  const [players, setPlayers] = useState([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerCountry, setNewPlayerCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('add') // 'add' or 'update'
  const [editMode, setEditMode] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data || [])
    }
  }

  const addPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) {
      setMessage('Please enter a player name')
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('players')
      .insert([{ 
        name: newPlayerName.trim(),
        country: newPlayerCountry || null
      }])
      .select()

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`Added player: ${newPlayerName} ${newPlayerCountry ? COUNTRIES.find(c => c.code === newPlayerCountry)?.flag : ''}`)
      setNewPlayerName('')
      setNewPlayerCountry('')
      fetchPlayers()
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const updatePlayerCountry = async (playerId, countryCode) => {
    setLoading(true)
    const { error } = await supabase
      .from('players')
      .update({ country: countryCode || null })
      .eq('id', playerId)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      const player = players.find(p => p.id === playerId)
      const country = COUNTRIES.find(c => c.code === countryCode)
      setMessage(`Updated ${player.name}: ${country ? country.flag : 'No country'}`)
      fetchPlayers()
      setEditMode({ ...editMode, [playerId]: false })
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return ''
    const country = COUNTRIES.find(c => c.code === countryCode)
    return country ? country.flag : ''
  }

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Player Country Manager</h1>
          <a 
            href="/admin" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Admin
          </a>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b">
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('add')}
          >
            Add New Player
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'update' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('update')}
          >
            Update Existing Players
          </button>
        </div>

        {/* Add New Player Tab */}
        {activeTab === 'add' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Player</h2>
            <form onSubmit={addPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Player Name</label>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country (Optional)</label>
                <select
                  value={newPlayerCountry}
                  onChange={(e) => setNewPlayerCountry(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">-- No Country --</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Add Player
                </button>
                {newPlayerCountry && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-600">Preview:</span>
                    <span className="text-2xl">{getCountryFlag(newPlayerCountry)}</span>
                    <span className="font-medium">{newPlayerName || 'Player Name'}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Update Existing Players Tab */}
        {activeTab === 'update' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Update Existing Players</h2>
            
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search players..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Players List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCountryFlag(player.country)}</span>
                    <span className="font-medium">{player.name}</span>
                    {!player.country && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">No country set</span>
                    )}
                  </div>

                  {editMode[player.id] ? (
                    <div className="flex items-center space-x-2">
                      <select
                        defaultValue={player.country || ''}
                        onChange={(e) => updatePlayerCountry(player.id, e.target.value)}
                        className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="">-- No Country --</option>
                        {COUNTRIES.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditMode({ ...editMode, [player.id]: false })}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditMode({ ...editMode, [player.id]: true })}
                      className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Edit Country
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}