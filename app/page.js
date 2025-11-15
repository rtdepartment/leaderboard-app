import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Soccer Pickup Stats
          </h1>
          <p className="text-lg text-gray-600">
            Track wins, losses, and player rankings for your pickup games
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/leaderboard" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">📊 Leaderboard</h2>
            <p className="text-gray-600">View current rankings and player stats</p>
          </Link>

          <Link href="/admin" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">⚙️ Admin</h2>
            <p className="text-gray-600">Add players and record game results</p>
          </Link>

          <Link href="/team-builder" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">⚽ Team Builder</h2>
            <p className="text-gray-600">Generate balanced teams for today's game</p>
          </Link>
        </div>
      </div>
    </div>
  )
}