import { useState, useEffect }  from 'react'
import { useNavigate }           from 'react-router-dom'
import AppShell                  from '../../components/layout/AppShell'
import { analyticsAPI }          from '../../api/analytics.api'
import StatCard                  from '../../components/analytics/StatCard'
import AccuracyChart             from '../../components/analytics/AccuracyChart'
import MasteryHeatmap            from '../../components/analytics/MasteryHeatmap'
import SubjectRadar              from '../../components/analytics/SubjectRadar'
import MasteryBadge              from '../../components/MasteryBadge'
import { gradeBadgeBucket }      from '../../utils/gradeUtils'
import {
  Target, Flame, Award, BarChart2,
  BookOpen, TrendingUp, Clock, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('overview')

  const load = async () => {
    setLoading(true)
    try {
      const res = await analyticsAPI.getOverview()
      setData(res)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <AppShell title="Analytics" subtitle="Your performance insights">
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your analytics…</p>
        </div>
      </div>
    </AppShell>
  )

  const { overview, weeklyTrend, subjectBreakdown, masteryHeatmap, mockHistory, recentSessions } = data || {}

  return (
    <AppShell title="Analytics" subtitle="Track your progress and identify gaps">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {['overview', 'mastery', 'mock exams', 'sessions'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  tab === t
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* ── Overview tab ─────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              <StatCard
                label="Questions answered"
                value={overview?.totalQuestions?.toLocaleString() || 0}
                icon={Target}
                iconColour="bg-teal-100 text-teal-600"
              />
              <StatCard
                label="Overall accuracy"
                value={`${overview?.overallAccuracy || 0}%`}
                icon={BarChart2}
                iconColour="bg-blue-100 text-blue-600"
                trend={overview?.overallAccuracy >= 60 ? 'up' : 'down'}
              />
              <StatCard
                label="Current streak"
                value={`${overview?.streak || 0} days`}
                icon={Flame}
                iconColour="bg-amber-100 text-amber-600"
              />
              <StatCard
                label="Badges earned"
                value={overview?.badges?.length || 0}
                icon={Award}
                iconColour="bg-purple-100 text-purple-600"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AccuracyChart data={weeklyTrend || []} />
              <SubjectRadar  data={subjectBreakdown || []} />
            </div>

            {/* Subject breakdown table */}
            {subjectBreakdown?.length > 0 && (
              <div className="card">
                <h3 className="section-title">Subject breakdown</h3>
                <div className="space-y-3">
                  {subjectBreakdown.map(s => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700 w-40 truncate flex-shrink-0">
                        {s.subject}
                      </span>
                      <div className="flex-1 progress-bar">
                        <div
                          className="progress-fill bg-teal-500"
                          style={{ width: `${s.averageAccuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-10 text-right flex-shrink-0">
                        {s.averageAccuracy}%
                      </span>
                      <span className="text-xs text-slate-400 w-20 text-right flex-shrink-0">
                        {s.sessions} sessions
                      </span>
                      <MasteryBadge score={s.avgMastery} size="sm" showLabel={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Mastery tab ───────────────────────────────────── */}
        {tab === 'mastery' && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              Topic mastery heatmap
            </h3>
            <MasteryHeatmap data={masteryHeatmap || []} />
          </div>
        )}

        {/* ── Mock exams tab ────────────────────────────────── */}
        {tab === 'mock exams' && (
          <div className="space-y-4">
            {mockHistory?.length > 0 ? (
              mockHistory.map((e, i) => (
                <div
                  key={i}
                  onClick={() => e.examId && navigate(`/mock-exam/${e.examId}/review`)}
                  className={`card flex items-center gap-4 ${e.examId ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    {
                      green: 'bg-green-100 text-green-700',
                      teal:  'bg-teal-100 text-teal-700',
                      amber: 'bg-amber-100 text-amber-700',
                      red:   'bg-red-100 text-red-700',
                    }[gradeBadgeBucket(e.grade, e.examType)]
                  }`}>
                    {e.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{e.subject} · {e.examType}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-900">{e.totalMarks}<span className="text-sm text-slate-400">/100</span></p>
                    <p className="text-xs text-slate-500">{e.percent}%</p>
                  </div>
                  <div className="hidden sm:flex gap-2 text-xs text-slate-500 flex-shrink-0">
                    <span className="badge-teal">A: {e.sectionA}/{e.sectionATotal || 40}</span>
                    {/* A subject can genuinely have no Section B (e.g. BECE
                       Mathematics) — `?? 40` (not `|| 40`) so a real 0 isn't
                       masked into a fake "0/40", and the badge is hidden
                       entirely once that real 0 is known. */}
                    {(e.sectionBTotal ?? 40) > 0 && (
                      <span className="badge-blue">B: {e.sectionB}/{e.sectionBTotal ?? 40}</span>
                    )}
                    {/* A subject with no real Section B (e.g. BECE Mathematics)
                       has its actual WAEC "Section B" in this app's sectionC
                       bucket — label it "B" here instead of the internal "C". */}
                    <span className="badge-purple">
                      {(e.sectionBTotal ?? 40) === 0 ? 'B' : 'C'}: {e.sectionC}/{e.sectionCTotal || 20}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-16">
                <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No mock exams completed yet</p>
                <p className="text-slate-400 text-sm mt-1">Take a mock exam to see your results here</p>
              </div>
            )}
          </div>
        )}

        {/* ── Sessions tab ──────────────────────────────────── */}
        {tab === 'sessions' && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Recent practice sessions
            </h3>
            {recentSessions?.length > 0 ? (
              <div className="space-y-2.5">
                {recentSessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      s.accuracy >= 70 ? 'bg-green-100 text-green-700'
                      : s.accuracy >= 50 ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {s.accuracy}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.subject}</p>
                      <p className="text-xs text-slate-500">{s.topic || 'Mixed topics'}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400 flex-shrink-0">
                      <p>{s.totalMarks}/{s.availableMarks} marks</p>
                      <p>{new Date(s.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                No practice sessions yet
              </div>
            )}
          </div>
        )}

      </div>
    </AppShell>
  )
}