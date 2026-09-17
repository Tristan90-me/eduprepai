import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, Shuffle } from 'lucide-react'
import { practiceAPI } from '../api/practice.api'
import { useAuth } from '../context/AuthContext'
import { getSubjectsForExamType } from '../constants/subjects'

// ── CommandPalette ─────────────────────────────────────────────
// ⌘K / Ctrl+K quick-jump: search a subject or topic and land
// straight in a practice session for it — no setup screen detour.
export default function CommandPalette({ open, onClose }) {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const examType   = user?.examType || 'WASSCE'
  const subjectPool = user?.subjects?.length > 0 ? user.subjects : getSubjectsForExamType(examType)

  const [query,       setQuery]       = useState('')
  const [topicResults, setTopicResults] = useState([])
  const [searching,   setSearching]   = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)

  // Reset + focus every time the palette opens
  useEffect(() => {
    if (!open) return
    setQuery('')
    setTopicResults([])
    setActiveIndex(0)
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  // Subject matches — instant, client-side
  const subjectMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return subjectPool.filter(s => s.toLowerCase().includes(q)).slice(0, 5)
  }, [query, subjectPool])

  // Topic matches — debounced cross-subject server search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setTopicResults([]); return }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const data = await practiceAPI.searchTopics({ q, examType })
        setTopicResults(data.topics || [])
      } catch {
        setTopicResults([])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, examType])

  useEffect(() => { setActiveIndex(0) }, [query])

  const items = useMemo(() => [
    ...subjectMatches.map(s => ({ kind: 'subject', subject: s })),
    ...topicResults.map(t => ({ kind: 'topic', subject: t.subject, topic: t.topic, count: t.count })),
  ], [subjectMatches, topicResults])

  const goToPractice = (item) => {
    const params = new URLSearchParams({ subject: item.subject, autostart: '1' })
    if (item.kind === 'topic') params.set('topic', item.topic)
    navigate(`/practice?${params.toString()}`)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1)); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (items[activeIndex]) goToPractice(items[activeIndex])
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search a subject or topic — e.g. Algebra, Chemistry…"
            className="flex-1 text-sm outline-none placeholder-slate-400 bg-transparent"
          />
          <kbd className="text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {!query.trim() && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Start typing to jump straight into a practice session.
            </p>
          )}

          {query.trim() && items.length === 0 && !searching && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              No subjects or topics match "{query}".
            </p>
          )}

          {subjectMatches.length > 0 && (
            <div className="px-2">
              <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Subjects
              </p>
              {subjectMatches.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => goToPractice({ kind: 'subject', subject: s })}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                    activeIndex === i ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <span className="flex-1 truncate">{s}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">Mixed practice</span>
                </button>
              ))}
            </div>
          )}

          {topicResults.length > 0 && (
            <div className="px-2 mt-1">
              <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Topics
              </p>
              {topicResults.map((t, i) => {
                const idx = subjectMatches.length + i
                return (
                  <button
                    key={`${t.subject}-${t.topic}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => goToPractice({ kind: 'topic', subject: t.subject, topic: t.topic })}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeIndex === idx ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                    <span className="flex-1 truncate">{t.topic}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{t.subject} · {t.count} Qs</span>
                  </button>
                )
              })}
            </div>
          )}

          {searching && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400">
              <span className="spinner w-3.5 h-3.5" /> Searching topics…
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 border border-slate-200 rounded px-1">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 border border-slate-200 rounded px-1">↵</kbd> jump into practice
          </span>
        </div>
      </div>
    </div>
  )
}
