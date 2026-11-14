import { useEffect, useState } from 'react'
import axios from './axiosConfig'

function EmployeeDashboard({ user, onLogout }) {
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })

  const token = localStorage.getItem('accessToken')

  const fetchData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const [attendanceResponse, leaveResponse] = await Promise.all([
        axios.get('/api/attendance/', config),
        axios.get('/api/leaves/', config),
      ])

      setAttendance(attendanceResponse.data)
      setLeaves(leaveResponse.data)
    } catch (error) {
      console.error('Error fetching employee data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
    onLogout()
  }

  const handleLeaveSubmit = async (event) => {
    event.preventDefault()

    if (leaveForm.end_date < leaveForm.start_date) {
      alert('End date cannot be before start date.')
      return
    }

    try {
      await axios.post('/api/leaves/', {
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason,
      })

      setLeaveForm({ start_date: '', end_date: '', reason: '' })
      setShowLeaveForm(false)
      await fetchData()
      alert('Leave request submitted successfully!')
    } catch (error) {
      console.error('Error submitting leave:', error)
      alert(
        error.response?.data?.error ||
        'Could not submit leave request. Please make sure your user account is linked to an employee profile.'
      )
    }
  }

  const presentCount = attendance.filter((r) => r.status === 'Present').length
  const absentCount = attendance.filter((r) => r.status === 'Absent').length
  const lateCount = attendance.filter((r) => r.status === 'Late').length

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-logo">EA</div>
            <div>
              <h2 className="sidebar-title">Employee Portal</h2>
              <p className="sidebar-subtitle">Self-Service Workspace</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              <span className="nav-icon">📊</span> Overview
            </button>
            <button
              className={activeTab === 'attendance' ? 'active' : ''}
              onClick={() => setActiveTab('attendance')}
            >
              <span className="nav-icon">📅</span> My Attendance
            </button>
            <button
              className={activeTab === 'leaves' ? 'active' : ''}
              onClick={() => setActiveTab('leaves')}
            >
              <span className="nav-icon">📝</span> My Leaves
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar">{user.username?.slice(0, 2)}</div>
            <div className="user-info">
              <p className="user-name">{user.username}</p>
              <span className="user-role-badge">Employee</span>
            </div>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="header">
          <div>
            <h1>Welcome, {user.username}!</h1>
            <p>Track your daily attendance and manage leave applications</p>
          </div>
          <div className="header-badges">
            <span className="header-pill">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </header>

        <main className="dashboard">
          <div className="cards">
            <div className="card">
              <h3>Total Recorded Days</h3>
              <p className="number">{attendance.length}</p>
            </div>
            <div className="card card-success">
              <h3>Days Present</h3>
              <p className="number">{presentCount}</p>
            </div>
            <div className="card card-danger">
              <h3>Days Absent</h3>
              <p className="number">{absentCount}</p>
            </div>
            <div className="card card-warning">
              <h3>Days Late</h3>
              <p className="number">{lateCount}</p>
            </div>
          </div>

          {(activeTab === 'overview' || activeTab === 'attendance') && (
            <section className="section">
              <div className="section-header">
                <h2>My Attendance History</h2>
              </div>

              {loading ? (
                <p>Loading attendance records...</p>
              ) : attendance.length === 0 ? (
                <p>No attendance records found.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>
                            <span
                              className={`status-badge ${record.status.toLowerCase()}`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'leaves') && (
            <section className="section">
              <div className="section-header">
                <h2>My Leave Applications</h2>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => setShowLeaveForm(!showLeaveForm)}
                >
                  {showLeaveForm ? 'Cancel' : '+ Apply for Leave'}
                </button>
              </div>

              {showLeaveForm && (
                <form onSubmit={handleLeaveSubmit} className="employee-form">
                  <h3>Submit Leave Request</h3>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={leaveForm.start_date}
                        onChange={(e) =>
                          setLeaveForm({ ...leaveForm, start_date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={leaveForm.end_date}
                        min={leaveForm.start_date || undefined}
                        onChange={(e) =>
                          setLeaveForm({ ...leaveForm, end_date: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Reason for Leave</label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) =>
                        setLeaveForm({ ...leaveForm, reason: e.target.value })
                      }
                      placeholder="Enter reason for leave..."
                      required
                    />
                  </div>
                  <button type="submit" className="add-button">
                    Submit Leave Application
                  </button>
                </form>
              )}

              {loading ? (
                <p>Loading leave applications...</p>
              ) : leaves.length === 0 ? (
                <p>No leave applications found.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => (
                        <tr key={leave.id}>
                          <td>{leave.start_date}</td>
                          <td>{leave.end_date}</td>
                          <td>{leave.reason}</td>
                          <td>
                            <span
                              className={`status-badge ${leave.status.toLowerCase()}`}
                            >
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default EmployeeDashboard
