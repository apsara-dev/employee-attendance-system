
import { useEffect, useState } from 'react'
import axios from './axiosConfig'

function EmployeeDashboard({ user, onLogout }) {
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }

        const attendanceResponse = await axios.get(
          'http://127.0.0.1:8000/api/attendance/',
          config
        )

        const leaveResponse = await axios.get(
          'http://127.0.0.1:8000/api/leaves/',
          config
        )

        setAttendance(attendanceResponse.data)
        setLeaves(leaveResponse.data)
      } catch (error) {
        console.error('Error fetching employee data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    onLogout()
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1>Employee Dashboard</h1>

      <p>Welcome, {user.username}!</p>

      <button onClick={handleLogout}>Logout</button>

      <hr />

      <h2>My Attendance</h2>

      {loading ? (
        <p>Loading...</p>
      ) : attendance.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table border="1" cellPadding="10">
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
                <td>{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr />

      <h2>My Leave Applications</h2>

      {loading ? (
        <p>Loading...</p>
      ) : leaves.length === 0 ? (
        <p>No leave applications found.</p>
      ) : (
        <table border="1" cellPadding="10">
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
                <td>{leave.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default EmployeeDashboard
