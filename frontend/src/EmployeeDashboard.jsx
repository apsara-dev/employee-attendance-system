import { useEffect, useState } from 'react'
import axios from './axiosConfig'

const EMP_PAGE_META = {
  overview: {
    title: 'Employee Overview',
    subtitle: 'Summary of your attendance performance and recent leave requests',
  },
  attendance: {
    title: 'My Attendance History',
    subtitle: 'Complete log of your daily attendance records',
  },
  leaves: {
    title: 'My Leave Applications',
    subtitle: 'Submit new leave requests and track approval status',
  },
}

function EmployeeDashboard({ user, onLogout }) {
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [toasts, setToasts] = useState([])
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })

  const showToast = (message, type = 'success', title = '') => {
    const id = Date.now() + Math.random()
    const defaultTitle =
      title ||
      (type === 'success'
        ? 'Success'
        : type === 'error'
        ? 'Error'
        : 'Warning')

    setToasts((prev) => [...prev, { id, message, type, title: defaultTitle }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id))
    }, 4000)
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }

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
      showToast('End date cannot be before start date.', 'warning')
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
      showToast('Leave request submitted successfully!', 'success')
    } catch (error) {
      console.error('Error submitting leave:', error)
      showToast(
        error.response?.data?.error ||
          'Could not submit leave request. Please make sure your user account is linked to an employee profile.',
        'error'
      )
    }
  }

  const presentCount = attendance.filter((r) => r.status === 'Present').length
  const absentCount = attendance.filter((r) => r.status === 'Absent').length
  const lateCount = attendance.filter((r) => r.status === 'Late').length
  const currentMeta = EMP_PAGE_META[activeTab] || EMP_PAGE_META.overview

  return (
    <div className="app-layout">
      {/* Custom Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`custom-toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success'
                ? '✓'
                : toast.type === 'error'
                ? '✕'
                : '!'}
            </div>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismissToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

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
            <h1>{currentMeta.title}</h1>
            <p>{currentMeta.subtitle}</p>
          </div>
          <div className="header-badges">
            <span className="header-pill">User: {user.username}</span>
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
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className="cards">
                <div
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('attendance')}
                >
                  <h3>Total Recorded Days</h3>
                  <p className="number">{attendance.length}</p>
                  <span className="field-hint">View full attendance →</span>
                </div>
                <div
                  className="card card-success"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('attendance')}
                >
                  <h3>Days Present</h3>
                  <p className="number">{presentCount}</p>
                  <span className="field-hint">View attendance log →</span>
                </div>
                <div
                  className="card card-danger"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('attendance')}
                >
                  <h3>Days Absent</h3>
                  <p className="number">{absentCount}</p>
                  <span className="field-hint">View attendance log →</span>
                </div>
                <div
                  className="card card-warning"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab('leaves')}
                >
                  <h3>Leave Requests</h3>
                  <p className="number">{leaves.length}</p>
                  <span className="field-hint">Manage leaves →</span>
                </div>
              </div>

              <div className="form-grid">
                <section className="section">
                  <div className="section-header">
                    <h2>Recent Attendance</h2>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setActiveTab('attendance')}
                    >
                      View All ({attendance.length})
                    </button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.slice(0, 5).map((record) => (
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
                        {attendance.length === 0 && (
                          <tr>
                            <td colSpan="2">No attendance records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="section">
                  <div className="section-header">
                    <h2>Recent Leave Requests</h2>
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => {
                        setShowLeaveForm(true)
                        setActiveTab('leaves')
                      }}
                    >
                      + Apply for Leave
                    </button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Dates</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.slice(0, 5).map((leave) => (
                          <tr key={leave.id}>
                            <td>
                              {leave.start_date} → {leave.end_date}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${leave.status.toLowerCase()}`}
                              >
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {leaves.length === 0 && (
                          <tr>
                            <td colSpan="2">No leave applications found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* TAB 2: MY ATTENDANCE */}
          {activeTab === 'attendance' && (
            <section className="section">
              <div className="section-header">
                <h2>My Attendance History ({attendance.length})</h2>
                <span className="field-hint">
                  Present: {presentCount} | Absent: {absentCount} | Late: {lateCount}
                </span>
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

          {/* TAB 3: MY LEAVES */}
          {activeTab === 'leaves' && (
            <section className="section">
              <div className="section-header">
                <h2>My Leave Applications ({leaves.length})</h2>
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
                  <div>
                    <button type="submit" className="add-button">
                      Submit Leave Application
                    </button>
                  </div>
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
