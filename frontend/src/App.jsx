
import { useState, useEffect } from 'react'
import axios from './axiosConfig'
import './App.css'
import Login from './Login'
import EmployeeDashboard from './EmployeeDashboard'

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  
  const [activeSection, setActiveSection] = useState('dashboard')


const [formData, setFormData] = useState({
  employee_id: '',
  name: '',
  email: '',
  department: '',
  joining_date: ''
})
const handleDeleteEmployee = async (employee) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete ${employee.name}? This will also delete their attendance and leave records.`
  )

  if (!confirmDelete) {
    return
  }

  try {
    await axios.delete(
      `/api/employees/${employee.id}/`
    )

    const response = await axios.get(
      '/api/employees/'
    )

    setEmployees(response.data)

    alert('Employee deleted successfully!')
  } catch (error) {
    console.error('Error deleting employee:', error)
    alert('Could not delete employee. Please try again.')
  }
}
const handleEditClick = (employee) => {
  setEditingEmployee(employee)

  setFormData({
    employee_id: employee.employee_id,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    joining_date: employee.joining_date
  })

  setShowForm(true)
}

const handleUpdateEmployee = async (event) => {
  event.preventDefault()

  try {
    await axios.put(
      `/api/employees/${editingEmployee.id}/`,
      formData
    )

    const response = await axios.get(
      '/api/employees/'
    )

    setEmployees(response.data)
    setShowForm(false)
    setEditingEmployee(null)

    setFormData({
      employee_id: '',
      name: '',
      email: '',
      department: '',
      joining_date: ''
    })

    alert('Employee updated successfully!')
  } catch (error) {
    console.error(error)
    alert('Failed to update employee. Please check the details.')
  }
}

const handleInputChange = (event) => {
  setFormData({
    ...formData,
    [event.target.name]: event.target.value
  })
}

const handleAddEmployee = async (event) => {
  event.preventDefault()

  try {
    await axios.post(
      '/api/employees/',
      formData
    )

    alert('Employee added successfully!')

    setFormData({
      employee_id: '',
      name: '',
      email: '',
      department: '',
      joining_date: ''
    })

    setShowForm(false)

    const response = await axios.get(
      '/api/employees/'
    )

    setEmployees(response.data)
  } catch (error) {
    console.error('Error adding employee:', error)
    alert('Could not add employee. Please check the details and try again.')
  }
}

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
  status: 'Present'
})


const [attendanceForm, setAttendanceForm] = useState({
  employee: '',
  date: new Date().toLocaleDateString('en-CA'),
  status: 'Present'
})

const handleLeaveStatus = async (leaveId, newStatus) => {
  const action = newStatus === 'Approved' ? 'approve' : 'reject'

  if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) {
    return
  }

  try {
    await axios.patch(
      `/api/leaves/${leaveId}/status/`,
      { status: newStatus }
    )

    const response = await axios.get(
      '/api/leaves/'
    )

    setLeaves(response.data)

    alert(`Leave request ${newStatus.toLowerCase()} successfully!`)
  } catch (error) {
    console.error('Error updating leave status:', error)

    alert(
      error.response?.data?.error ||
      'Could not update leave status. Please try again.'
    )
  }
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
    alert('End date cannot be before start date.')
    return
  }

  try {
    await axios.post('/api/leaves/', {
      employee: Number(leaveForm.employee),
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason,
    })

    const response = await axios.get(
      '/api/leaves/'
    )

    setLeaves(response.data)

    setLeaveForm({
      employee: '',
      start_date: '',
      end_date: '',
      reason: '',
    })

    setShowLeaveForm(false)
    alert('Leave request submitted successfully!')
  } catch (error) {
    console.error('Error submitting leave request:', error)
    alert('Could not submit leave request. Please check the details.')
  }
}

const handleAttendanceChange = (event) => {
  setAttendanceForm({
    ...attendanceForm,
    [event.target.name]: event.target.value
  })
}

const handleMarkAttendance = async (event) => {
  event.preventDefault()

  try {
    await axios.post(
      '/api/attendance/',
      {
        employee: Number(attendanceForm.employee),
        date: attendanceForm.date,
        status: attendanceForm.status
      }
    )

    alert('Attendance marked successfully!')

    const response = await axios.get(
      '/api/attendance/'
    )

    setAttendance(response.data)

    setAttendanceForm({
      employee: '',
      date: new Date().toLocaleDateString('en-CA'),
      status: 'Present'
    })

    setShowAttendanceForm(false)
  } catch (error) {
    console.error('Error marking attendance:', error)
    alert(
      'Could not mark attendance. Please check the details or whether attendance is already marked for this employee and date.'
    )
  }
}

const handleEditAttendanceClick = (record) => {
  setEditingAttendance(record)

  setAttendanceEditForm({
    date: record.date,
    status: record.status
  })

  setShowAttendanceForm(true)
}

const handleUpdateAttendance = async (event) => {
  event.preventDefault()

  try {
    await axios.put(
      `/api/attendance/${editingAttendance.id}/`,
      {
        employee: editingAttendance.employee,
        date: attendanceEditForm.date,
        status: attendanceEditForm.status
      }
    )

    const response = await axios.get(
      '/api/attendance/'
    )

    setAttendance(response.data)
    setShowAttendanceForm(false)
    setEditingAttendance(null)

    setAttendanceForm({
      employee: '',
      date: new Date().toLocaleDateString('en-CA'),
      status: 'Present'
    })

    alert('Attendance updated successfully!')
  } catch (error) {
    console.error('Error updating attendance:', error)
    alert(
      'Could not update attendance. Please check the date and employee records.'
    )
  }
}

const handleDeleteAttendance = async (record) => {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this attendance record?'
  )

  if (!confirmDelete) {
    return
  }

  try {
    await axios.delete(
      `/api/attendance/${record.id}/`
    )

    setAttendance((previousAttendance) =>
      previousAttendance.filter((item) => item.id !== record.id)
    )

    alert('Attendance record deleted successfully!')
  } catch (error) {
    console.error('Error deleting attendance:', error)
    alert('Could not delete attendance record. Please try again.')
  }
}

const handleExportCSV = () => {
  const sortedAttendance = [...monthlyAttendance].sort(
    (a, b) => a.date.localeCompare(b.date)
  )

  const headers = [
    'Employee ID',
    'Employee Name',
    'Date',
    'Status'
  ]

  const rows = sortedAttendance.map((record) => {
    const employee = employees.find(
      (item) => String(item.id) === String(record.employee)
    )

    return [
      employee ? employee.employee_id : 'Unknown',
      employee ? employee.name : 'Unknown',
      record.date,
      record.status
    ]
  })

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((value) =>
        `"${String(value ?? '').replace(/"/g, '""')}"`
      ).join(',')
    )
    .join('\n')

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `attendance_report_${reportMonth || 'all'}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

  useEffect(() => {
  if (!loggedInUser || loggedInUser.role !== 'Admin') return

  axios.get('/api/employees/')
    .then(response => {
      setEmployees(response.data)
    })
    .catch(error => {
      console.error('Error fetching employees:', error)
    })
}, [loggedInUser])

  useEffect(() => {
  if (!loggedInUser) return

  axios.get('/api/attendance/')
    .then(response => {
      setAttendance(response.data)
    })
    .catch(error => {
      console.error('Error fetching attendance:', error)
    })
}, [loggedInUser])
  
useEffect(() => {
  if (!loggedInUser) return

  axios.get('/api/leaves/')
    .then(response => {
      setLeaves(response.data)
    })
    .catch(error => {
      console.error('Error fetching leaves:', error)
    })
}, [loggedInUser])

  const today = new Date().toLocaleDateString('en-CA')

const todayAttendance = attendance.filter(
  record => record.date === today
)

const presentToday = todayAttendance.filter(
  record => record.status === 'Present'
).length

const absentToday = todayAttendance.filter(
  record => record.status === 'Absent'
).length

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
    String(employee.email || '').toLowerCase().includes(search)
  )
})
const sortedEmployees = [...filteredEmployees].sort((a, b) =>
  a.name.localeCompare(b.name)
)

if (!loggedInUser) {
  return <Login onLogin={setLoggedInUser} />
}
if (loggedInUser.role === 'Employee') {
  return (
    <EmployeeDashboard
      user={loggedInUser}
      onLogout={() => setLoggedInUser(null)}
    />
  )
}

return (
  <div className="app-layout">
    <aside className="sidebar">
      <h2 className="sidebar-title">Employee System</h2>

      <nav className="sidebar-nav">
        <button
  className={activeSection === 'dashboard' ? 'active' : ''}
  onClick={() => {
    setActiveSection('dashboard')
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }}
>
  Dashboard
</button>
        <button
        className={activeSection === 'employees' ? 'active' : ''}
  onClick={() => {
    setActiveSection('employees')
    document.getElementById('employees')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }}
>
  Employees
</button>
        <button
        className={activeSection === 'attendance' ? 'active' : ''}
  onClick={() => {
    setActiveSection('attendance')
    document.getElementById('attendance')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }}
>
  Attendance
</button>
        <button
        className={activeSection === 'leaves' ? 'active' : ''}
  onClick={() => {
    setActiveSection('leaves')
    document.getElementById('leaves')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }}
>
  Leave Management
</button>
        <button
        className={activeSection === 'reports' ? 'active' : ''}
  onClick={() => {
    setActiveSection('reports')
    document.getElementById('reports')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }}
>
  Monthly Reports
</button>
              <button
          onClick={() => {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            delete axios.defaults.headers.common['Authorization']
            setLoggedInUser(null)
          }}
          className="logout-button"
        >
          Logout
        </button>
      </nav>
    </aside>
    <div className="main-area">
      <header className="header">
        <h1>Employee Attendance System</h1>
        <p>Manage your employees and daily attendance</p>
      </header>

      <main className="dashboard">
        <h2>Dashboard</h2>
        
<div className="section">
  <button
    type="button"
    onClick={() => {
  setShowForm(!showForm)
  setEditingEmployee(null)
  setFormData({
    employee_id: '',
    name: '',
    email: '',
    department: '',
    joining_date: ''
  })
}}
    className="add-button"
  >
    {showForm ? 'Cancel' : '+ Add Employee'}
  </button>

  {showForm && (
    <form
  onSubmit={
    editingEmployee
      ? handleUpdateEmployee
      : handleAddEmployee
  }
>
      <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>

      <label>Employee ID</label>
      <input
        type="text"
        name="employee_id"
        value={formData.employee_id}
        onChange={handleInputChange}
        placeholder="Example: EMP003"
        required
      />

      <label>Full Name</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Enter employee name"
        required
      />

      <label>Email</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        placeholder="Enter email address"
        required
      />

      <label>Department</label>
      <input
        type="text"
        name="department"
        value={formData.department}
        onChange={handleInputChange}
        placeholder="Example: IT"
        required
      />

      <label>Joining Date</label>
      <input
        type="date"
        name="joining_date"
        value={formData.joining_date}
        onChange={handleInputChange}
        required
      />

      <button type="submit" className="add-button">
  {editingEmployee ? 'Update Employee' : 'Save Employee'}
</button>
    </form>
  )}
</div>


        <div className="cards">
          <div className="card">
  <h3>Total Employees</h3>
  <p className="number">{employees.length}</p>
</div>

          <div className="card">
            <h3>Present Today</h3>
<p className="number">{presentToday}</p>
          </div>

          <div className="card">
            <h3>Absent Today</h3>
<p className="number">{absentToday}</p>
          </div>
        </div>

<section className="section">
  
<div className="section" id="attendance">
  <h2>Daily Attendance</h2>
  <button
    type="button"
    className="add-button"
    onClick={() => setShowAttendanceForm(!showAttendanceForm)}
  >
    {showAttendanceForm ? 'Cancel' : '+ Mark Attendance'}
  </button>

  {showAttendanceForm && (
    
<form
  onSubmit={
    editingAttendance
      ? handleUpdateAttendance
      : handleMarkAttendance
  }
  className="employee-form"
>

      <h2>
  {editingAttendance ? 'Edit Attendance' : 'Mark Daily Attendance'}
</h2>

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
        date: event.target.value
      })
    } else {
      handleAttendanceChange(event)
    }
  }}
  required
/>


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
        status: event.target.value
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

      <button type="submit" className="add-button">
  {editingAttendance ? 'Update Attendance' : 'Save Attendance'}
</button>
    </form>
  )}
</div>

<section className="section" id="leaves">
  <h2>Leave Management</h2>

  <button
    type="button"
    className="add-button"
    onClick={() => setShowLeaveForm(!showLeaveForm)}
  >
    {showLeaveForm ? 'Cancel' : '+ Apply for Leave'}
  </button>

  {showLeaveForm && (
    <form
      onSubmit={handleSubmitLeave}
      className="employee-form"
    >
      <h3>Apply for Leave</h3>

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

      <label>Start Date</label>
      <input
        type="date"
        name="start_date"
        value={leaveForm.start_date}
        onChange={handleLeaveChange}
        required
      />

      <label>End Date</label>
      <input
        type="date"
        name="end_date"
        value={leaveForm.end_date}
        onChange={handleLeaveChange}
        min={leaveForm.start_date || undefined}
        required
      />

      <label>Reason for Leave</label>
      <textarea
        name="reason"
        value={leaveForm.reason}
        onChange={handleLeaveChange}
        placeholder="Enter the reason for leave"
        required
      />

      <button type="submit" className="add-button">
        Submit Leave Request
      </button>
    </form>
  )}

  <h3>Leave Records</h3>

  <table>
    <thead>
      <tr>
        <th>Employee</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Reason</th>
        <th>Status</th>
      </tr>
    </thead>

    <tbody>
      {leaves.map((leave) => {
        const employee = employees.find(
          (item) => String(item.id) === String(leave.employee)
        )

        return (
          <tr key={leave.id}>
            <td>
              {employee
                ? `${employee.employee_id} - ${employee.name}`
                : 'Unknown'}
            </td>
            <td>{leave.start_date}</td>
            <td>{leave.end_date}</td>
            <td>{leave.reason}</td>
            
<td>
  {leave.status === 'Pending' ? (
    <>
      <button
        type="button"
        className="add-button"
        onClick={() => handleLeaveStatus(leave.id, 'Approved')}
      >
        Approve
      </button>

      <button
        type="button"
        className="add-button"
        onClick={() => handleLeaveStatus(leave.id, 'Rejected')}
      >
        Reject
      </button>
    </>
 
) : (
  <span
    className={`leave-status ${leave.status.toLowerCase()}`}
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
</section>

  <h2 id="employees">Employee List</h2>
  <p>Employees found: {filteredEmployees.length}</p>

  
<div className="search-container">
  <input
    type="text"
    placeholder="Search by name, employee ID, or email..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />

  <button
    type="button"
    onClick={() => setSearchTerm('')}
  >
    Clear Search
  </button>
</div>

<table>
  <thead>
    <tr>
      <th>Employee ID</th>
      <th>Name</th>
      <th>Email</th>
      <th>Department</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
     {sortedEmployees.map(employee => (
      <tr key={employee.id}>
        <td>{employee.employee_id}</td>
        <td>{employee.name}</td>
        <td>{employee.email}</td>
        <td>{employee.department}</td>
        <td>
          <button
  type="button"
  onClick={() => handleEditClick(employee)}
>
  Edit
</button>
          <button
  type="button"
  onClick={() => handleDeleteEmployee(employee)}
>
  Delete
</button>
        </td>
      </tr>
    ))}
    {filteredEmployees.length === 0 && (
  <tr>
    <td colSpan="5">
      No employees found matching your search.
    </td>
  </tr>
)}
  </tbody>
</table>

</section>
        <section className="section">
 
<section className="section" id="reports">
  <h2>Monthly Attendance Report</h2>

  <label>Select Employee</label>
  <select
    value={reportEmployee}
    onChange={(event) => setReportEmployee(event.target.value)}
  >
    <option value="all">All Employees</option>

    {employees.map((employee) => (
      <option key={employee.id} value={String(employee.id)}>
        {employee.name}
      </option>
    ))}
  </select>

  <label>Select Month</label>
  <input
    type="month"
    value={reportMonth}
    onChange={(event) => setReportMonth(event.target.value)}
  />

  <div className="cards">
    <div className="card">
      <h3>Present</h3>
      <p className="number">{presentInMonth}</p>
    </div>

    <div className="card">
      <h3>Absent</h3>
      <p className="number">{absentInMonth}</p>
    </div>

    <div className="card">
      <h3>Late</h3>
      <p className="number">{lateInMonth}</p>
    </div>
  </div>

  <h3>Attendance Details</h3>

  <table>
    <thead>
      <tr>
        <th>Employee</th>
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
            <td>{employee ? employee.name : 'Unknown'}</td>
            <td>{record.date}</td>
            <td>{record.status}</td>
          </tr>
        )
      })}

      {monthlyAttendance.length === 0 && (
        <tr>
          <td colSpan="3">No records found for this selection.</td>
        </tr>
      )}
    </tbody>
  </table>
</section>
        
<section className="section">
  <h2>Attendance Records</h2>
  
<button
  type="button"
  className="add-button"
  onClick={handleExportCSV}
>
  Export Attendance CSV
</button>


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
            <td>{employee ? employee.employee_id : 'Unknown'}</td>
            <td>{employee ? employee.name : 'Unknown'}</td>
            <td>{record.date}</td>
            <td>{record.status}</td>
            
<td>
  <button
    type="button"
    onClick={() => handleEditAttendanceClick(record)}
  >
    Edit
  </button>

  <button
    type="button"
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
</section>

          
        </section>
      </main>
    </div>
    </div>
  )
}

export default App
