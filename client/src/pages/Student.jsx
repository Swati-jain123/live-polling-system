import { useEffect, useMemo, useState } from 'react'
import { socket } from '../socket'
import ResultsChart from '../components/ResultsChart.jsx'
import ChatPopup from '../components/ChatPopup.jsx'

export default function Student() {
  const [name, setName] = useState(() => sessionStorage.getItem('studentName') || '')
  const [editingName, setEditingName] = useState(!sessionStorage.getItem('studentName'))
  const [active, setActive] = useState(null) // { pollId, question, options, expiresAtSec, expected }
  const [counts, setCounts] = useState([])
  const [responded, setResponded] = useState(0)
  const [expected, setExpected] = useState(0)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (name && !editingName) {
      socket.emit('register', { name, role: 'student' })
    }
  }, [name, editingName])

  useEffect(() => {
    const onStarted = (data) => { setActive(data); setCounts(new Array(data.options.length).fill(0)); setResponded(0); setExpected(data.expected); setSelected(null) }
    const onUpdate = (data) => {
      if (!active || data.pollId === active.pollId) {
        setCounts(data.counts); setResponded(data.responded); setExpected(data.expected)
      }
    }
    const onEnded = (data) => { setActive(null); setCounts([]); setResponded(0); setSelected(null) }
    socket.on('poll:started', onStarted)
    socket.on('poll:update', onUpdate)
    socket.on('poll:ended', onEnded)
    return () => {
      socket.off('poll:started', onStarted)
      socket.off('poll:update', onUpdate)
      socket.off('poll:ended', onEnded)
    }
  }, [active])

  const remaining = useMemo(() => {
    if (!active) return 0
    const sec = Math.max(0, active.expiresAtSec - Math.floor(Date.now()/1000))
    return sec
  }, [active])

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => {
      // trigger re-render for remaining
      setActive(a => a ? ({ ...a }) : a)
    }, 1000)
    return () => clearInterval(t)
  }, [active])

  const submit = (i) => {
    if (!active || selected !== null) return
    setSelected(i)
    socket.emit('student:submitAnswer', { optionIndex: i })
  }

  return (
    <div>
      <div className="card">
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Student</div>
            <div className="badge">Name: {name || 'Not set'}</div>
          </div>
          {!editingName ? (
            <button className="button" onClick={() => setEditingName(true)}>Change Name</button>
          ) : null}
        </div>
        {editingName ? (
          <div className="row" style={{ marginTop: 12 }}>
            <input className="input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
            <button className="button" onClick={() => { if (name.trim()) { sessionStorage.setItem('studentName', name.trim()); setEditingName(false) } }}>Save</button>
          </div>
        ) : null}
      </div>

      {!active ? (
        <div className="card">
          <div style={{ fontSize: 18, fontWeight: 600 }}>Waiting for the teacher to start a poll…</div>
        </div>
      ) : (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{active.question}</div>
            <div className="badge">Time left: {remaining}s</div>
          </div>
          <div className="col" style={{ marginTop: 12 }}>
            {active.options.map((opt, i) => (
              <div key={i} className={'option ' + (selected !== null ? 'disabled' : '')} onClick={() => submit(i)}>
                {opt}
              </div>
            ))}
          </div>
          {selected !== null || remaining === 0 ? (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Live Results</div>
              <div className="badge">Responded {responded}/{expected}</div>
              <ResultsChart options={active.options} counts={counts} />
            </div>
          ) : null}
        </div>
      )}

      <div className="footer">Tip: Keep this tab open; each tab is a unique student.</div>

      <ChatPopup role="student" name={name || 'Student'} />
    </div>
  )
}
