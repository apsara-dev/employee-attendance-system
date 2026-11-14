import { useState, useEffect } from 'react'
import axios from './axiosConfig'
import './App.css'
import Login from './Login'
import EmployeeDashboard from './EmployeeDashboard'

// Change this value (or set VITE_COMPANY_CODE in .env) if your company code changes in the future
const COMPANY_CODE = (import.meta.env.VITE_COMPANY_CODE || 'EMP').trim().toUpperCase()

const generateRandom4Digits = () => String(Math.floor(1000 + Math.random() * 9000))

const buildAutoEmployeeId = (name, digits) => {
  const cleanedName = String(name || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
  const first3Chars = cleanedName.slice(0, 3).padEnd(3, 'X')
  return `${COMPANY_CODE}${digits}${first3Chars}`
}

const PAGE_META = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Real-time summary of employees, daily attendance, and pending leave requests',
  },
  employees: {
    title: 'Employee Directory',
    subtitle: 'Add, edit, search, and manage all company employees',
  },
  'register-user': {
    title: 'User Account Registration',
    subtitle: 'Create and manage Admin and Employee login credentials',
  },
  attendance: {
    title: 'Daily Attendance Management',
    subtitle: 'Mark and manage daily employee attendance records',
  },
  leaves: {
    title: 'Leave Management',
    subtitle: 'Review, approve, or reject employee leave applications',
  },
  reports: {
    title: 'Monthly Attendance Reports',
    subtitle: 'Analyze monthly attendance trends and export CSV reports',
  },
}

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [employees, setEmployees] = useState([])
  const [registeredUsers, setRegisteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [randomDigits, setRandomDigits] = useState(() => generateRandom4Digits())

  // Custom Toast Alerts & Confirmation Modal state
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)

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

  const [formData, setFormData] = useState({
    employee_id: buildAutoEmployeeId('', randomDigits),
    name: '',
    email: '',
    department: '',
    joining_date: '',
  })

  // Admin User Registration Form state
  const [showRegisterForm, setShowRegisterForm] = useState(true)
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Employee',
    employee: '',
  })

  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [showLeaveForm, setShowLeaveForm] = useState(false)

  const [leaveForm, setLeaveForm] = useState({
    employee: '',
    start_date: '',
    end_date: '',
    reason: '',
  })

  const [reportEmployee, setReportEmployee] = useState('all')
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState(null)

  const [attendanceEditForm, setAttendanceEditForm] = useState({
    date: '',
    status: 'Present',
  })

  const [attendanceForm, setAttendanceForm] = useState({
    employee: '',
    date: new Date().toLocaleDateString('en-CA'),
    status: 'Present',
  })

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
    setLoggedInUser(null)
  }

  const handleRegenerateId = () => {
    const newDigits = generateRandom4Digits()
    setRandomDigits(newDigits)
    setFormData((prev) => ({
      ...prev,
      employee_id: buildAutoEmployeeId(prev.name, newDigits),
    }))
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    if (name === 'name' && !editingEmployee) {
      setFormData((prev) => ({
        ...prev,
        name: value,
        employee_id: buildAutoEmployeeId(value, randomDigits),
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDeleteEmployee = (employee) => {
    setConfirmModal({
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${employee.name} (${employee.employee_id})? This will also delete their attendance and leave records.`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/employees/${employee.id}/`)
          const response = await axios.get('/api/employees/')
          setEmployees(response.data)
          showToast(
            `Employee "${employee.name}" deleted successfully!`,
            'success'
          )
        } catch (error) {
          console.error('Error deleting employee:', error)
          showToast('Could not delete employee. Please try again.', 'error')
        }
      },
    })
  }

  const handleEditClick = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      employee_id: employee.employee_id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      joining_date: employee.joining_date,
    })
    setShowForm(true)
    setActiveSection('employees')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateEmployee = async (event) => {
    event.preventDefault()

    try {
      await axios.put(`/api/employees/${editingEmployee.id}/`, formData)
      const response = await axios.get('/api/employees/')
      setEmployees(response.data)
      setShowForm(false)
      setEditingEmployee(null)

      const newDigits = generateRandom4Digits()
      setRandomDigits(newDigits)
      setFormData({
        employee_id: buildAutoEmployeeId('', newDigits),
        name: '',
        email: '',
        department: '',
        joining_date: '',
      })

      showToast('Employee details updated successfully!', 'success')
    } catch (error) {
      console.error(error)
      showToast('Failed to update employee. Please check the details.', 'error')
    }
  }

  const handleAddEmployee = async (event) => {
    event.preventDefault()

    const payload = {
      ...formData,
      employee_id: buildAutoEmployeeId(formData.name, randomDigits),
    }

    try {
      await axios.post('/api/employees/', payload)
      showToast(
        `Employee added successfully with ID: ${payload.employee_id}`,
        'success',
        'Employee Created'
      )

      const newDigits = generateRandom4Digits()
      setRandomDigits(newDigits)
      setFormData({
        employee_id: buildAutoEmployeeId('', newDigits),
        name: '',
        email: '',
        department: '',
        joining_date: '',
      })

      setShowForm(false)

      const response = await axios.get('/api/employees/')
      setEmployees(response.data)
    } catch (error) {
      console.error('Error adding employee:', error)
      showToast(
        'Could not add employee. Please check if email or ID already exists.',
        'error'
      )
    }
  }

  const handleRegisterChange = (event) => {
    const { name, value } = event.target
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRegisterUser = async (event) => {
    event.preventDefault()
    setRegisterSuccess('')

    const payload = {
      username: registerForm.username.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      role: registerForm.role,
    }

    if (registerForm.role === 'Employee' && registerForm.employee) {
      payload.employee = Number(registerForm.employee)
    }

    try {
      const response = await axios.post('/api/register/', payload)

      const msg = `User "${response.data.username}" (${response.data.role}) registered successfully!`
      setRegisterSuccess(msg)
      showToast(msg, 'success', 'User Registered')

      setRegisterForm({
        username: '',
        email: '',
        password: '',
        role: 'Employee',
        employee: '',
      })

      axios
        .get('/api/register/')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setRegisteredUsers(res.data)
          }
        })
        .catch(() => {})
    } catch (error) {
      console.error('Error registering user:', error)
      const data = error.response?.data
      const errorMsg =
        data?.error ||
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.employee?.[0] ||
        data?.password?.[0] ||
        'Could not register user. Please check the details and try again.'
      showToast(errorMsg, 'error', 'Registration Failed')
    }
  }

  const handleLeaveStatus = (leaveId, newStatus) => {
    const action = newStatus === 'Approved' ? 'approve' : 'reject'

    setConfirmModal({
      title: `${newStatus === 'Approved' ? 'Approve' : 'Reject'} Leave Request`,
      message: `Are you sure you want to ${action} this leave request?`,
      confirmText: newStatus === 'Approved' ? 'Approve Leave' : 'Reject Leave',
      variant: newStatus === 'Approved' ? 'primary' : 'danger',
      onConfirm: async () => {
        try {
          await axios.patch(`/api/leaves/${leaveId}/status/`, {
            status: newStatus,
          })
          const response = await axios.get('/api/leaves/')
          setLeaves(response.data)
          showToast(
            `Leave request ${newStatus.toLowerCase()} successfully!`,
            'success'
          )
        } catch (error) {
          console.error('Error updating leave status:', error)
          showToast(
            error.response?.data?.error ||
              'Could not update leave status. Please try again.',
            'error'
          )
        }
      },
    })
  }

  const handleLeaveChange = (event) => {
    setLeaveForm({
      ...leaveForm,
      [event.target.name]: event.target.value,
    })
  }

  const handleSubmitLeave = async (event) => {
    event.preventDefault()

    if (leaveForm.end_date < leaveForm.start_date) {
      showToast('End date cannot be before start date.', 'warning')
      return
    }

    try {
      await axios.post('/api/leaves/', {
        employee: Number(leaveForm.employee),
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason,
      })

      const response = await axios.get('/api/leaves/')
      setLeaves(response.data)

      setLeaveForm({
        employee: '',
        start_date: '',
        end_date: '',
        reason: '',
      })

      setShowLeaveForm(false)
      showToast('Leave request submitted successfully!', 'success')
    } catch (error) {
      console.error('Error submitting leave request:', error)
      showToast('Could not submit leave request. Please check the details.', 'error')
    }
  }

  const handleAttendanceChange = (event) => {
    setAttendanceForm({
      ...attendanceForm,
      [event.target.name]: event.target.value,
    })
  }

  const handleMarkAttendance = async (event) => {
    event.preventDefault()

    try {
      await axios.post('/api/attendance/', {
        employee: Number(attendanceForm.employee),
        date: attendanceForm.date,
        status: attendanceForm.status,
      })

      showToast('Attendance marked successfully!', 'success')

      const response = await axios.get('/api/attendance/')
      setAttendance(response.data)

      setAttendanceForm({
        employee: '',
        date: new Date().toLocaleDateString('en-CA'),
        status: 'Present',
      })

      setShowAttendanceForm(false)
    } catch (error) {
      console.error('Error marking attendance:', error)
      showToast(
        'Could not mark attendance. Attendance may already be marked for this employee and date.',
        'error'
      )
    }
  }

  const handleEditAttendanceClick = (record) => {
    setEditingAttendance(record)
    setAttendanceEditForm({
      date: record.date,
      status: record.status,
    })
    setShowAttendanceForm(true)
    setActiveSection('attendance')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateAttendance = async (event) => {
    event.preventDefault()

    try {
      await axios.put(`/api/attendance/${editingAttendance.id}/`, {
        employee: editingAttendance.employee,
        date: attendanceEditForm.date,
        status: attendanceEditForm.status,
      })

      const response = await axios.get('/api/attendance/')
      setAttendance(response.data)
      setShowAttendanceForm(false)
      setEditingAttendance(null)

      setAttendanceForm({
        employee: '',
        date: new Date().toLocaleDateString('en-CA'),
        status: 'Present',
      })

      showToast('Attendance updated successfully!', 'success')
    } catch (error) {
      console.error('Error updating attendance:', error)
      showToast(
        'Could not update attendance. Please check the date and employee records.',
        'error'
      )
    }
  }

  const handleDeleteAttendance = (record) => {
    setConfirmModal({
      title: 'Delete Attendance Record',
      message: `Are you sure you want to delete this attendance record for ${record.date}?`,
      confirmText: 'Yes, Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await axios.delete(`/api/attendance/${record.id}/`)
          setAttendance((previousAttendance) =>
            previousAttendance.filter((item) => item.id !== record.id)
          )
          showToast('Attendance record deleted successfully!', 'success')
        } catch (error) {
          console.error('Error deleting attendance:', error)
          showToast('Could not delete attendance record. Please try again.', 'error')
        }
      },
    })
  }

  const handleExportCSV = () => {
    const sortedAttendance = [...monthlyAttendance].sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    const headers = ['Employee ID', 'Employee Name', 'Date', 'Status']

    const rows = sortedAttendance.map((record) => {
      const employee = employees.find(
        (item) => String(item.id) === String(record.employee)
      )

      return [
        employee ? employee.employee_id : 'Unknown',
        employee ? employee.name : 'Unknown',
        record.date,
        record.status,
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `attendance_report_${reportMonth || 'all'}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
    showToast(`Exported ${sortedAttendance.length} records to CSV!`, 'success')
  }

  useEffect(() => {
    if (!loggedInUser || loggedInUser.role !== 'Admin') return

    axios
      .get('/api/employees/')
      .then((response) => {
        setEmployees(response.data)
      })
      .catch((error) => {
        console.error('Error fetching employees:', error)
      })

    axios
      .get('/api/register/')
      .then((response) => {
        if (Array.isArray(response.data)) {
          setRegisteredUsers(response.data)
        }
      })
      .catch(() => {})
  }, [loggedInUser])

  useEffect(() => {
    if (!loggedInUser) return

    axios
      .get('/api/attendance/')
      .then((response) => {
        setAttendance(response.data)
      })
      .catch((error) => {
        console.error('Error fetching attendance:', error)
      })
  }, [loggedInUser])

  useEffect(() => {
    if (!loggedInUser) return

    axios
      .get('/api/leaves/')
      .then((response) => {
        setLeaves(response.data)
      })
      .catch((error) => {
        console.error('Error fetching leaves:', error)
      })
  }, [loggedInUser])

  const today = new Date().toLocaleDateString('en-CA')

  const todayAttendance = attendance.filter((record) => record.date === today)

  const presentToday = todayAttendance.filter(
    (record) => record.status === 'Present'
  ).length

  const absentToday = todayAttendance.filter(
    (record) => record.status === 'Absent'
  ).length

  const pendingLeaves = leaves.filter((leave) => leave.status === 'Pending')
  const pendingLeavesCount = pendingLeaves.length

  const monthlyAttendance = attendance.filter((record) => {
    const matchesMonth = record.date.startsWith(reportMonth)
    const matchesEmployee =
      reportEmployee === 'all' ||
      String(record.employee) === String(reportEmployee)

    return matchesMonth && matchesEmployee
  })

  const presentInMonth = monthlyAttendance.filter(
    (record) => record.status === 'Present'
  ).length

  const absentInMonth = monthlyAttendance.filter(
    (record) => record.status === 'Absent'
  ).length

  const lateInMonth = monthlyAttendance.filter(
    (record) => record.status === 'Late'
  ).length

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase().trim()

    return (
      String(employee.name || '').toLowerCase().includes(search) ||
      String(employee.employee_id || '').toLowerCase().includes(search) ||
      String(employee.email || '').toLowerCase().includes(search) ||
      String(employee.department || '').toLowerCase().includes(search)
    )
  })

  const sortedEmployees = [...filteredEmployees].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  if (!loggedInUser) {
    return <Login onLogin={setLoggedInUser} />
  }

  if (loggedInUser.role === 'Employee') {
    return <EmployeeDashboard user={loggedInUser} onLogout={handleLogout} />
  }

  const switchPage = (pageKey) => {
    setActiveSection(pageKey)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentMeta = PAGE_META[activeSection] || PAGE_META.dashboard

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

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <div
                className={`confirm-modal-icon ${
                  confirmModal.variant === 'primary' ? 'icon-primary' : ''
                }`}
              >
                {confirmModal.variant === 'primary' ? '✓' : '!'}
              </div>
              <h3>{confirmModal.title}</h3>
            </div>
            <p>{confirmModal.message}</p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={
                  confirmModal.variant === 'primary'
                    ? 'add-button'
                    : 'btn-confirm-danger'
                }
                onClick={async () => {
                  const action = confirmModal.onConfirm
                  setConfirmModal(null)
                  if (action) await action()
                }}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-logo">EA</div>
            <div>
              <h2 className="sidebar-title">Attendance Pro</h2>
              <p className="sidebar-subtitle">Admin Control Center</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={activeSection === 'dashboard' ? 'active' : ''}
              onClick={() => switchPage('dashboard')}
            >
              <span className="nav-icon">📊</span> Dashboard
            </button>
            <button
              className={activeSection === 'employees' ? 'active' : ''}
              onClick={() => switchPage('employees')}
            >
              <span className="nav-icon">👥</span> Employees
            </button>
            <button
              className={activeSection === 'register-user' ? 'active' : ''}
              onClick={() => switchPage('register-user')}
            >
              <span className="nav-icon">🔐</span> Register User
            </button>
            <button
              className={activeSection === 'attendance' ? 'active' : ''}
              onClick={() => switchPage('attendance')}
            >
              <span className="nav-icon">📅</span> Attendance
            </button>
            <button
              className={activeSection === 'leaves' ? 'active' : ''}
              onClick={() => switchPage('leaves')}
            >
              <span className="nav-icon">📝</span> Leave Requests
            </button>
            <button
              className={activeSection === 'reports' ? 'active' : ''}
              onClick={() => switchPage('reports')}
            >
              <span className="nav-icon">📈</span> Monthly Reports
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar">
              {loggedInUser.username?.slice(0, 2) || 'AD'}
            </div>
            <div className="user-info">
              <p className="user-name">{loggedInUser.username}</p>
              <span className="user-role-badge">{loggedInUser.role}</span>
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
            <span className="header-pill">Company Code: {COMPANY_CODE}</span>
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
          {/* PAGE 1: DASHBOARD OVERVIEW */}
          {activeSection === 'dashboard' && (
            <>
              <div className="cards">
                <div
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => switchPage('employees')}
                >
                  <h3>Total Employees</h3>
                  <p className="number">{employees.length}</p>
                  <span className="field-hint">Click to manage directory →</span>
                </div>
                <div
                  className="card card-success"
                  style={{ cursor: 'pointer' }}
                  onClick={() => switchPage('attendance')}
                >
                  <h3>Present Today</h3>
                  <p className="number">{presentToday}</p>
                  <span className="field-hint">View daily attendance →</span>
                </div>
                <div
                  className="card card-danger"
                  style={{ cursor: 'pointer' }}
                  onClick={() => switchPage('attendance')}
                >
                  <h3>Absent Today</h3>
                  <p className="number">{absentToday}</p>
                  <span className="field-hint">View daily attendance →</span>
                </div>
                <div
                  className="card card-warning"
                  style={{ cursor: 'pointer' }}
                  onClick={() => switchPage('leaves')}
                >
                  <h3>Pending Leaves</h3>
                  <p className="number">{pendingLeavesCount}</p>
                  <span className="field-hint">Review leave requests →</span>
                </div>
              </div>

              <div className="form-grid">
                <section className="section">
                  <div className="section-header">
                    <h2>Today&apos;s Attendance ({todayAttendance.length})</h2>
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => {
                        setShowAttendanceForm(true)
                        switchPage('attendance')
                      }}
                    >
                      + Mark Attendance
                    </button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayAttendance.slice(0, 6).map((record) => {
                          const emp = employees.find(
                            (e) => e.id === record.employee
                          )
                          return (
                            <tr key={record.id}>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                {emp ? (
                                  <>
                                    <span className="emp-id-pill">
                                      {emp.employee_id}
                                    </span>{' '}
                                    {emp.name}
                                  </>
                                ) : (
                                  'Unknown'
                                )}
                              </td>
                              <td>
                                <span
                                  className={`status-badge ${record.status.toLowerCase()}`}
                                >
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {todayAttendance.length === 0 && (
                          <tr>
                            <td colSpan="2">
                              No attendance marked for today yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="section">
                  <div className="section-header">
                    <h2>Pending Leave Requests ({pendingLeaves.length})</h2>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => switchPage('leaves')}
                    >
                      View All Leaves
                    </button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Dates</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLeaves.slice(0, 5).map((leave) => {
                          const emp = employees.find(
                            (e) => String(e.id) === String(leave.employee)
                          )
                          return (
                            <tr key={leave.id}>
                              <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                {emp ? emp.name : 'Unknown'}
                              </td>
                              <td>
                                {leave.start_date} → {leave.end_date}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-success"
                                  onClick={() =>
                                    handleLeaveStatus(leave.id, 'Approved')
                                  }
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger"
                                  onClick={() =>
                                    handleLeaveStatus(leave.id, 'Rejected')
                                  }
                                >
                                  ✕ Reject
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {pendingLeaves.length === 0 && (
                          <tr>
                            <td colSpan="3">No pending leave requests.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* PAGE 2: EMPLOYEES DIRECTORY */}
          {activeSection === 'employees' && (
            <section className="section">
              <div className="section-header">
                <h2>Employee Directory ({filteredEmployees.length})</h2>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !showForm
                    setShowForm(nextState)
                    setEditingEmployee(null)
                    const newDigits = generateRandom4Digits()
                    setRandomDigits(newDigits)
                    setFormData({
                      employee_id: buildAutoEmployeeId('', newDigits),
                      name: '',
                      email: '',
                      department: '',
                      joining_date: '',
                    })
                  }}
                  className="add-button"
                >
                  {showForm ? 'Cancel' : '+ Add New Employee'}
                </button>
              </div>

              {showForm && (
                <form
                  className="employee-form"
                  onSubmit={
                    editingEmployee ? handleUpdateEmployee : handleAddEmployee
                  }
                >
                  <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter employee full name (e.g. Rahul)"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>
                        Employee ID (Auto: {COMPANY_CODE} + 4 Digits + 3 Name Chars)
                      </label>
                      <div className="id-preview-row">
                        <input
                          type="text"
                          name="employee_id"
                          className="id-preview-input"
                          value={formData.employee_id}
                          readOnly
                          required
                        />
                        {!editingEmployee && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={handleRegenerateId}
                            title="Generate a new 4-digit number"
                          >
                            ↻ New ID
                          </button>
                        )}
                      </div>
                      <span className="field-hint">
                        Automatically generated as you type the employee&apos;s name.
                      </span>
                    </div>

                    <div className="form-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="employee@company.com"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="Example: Engineering, HR, Finance"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Joining Date</label>
                      <input
                        type="date"
                        name="joining_date"
                        value={formData.joining_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <button type="submit" className="add-button">
                      {editingEmployee ? 'Update Employee' : 'Save Employee'}
                    </button>
                  </div>
                </form>
              )}

              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by name, employee ID, email, or department..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                )}
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Joining Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <span className="emp-id-pill">{employee.employee_id}</span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {employee.name}
                        </td>
                        <td>{employee.email}</td>
                        <td>
                          <span className="dept-badge">{employee.department}</span>
                        </td>
                        <td>{employee.joining_date}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleEditClick(employee)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => handleDeleteEmployee(employee)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan="6">
                          No employees found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PAGE 3: ADMIN-ONLY USER REGISTRATION */}
          {activeSection === 'register-user' && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h2>User Account Registration (Admin Only)</h2>
                  <p className="field-hint">
                    Only existing logged-in Admins can register new Admin or Employee login accounts.
                  </p>
                </div>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => {
                    setShowRegisterForm(!showRegisterForm)
                    setRegisterSuccess('')
                  }}
                >
                  {showRegisterForm ? 'Hide Form' : '+ Register New User'}
                </button>
              </div>

              {registerSuccess && (
                <div className="alert-success">{registerSuccess}</div>
              )}

              {showRegisterForm && (
                <form onSubmit={handleRegisterUser} className="employee-form">
                  <h3>Create Login Account</h3>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Username</label>
                      <input
                        type="text"
                        name="username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        placeholder="Enter login username"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        placeholder="user@company.com"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="Create a strong password"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Account Role</label>
                      <select
                        name="role"
                        value={registerForm.role}
                        onChange={handleRegisterChange}
                        required
                      >
                        <option value="Employee">Employee</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    {registerForm.role === 'Employee' && (
                      <div className="form-field">
                        <label>Link to Employee Record (Optional)</label>
                        <select
                          name="employee"
                          value={registerForm.employee}
                          onChange={handleRegisterChange}
                        >
                          <option value="">-- Select Employee Profile --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.employee_id} - {emp.name} ({emp.department})
                            </option>
                          ))}
                        </select>
                        <span className="field-hint">
                          Linking allows this employee to view their attendance & leaves on login.
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <button type="submit" className="add-button">
                      Register User Account
                    </button>
                  </div>
                </form>
              )}

              <h3>Registered User Accounts ({registeredUsers.length})</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Linked Employee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {u.username}
                        </td>
                        <td>{u.email || '—'}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              u.role === 'Admin' ? 'approved' : 'pending'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.employee_code ? (
                            <>
                              <span className="emp-id-pill">
                                {u.employee_code}
                              </span>{' '}
                              {u.employee_name}
                            </>
                          ) : (
                            'Not Linked'
                          )}
                        </td>
                      </tr>
                    ))}
                    {registeredUsers.length === 0 && (
                      <tr>
                        <td colSpan="4">No user accounts found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PAGE 4: DAILY ATTENDANCE */}
          {activeSection === 'attendance' && (
            <section className="section">
              <div className="section-header">
                <h2>Daily Attendance Records ({attendance.length})</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleExportCSV}
                  >
                    ⬇ Export CSV
                  </button>
                  <button
                    type="button"
                    className="add-button"
                    onClick={() => {
                      setShowAttendanceForm(!showAttendanceForm)
                      setEditingAttendance(null)
                    }}
                  >
                    {showAttendanceForm ? 'Cancel' : '+ Mark Attendance'}
                  </button>
                </div>
              </div>

              {showAttendanceForm && (
                <form
                  onSubmit={
                    editingAttendance
                      ? handleUpdateAttendance
                      : handleMarkAttendance
                  }
                  className="employee-form"
                >
                  <h3>
                    {editingAttendance ? 'Edit Attendance' : 'Mark Daily Attendance'}
                  </h3>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Select Employee</label>
                      <select
                        name="employee"
                        value={
                          editingAttendance
                            ? String(editingAttendance.employee)
                            : attendanceForm.employee
                        }
                        onChange={handleAttendanceChange}
                        disabled={Boolean(editingAttendance)}
                        required
                      >
                        <option value="">Choose an employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.employee_id} - {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Attendance Date</label>
                      <input
                        type="date"
                        name="date"
                        value={
                          editingAttendance
                            ? attendanceEditForm.date
                            : attendanceForm.date
                        }
                        onChange={(event) => {
                          if (editingAttendance) {
                            setAttendanceEditForm({
                              ...attendanceEditForm,
                              date: event.target.value,
                            })
                          } else {
                            handleAttendanceChange(event)
                          }
                        }}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Status</label>
                      <select
                        name="status"
                        value={
                          editingAttendance
                            ? attendanceEditForm.status
                            : attendanceForm.status
                        }
                        onChange={(event) => {
                          if (editingAttendance) {
                            setAttendanceEditForm({
                              ...attendanceEditForm,
                              status: event.target.value,
                            })
                          } else {
                            handleAttendanceChange(event)
                          }
                        }}
                        required
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <button type="submit" className="add-button">
                      {editingAttendance ? 'Update Attendance' : 'Save Attendance'}
                    </button>
                  </div>
                </form>
              )}

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => {
                      const employee = employees.find(
                        (item) => item.id === record.employee
                      )

                      return (
                        <tr key={record.id}>
                          <td>
                            <span className="emp-id-pill">
                              {employee ? employee.employee_id : 'Unknown'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            {employee ? employee.name : 'Unknown'}
                          </td>
                          <td>{record.date}</td>
                          <td>
                            <span
                              className={`status-badge ${record.status.toLowerCase()}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleEditAttendanceClick(record)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              onClick={() => handleDeleteAttendance(record)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}

                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="5">No attendance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PAGE 5: LEAVE MANAGEMENT */}
          {activeSection === 'leaves' && (
            <section className="section">
              <div className="section-header">
                <h2>Leave Applications ({leaves.length})</h2>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => setShowLeaveForm(!showLeaveForm)}
                >
                  {showLeaveForm ? 'Cancel' : '+ Apply for Leave'}
                </button>
              </div>

              {showLeaveForm && (
                <form onSubmit={handleSubmitLeave} className="employee-form">
                  <h3>Submit Leave Request</h3>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>Select Employee</label>
                      <select
                        name="employee"
                        value={leaveForm.employee}
                        onChange={handleLeaveChange}
                        required
                      >
                        <option value="">Choose an employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.employee_id} - {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={leaveForm.start_date}
                        onChange={handleLeaveChange}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={leaveForm.end_date}
                        onChange={handleLeaveChange}
                        min={leaveForm.start_date || undefined}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Reason for Leave</label>
                    <textarea
                      name="reason"
                      value={leaveForm.reason}
                      onChange={handleLeaveChange}
                      placeholder="Enter the reason for leave"
                      required
                    />
                  </div>

                  <div>
                    <button type="submit" className="add-button">
                      Submit Leave Request
                    </button>
                  </div>
                </form>
              )}

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Reason</th>
                      <th>Status / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => {
                      const employee = employees.find(
                        (item) => String(item.id) === String(leave.employee)
                      )

                      return (
                        <tr key={leave.id}>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            {employee ? (
                              <>
                                <span className="emp-id-pill">
                                  {employee.employee_id}
                                </span>{' '}
                                {employee.name}
                              </>
                            ) : (
                              'Unknown'
                            )}
                          </td>
                          <td>{leave.start_date}</td>
                          <td>{leave.end_date}</td>
                          <td>{leave.reason}</td>
                          <td>
                            {leave.status === 'Pending' ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-success"
                                  onClick={() =>
                                    handleLeaveStatus(leave.id, 'Approved')
                                  }
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-danger"
                                  onClick={() =>
                                    handleLeaveStatus(leave.id, 'Rejected')
                                  }
                                >
                                  ✕ Reject
                                </button>
                              </>
                            ) : (
                              <span
                                className={`status-badge ${leave.status.toLowerCase()}`}
                              >
                                {leave.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}

                    {leaves.length === 0 && (
                      <tr>
                        <td colSpan="5">No leave requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* PAGE 6: MONTHLY ATTENDANCE REPORTS */}
          {activeSection === 'reports' && (
            <section className="section">
              <div className="section-header">
                <h2>Monthly Attendance Report</h2>
                <button
                  type="button"
                  className="add-button"
                  onClick={handleExportCSV}
                >
                  ⬇ Export Report CSV
                </button>
              </div>

              <div className="form-grid" style={{ marginBottom: '22px' }}>
                <div className="form-field">
                  <label>Filter by Employee</label>
                  <select
                    value={reportEmployee}
                    onChange={(event) => setReportEmployee(event.target.value)}
                  >
                    <option value="all">All Employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={String(employee.id)}>
                        {employee.employee_id} - {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Select Month</label>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(event) => setReportMonth(event.target.value)}
                  />
                </div>
              </div>

              <div className="cards">
                <div className="card card-success">
                  <h3>Present in {reportMonth}</h3>
                  <p className="number">{presentInMonth}</p>
                </div>
                <div className="card card-danger">
                  <h3>Absent in {reportMonth}</h3>
                  <p className="number">{absentInMonth}</p>
                </div>
                <div className="card card-warning">
                  <h3>Late in {reportMonth}</h3>
                  <p className="number">{lateInMonth}</p>
                </div>
              </div>

              <h3>Filtered Attendance Details ({monthlyAttendance.length})</h3>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyAttendance.map((record) => {
                      const employee = employees.find(
                        (item) => String(item.id) === String(record.employee)
                      )

                      return (
                        <tr key={record.id}>
                          <td>
                            <span className="emp-id-pill">
                              {employee ? employee.employee_id : 'Unknown'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#0f172a' }}>
                            {employee ? employee.name : 'Unknown'}
                          </td>
                          <td>{record.date}</td>
                          <td>
                            <span
                              className={`status-badge ${record.status.toLowerCase()}`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {monthlyAttendance.length === 0 && (
                      <tr>
                        <td colSpan="4">No records found for this selection.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
