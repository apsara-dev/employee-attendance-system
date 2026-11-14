                                                                                                                                                # Complete Error Report & Solutions Documentation

**Project:** Employee Attendance System  
**Backend (Render):** `https://employee-attendance-system-i91v.onrender.com`  
**Frontend (Vercel):** `https://employee-attendance-system-drab.vercel.app`

---

## 1. Missing JWT `Authorization` Header in Frontend Requests

### Error Description
When logging in via `frontend/src/Login.jsx`, the JWT `accessToken` and `refreshToken` were saved to `localStorage`, and `frontend/src/EmployeeDashboard.jsx` manually attached `Authorization: Bearer <token>`. However, the Admin Dashboard (`frontend/src/App.jsx`) sent API requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) without the `Authorization` header, causing the Django backend to return **`401 Unauthorized`**.

### Solution Implemented
Configured a centralized Axios instance in `frontend/src/axiosConfig.js` with:
1. A **request interceptor** that automatically attaches `Authorization: Bearer ${token}` from `localStorage` to every outgoing API request.
2. A **response interceptor** that automatically catches `401 Unauthorized` responses when an access token expires, requests a new access token from `/api/token/refresh/`, and retries the failed request seamlessly.

```javascript
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)
```

---

## 2. Premature API Calls Before User Login (`useEffect` in `App.jsx`)

### Error Description
1. In `frontend/src/App.jsx`, the `useEffect` hooks fetching `/api/employees/`, `/api/attendance/`, and `/api/leaves/` initially had an empty dependency array (`[]`), causing them to fire on initial page load before the user logged in (`401 Unauthorized`), and preventing them from re-running after login.
2. When an `Employee` user logged in, `App.jsx` still called `/api/employees/` (which is restricted to Admins), causing a **`403 Forbidden`** error.

### Solution Implemented
Updated the `useEffect` hooks in `frontend/src/App.jsx` to depend on `[loggedInUser]` and verify that the user is logged in (and has `loggedInUser.role === 'Admin'` before fetching the employee list):

```javascript
useEffect(() => {
  if (!loggedInUser || loggedInUser.role !== 'Admin') return

  axios.get('/api/employees/')
    .then(response => setEmployees(response.data))
    .catch(error => console.error('Error fetching employees:', error))
}, [loggedInUser])
```

---

## 3. Hardcoded Localhost API URL in Frontend (`axiosConfig.js`)

### Error Description
The frontend was pointing to `http://127.0.0.1:8000` when `VITE_API_URL` was not defined. When running against the deployed Render backend (`https://employee-attendance-system-i91v.onrender.com`), API calls failed to reach the production server.

### Solution Implemented
Updated `frontend/src/axiosConfig.js` and `frontend/.env` to use the Render backend URL and strip any trailing slashes:

```javascript
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://employee-attendance-system-i91v.onrender.com'
).replace(/\/+$/, '')

axios.defaults.baseURL = API_BASE_URL
```

---

## 4. Admin / Superuser Login `500 Internal Server Error` (`UserProfile.DoesNotExist`)

### Error Description
While `CustomTokenObtainPairSerializer` (`employees/serializers.py`) allowed a Django superuser (`admin`) without a `UserProfile` record to log in and receive a JWT token, all protected views in `employees/views.py` directly accessed `profile = request.user.userprofile`. Because the `admin` superuser in the Neon PostgreSQL database did not have a corresponding row in the `UserProfile` table, every API request after login crashed with **`500 Internal Server Error` (`RelatedObjectDoesNotExist: User has no userprofile`)**.

Additionally, `RegisterSerializer.create` (`employees/serializers.py`) contained a bug where registering with `role == 'Admin'` still assigned `role = 'Employee'`.

### Solution Implemented
1. Created a `get_user_profile(user)` helper in `employees/views.py` that safely retrieves the user's `UserProfile` and automatically creates one (`role='Admin'` for superusers, `role='Employee'` for standard users) if missing:
   ```python
   def get_user_profile(user):
       profile = getattr(user, 'userprofile', None)
       if profile is None and user.is_superuser:
           profile, _ = UserProfile.objects.get_or_create(
               user=user,
               defaults={'role': 'Admin'}
           )
       elif profile is None:
           profile, _ = UserProfile.objects.get_or_create(
               user=user,
               defaults={'role': 'Employee'}
           )
       return profile
   ```
2. Created the `UserProfile(role='Admin')` record for the `admin` user directly in the live Neon PostgreSQL database.
3. Fixed `RegisterSerializer.create` in `employees/serializers.py` to save `user.userprofile.role = 'Admin'` when `role == 'Admin'`.

---

## 5. CORS & `DATABASE_URL` Configuration Issues (`config/settings.py`)

### Error Description
1. **CORS Block:** The `.env` file only listed `https://employee-attendance-system-drab.vercel.app` in `CORS_ALLOWED_ORIGINS`, blocking local frontend testing from `http://localhost:5173`.
2. **`DATABASE_URL` Parsing & Connection Hang:** The `DATABASE_URL` string in `.env` contained surrounding quotes (`"..."`) and `&channel_binding=require`, which can cause connection hangs or parsing issues with Neon's connection pooler.

### Solution Implemented
Updated `config/settings.py`:
1. Ensured `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` always include the Render backend URL (`employee-attendance-system-i91v.onrender.com`), Vercel frontend URL (`https://employee-attendance-system-drab.vercel.app`), and local development URLs (`http://localhost:5173`, `http://127.0.0.1:5173`).
2. Sanitized `DATABASE_URL` in `config/settings.py` by stripping quotes and removing `&channel_binding=require`.

---

## 6. Missing `dj_database_url` Package in Local Python Environment

### Error Description
VS Code / Pylance reported `Cannot find module dj_database_url` at `config/settings.py:L16` because the deployment dependencies listed in `requirements.txt` were not installed in the local Windows Python 3.13 environment.

### Solution Implemented
Installed the required packages locally:
```bash
python -m pip install dj-database-url python-dotenv whitenoise "psycopg[binary]"
```
Verified with `python manage.py check`, which passed with 0 errors.

---

## 7. Render Root URL `GET / HTTP/1.1 404` in Logs

### Error Description
In the Render deployment logs, requests to the root URL (`GET / HTTP/1.1`) returned **`404 Not Found`** because `config/urls.py` only defined routes for `/admin/`, `/api/token/`, `/api/token/refresh/`, and `/api/`.

### Solution Implemented
Added a root health-check endpoint (`path('', api_root, name='api-root')`) in `config/urls.py` that returns `200 OK`:

```python
def api_root(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Employee Attendance System API is live',
    })
```
