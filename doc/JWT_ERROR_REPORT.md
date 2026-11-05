# JWT Authentication Error Report & Solutions

This report details all the errors related to JWT token authentication and user authorization in the **Employee Attendance System**, along with step-by-step solutions to fix them.

---

## Error 1: Missing JWT `Authorization` Header in Admin Requests (`frontend/src/App.jsx`)

### Problem
When a user logs in via `frontend/src/Login.jsx` (lines 22–23), the JWT tokens are stored in `localStorage`:
```javascript
localStorage.setItem('accessToken', response.data.access)
localStorage.setItem('refreshToken', response.data.refresh)
```
In `frontend/src/EmployeeDashboard.jsx` (lines 15–19), the token is properly read and sent in the `Authorization: Bearer ${token}` header.

However, in `frontend/src/App.jsx` (the Admin dashboard), **none** of the `axios` requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) include the `Authorization` header. Because the backend views in `employees/views.py` require `@permission_classes([IsAuthenticated])`, Django REST Framework rejects these requests with **`401 Unauthorized`**.

### Solution
Create a helper function in `frontend/src/App.jsx` to attach the JWT token to every protected `axios` request:

```javascript
const getAuthConfig = () => {
  const token = localStorage.getItem('accessToken')
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}
```

Then pass `getAuthConfig()` to your `axios` calls in `frontend/src/App.jsx`:

* **GET requests:**
  ```javascript
  axios.get('http://127.0.0.1:8000/api/employees/', getAuthConfig())
  axios.get('http://127.0.0.1:8000/api/attendance/', getAuthConfig())
  axios.get('http://127.0.0.1:8000/api/leaves/', getAuthConfig())
  ```
* **POST requests:**
  ```javascript
  axios.post('http://127.0.0.1:8000/api/employees/', formData, getAuthConfig())
  axios.post('http://127.0.0.1:8000/api/attendance/', payload, getAuthConfig())
  axios.post('http://127.0.0.1:8000/api/leaves/', payload, getAuthConfig())
  ```
* **PUT / PATCH / DELETE requests:**
  ```javascript
  axios.put(`http://127.0.0.1:8000/api/employees/${editingEmployee.id}/`, formData, getAuthConfig())
  axios.patch(`http://127.0.0.1:8000/api/leaves/${leaveId}/status/`, { status: newStatus }, getAuthConfig())
  axios.delete(`http://127.0.0.1:8000/api/employees/${employee.id}/`, getAuthConfig())
  ```

---

## Error 2: `useEffect` Fetches Data Before Login (`frontend/src/App.jsx`)

### Problem
In `frontend/src/App.jsx` (lines 408–436), the three `useEffect` hooks that fetch `employees`, `attendance`, and `leaves` have an empty dependency array (`[]`) and do not check if a user is logged in:
```javascript
useEffect(() => {
  axios.get('http://127.0.0.1:8000/api/employees/')
  // ...
}, [])
```
1. These requests run **immediately when the app loads on the Login page** (before the user logs in and before any JWT token exists), resulting in `401 Unauthorized` errors.
2. When the Admin logs in and `loggedInUser` state changes, these `useEffect` hooks **do not re-run** because `loggedInUser` is not in the dependency array.

### Solution
Replace the three `useEffect` blocks in `frontend/src/App.jsx` (lines 408–436) with a single `useEffect` that depends on `[loggedInUser]` and only runs when an Admin is logged in:

```javascript
useEffect(() => {
  if (!loggedInUser || loggedInUser.role !== 'Admin') {
    return
  }

  const config = getAuthConfig()

  axios.get('http://127.0.0.1:8000/api/employees/', config)
    .then(response => setEmployees(response.data))
    .catch(error => console.error('Error fetching employees:', error))

  axios.get('http://127.0.0.1:8000/api/attendance/', config)
    .then(response => setAttendance(response.data))
    .catch(error => console.error('Error fetching attendance:', error))

  axios.get('http://127.0.0.1:8000/api/leaves/', config)
    .then(response => setLeaves(response.data))
    .catch(error => console.error('Error fetching leaves:', error))
}, [loggedInUser])
```

---

## Error 3: Backend Crash When Superuser Has No `UserProfile` (`employees/views.py`)

### Problem
In `login_user` (`employees/views.py`, lines 351–352), a superuser without a `UserProfile` is safely handled and allowed to log in as `'Admin'`:
```python
profile = getattr(user, 'userprofile', None)
role = profile.role if profile else 'Admin' if user.is_superuser else None
```
However, in `employee_list` (line 23), `attendance_list` (line 56), `leave_list` (line 118), and `update_leave_status` (line 171), the code directly accesses:
```python
profile = request.user.userprofile
```
If the logged-in user was created via `python manage.py createsuperuser` and does not have a `UserProfile` row in the database, Django raises a **`500 Internal Server Error` (`RelatedObjectDoesNotExist: User has no userprofile`)** even when a valid JWT token is sent.

### Solution
In `employees/views.py`, safely retrieve the profile and role using `getattr`, just like in `login_user`:

```python
profile = getattr(request.user, 'userprofile', None)
role = profile.role if profile else ('Admin' if request.user.is_superuser else None)
```
Then check `if role != 'Admin':` instead of `if profile.role != 'Admin':`.

---

## Error 4: Role Assignment Bug During Registration (`employees/serializers.py`)

### Problem
In `RegisterSerializer.create` (`employees/serializers.py`, lines 53–55), when a user registers with `role == 'Admin'`, the code mistakenly sets their role to `'Employee'` instead of `'Admin'`:
```python
if role == 'Admin':
    user.userprofile.role = 'Employee'  # <-- Bug: should be 'Admin'
    user.userprofile.save()
```

### Solution
Update line 54 in `employees/serializers.py` to set `'Admin'`:
```python
if role == 'Admin':
    user.userprofile.role = 'Admin'
    user.userprofile.save()
```

---

## Error 5: Missing `@permission_classes([IsAuthenticated])` on Detail & Report Views (`employees/views.py`)

### Problem
In `employees/views.py`, the views `employee_detail` (line 201), `attendance_detail` (line 234), and `monthly_report` (line 266) do not have `@permission_classes([IsAuthenticated])`, meaning anyone can edit or delete employees and attendance records without a valid JWT token. Also, `attendance_list` has duplicate unreachable code at lines 91–109.

### Solution
Add `@permission_classes([IsAuthenticated])` above `employee_detail`, `attendance_detail`, and `monthly_report` in `employees/views.py`, and remove the duplicate lines 91–109 in `attendance_list`.
