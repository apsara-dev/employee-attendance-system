
import { useState } from 'react'
import axios from './axiosConfig'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

   try {
  const response = await axios.post(
    'http://127.0.0.1:8000/api/token/',
    { username, password }
  )

  localStorage.setItem('accessToken', response.data.access)
  localStorage.setItem('refreshToken', response.data.refresh)

  axios.defaults.headers.common['Authorization'] =
    `Bearer ${response.data.access}`

  onLogin({ ...response.data, username })

} catch (error) {
  setError(
    error.response?.data?.error ||
    'Login failed. Please check your username and password.'
  )
} finally {
  setLoading(false)
}
  }
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Employee Attendance System</h2>
        <h3>Login</h3>

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Enter username"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default Login
