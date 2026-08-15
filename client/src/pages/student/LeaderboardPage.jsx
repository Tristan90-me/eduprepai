import { useState, useEffect } from 'react'
import AppShell                 from '../../components/layout/AppShell'
import { analyticsAPI }         from '../../api/analytics.api'
import { Trophy, Medal, Flame, Target } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Rank medal colours ─────────────────────────────────────────
const rankStyle = (rank) => {
  if (rank === 1) return 'bg-amber-100 text-amber-700 border-amber-300'
  if (rank === 2) return 'bg-slate-100 text-slate-600 border-slate-300'
  if (rank === 3) return 'bg-orange-100 text-orange-700 border-orange-300'
  return 'bg-white text-slate-500 border-slate-200'
}

export default function LeaderboardPage() {
  const [data,    setData]    = useState([])
  const [myRank,  setMyRank]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsAPI.getLeaderboard()
        setData(res.leaderboard || [])
        setMyRank(res.currentUserRank)
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <AppShell title="Leaderboard" subtitle="Top students">
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppShell>
  )

  const top3 = data.slice(0, 3)
  const rest  = data.slice(3)

  return (
    <AppShell title="Leaderboard" subtitle="Top students by questions answered and accuracy">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* My rank banner */}
        {myRank && (
          <div className="card bg-teal-50 border-teal-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-teal-900 text-sm">Your rank</p>
              <p className="text-teal-700 text-xs">
                #{myRank} overall · Keep practising to climb higher
              </p>
            </div>
            <span className="ml-auto text-2xl font-bold text-teal-700" style={{ fontFamily: 'var(--font-heading)' }}>
              #{myRank}
            </span>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((u, i) => {
              const actualRank = u.rank
              const height     = actualRank === 1 ? 'h-28' : actualRank === 2 ? 'h-20' : 'h-16'
              return (
                <div key={u.rank} className={`card text-center ${u.isCurrentUser ? 'ring-2 ring-teal-500' : ''}`}>
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center border-2 font-bold text-sm ${rankStyle(actualRank)}`}>
                    {actualRank}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate mb-2">{u.school}</p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">{u.questions}</span> Qs
                  </p>
                  <p className="text-xs text-teal-600 font-medium">{u.accuracy}% accuracy</p>
                  {actualRank === 1 && <Trophy className="w-5 h-5 text-amber-500 mx-auto mt-2" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Full table */}
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">Rank</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Questions</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Streak</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, i) => (
                <tr
                  key={u.rank}
                  className={`border-b border-slate-50 transition-colors ${
                    u.isCurrentUser
                      ? 'bg-teal-50 font-medium'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${rankStyle(u.rank)}`}>
                      {u.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className={`text-sm ${u.isCurrentUser ? 'font-semibold text-teal-800' : 'text-slate-800'}`}>
                      {u.name} {u.isCurrentUser && <span className="text-teal-500 text-xs">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-400">{u.school}</p>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-slate-600 hidden sm:table-cell">
                    {u.questions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-sm font-semibold ${
                      u.accuracy >= 70 ? 'text-green-600'
                      : u.accuracy >= 50 ? 'text-teal-600'
                      : 'text-slate-600'
                    }`}>
                      {u.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    <div className="flex items-center gap-1 justify-end">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-slate-600">{u.streak}d</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No students on the leaderboard yet. Be the first to complete practice sessions!
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}