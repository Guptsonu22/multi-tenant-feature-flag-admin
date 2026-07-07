import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const initialFlags = [
  {
    _id: 'demo-flag-1',
    name: 'New Dashboard',
    key: 'new_dashboard',
    description: 'Enable the refreshed dashboard experience',
    enabled: true,
  },
  {
    _id: 'demo-flag-2',
    name: 'Beta Billing',
    key: 'beta_billing',
    description: 'Show billing beta to selected tenant users',
    enabled: false,
  },
]

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/tenants', label: 'Tenants' },
  { path: '/flags', label: 'Feature Flags' },
]

function App() {
  const [path, setPath] = useState(window.location.hash.replace('#', '') || '/dashboard')
  const [token, setToken] = useState(localStorage.getItem('accessToken') || '')
  const [user, setUser] = useState(getStoredUser())

  useEffect(() => {
    const onHashChange = () => {
      setPath(window.location.hash.replace('#', '') || '/dashboard')
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const api = useMemo(
    () => ({
      async request(endpoint, options = {}) {
        const response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        })

        const text = await response.text()
        const data = text ? JSON.parse(text) : {}

        if (!response.ok) {
          throw new Error(data.message || 'Request failed')
        }

        return data
      },
    }),
    [token],
  )

  const navigate = (nextPath) => {
    window.location.hash = nextPath
    setPath(nextPath)
  }

  const handleAuth = (authData) => {
    localStorage.setItem('accessToken', authData.accessToken || authData.token)
    localStorage.setItem('refreshToken', authData.refreshToken || '')
    localStorage.setItem('user', JSON.stringify(authData.user))
    setToken(authData.accessToken || authData.token)
    setUser(authData.user)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setToken('')
    setUser(null)
    navigate('/login')
  }

  if (path === '/login') {
    return <LoginPage api={api} onAuth={handleAuth} navigate={navigate} />
  }

  if (path === '/register') {
    return <RegisterPage api={api} onAuth={handleAuth} navigate={navigate} />
  }

  return (
    <ProtectedRoute token={token} navigate={navigate}>
      <AppShell path={path} user={user} navigate={navigate} onLogout={handleLogout}>
        {path === '/tenants' && <TenantsPage api={api} />}
        {path === '/flags' && <FeatureFlagsPage api={api} />}
        {path !== '/tenants' && path !== '/flags' && <DashboardPage api={api} user={user} />}
      </AppShell>
    </ProtectedRoute>
  )
}

function ProtectedRoute({ token, navigate, children }) {
  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [navigate, token])

  if (!token) {
    return null
  }

  return children
}

function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <div>
        <p className="eyebrow">Feature Flag Admin</p>
        <h1>Control Center</h1>
      </div>
      <div className="nav-user">
        <div>
          <strong>{user?.name || 'User'}</strong>
          <span>{user?.role || 'member'}</span>
        </div>
        <button className="ghost-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}

function Sidebar({ path, navigate }) {
  return (
    <aside className="sidebar">
      <div className="brand-mark">FF</div>
      <nav>
        {navItems.map((item) => (
          <button
            className={path === item.path ? 'active' : ''}
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function AppShell({ children, navigate, onLogout, path, user }) {
  return (
    <div className="app-shell">
      <Sidebar path={path} navigate={navigate} />
      <main className="main-panel">
        <Navbar user={user} onLogout={onLogout} />
        {children}
      </main>
    </div>
  )
}

function LoginPage({ api, navigate, onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Login" subtitle="Access your tenant workspace">
      <form className="auth-form" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <button className="link-button" type="button" onClick={() => navigate('/register')}>
        Create an account
      </button>
    </AuthLayout>
  )
}

function RegisterPage({ api, navigate, onAuth }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Register" subtitle="Create the first owner account">
      <form className="auth-form" onSubmit={submit}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <label>
          Tenant name
          <input
            value={form.tenantName}
            onChange={(event) => setForm({ ...form, tenantName: event.target.value })}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Register'}
        </button>
      </form>
      <button className="link-button" type="button" onClick={() => navigate('/login')}>
        Back to login
      </button>
    </AuthLayout>
  )
}

function AuthLayout({ children, subtitle, title }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Multi-Tenant RBAC</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

function DashboardPage({ api, user }) {
  const [stats, setStats] = useState({ tenants: 0, flags: initialFlags.length, enabled: 1 })

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const [tenantData, flagData] = await Promise.all([
          api.request('/tenants'),
          api.request('/flags'),
        ])

        if (!ignore) {
          const flags = flagData.flags || []
          setStats({
            tenants: tenantData.tenants?.length || 0,
            flags: flags.length,
            enabled: flags.filter((flag) => flag.enabled).length,
          })
        }
      } catch {
        if (!ignore) {
          setStats({ tenants: 1, flags: initialFlags.length, enabled: 1 })
        }
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [api])

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Welcome back, {user?.name || 'Owner'}</h2>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Tenants" value={stats.tenants} />
        <StatCard label="Feature Flags" value={stats.flags} />
        <StatCard label="Enabled Flags" value={stats.enabled} />
      </div>
      <div className="activity-panel">
        <h3>Milestone status</h3>
        <div className="timeline-row">
          <span>Auth + JWT</span>
          <strong>Complete</strong>
        </div>
        <div className="timeline-row">
          <span>Tenant CRUD</span>
          <strong>Complete</strong>
        </div>
        <div className="timeline-row">
          <span>Feature Flag CRUD</span>
          <strong>Complete</strong>
        </div>
        <div className="timeline-row">
          <span>Role Authorization</span>
          <strong>Complete</strong>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function TenantsPage({ api }) {
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [message, setMessage] = useState('')

  const loadTenants = useCallback(async () => {
    try {
      const data = await api.request('/tenants')
      setTenants(data.tenants || [])
    } catch (err) {
      setMessage(err.message)
    }
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadTenants()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadTenants])

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.request('/tenants', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ name: '', description: '' })
      loadTenants()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tenants</p>
          <h2>Organizations</h2>
        </div>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input
          placeholder="Tenant name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <button className="primary-button" type="submit">
          Add Tenant
        </button>
      </form>
      {message && <p className="error-text">{message}</p>}
      <DataTable
        columns={['Name', 'Description', 'Created']}
        rows={tenants.map((tenant) => [
          tenant.name,
          tenant.description || '-',
          formatDate(tenant.createdAt),
        ])}
      />
    </section>
  )
}

function FeatureFlagsPage({ api }) {
  const [flags, setFlags] = useState(initialFlags)
  const [form, setForm] = useState({ name: '', key: '', description: '', enabled: false })
  const [message, setMessage] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [evaluateForm, setEvaluateForm] = useState({ key: '', userId: '' })
  const [evaluation, setEvaluation] = useState(null)

  const loadFlags = useCallback(async () => {
    try {
      const data = await api.request('/flags')
      setFlags(data.flags || [])
      setAuditLogs(data.auditLogs || [])
    } catch (err) {
      setMessage(err.message)
    }
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadFlags()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadFlags])

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.request('/flags', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ name: '', key: '', description: '', enabled: false })
      loadFlags()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const evaluate = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const data = await api.request('/flags/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          key: evaluateForm.key,
          userId: evaluateForm.userId,
        }),
      })
      setEvaluation(data)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const toggle = async (flag) => {
    if (flag._id.startsWith('demo')) {
      setFlags((current) =>
        current.map((item) =>
          item._id === flag._id ? { ...item, enabled: !item.enabled } : item,
        ),
      )
      return
    }

    try {
      await api.request(`/flags/${flag._id}/toggle`, { method: 'PATCH' })
      loadFlags()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Feature Flags</p>
          <h2>Tenant-scoped controls</h2>
        </div>
      </div>
      <form className="inline-form flag-form" onSubmit={submit}>
        <input
          placeholder="Flag name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          placeholder="flag_key"
          value={form.key}
          onChange={(event) => setForm({ ...form, key: event.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          Enabled
        </label>
        <button className="primary-button" type="submit">
          Add Flag
        </button>
      </form>
      {message && <p className="error-text">{message}</p>}
      <form className="inline-form" onSubmit={evaluate}>
        <input
          placeholder="Flag key"
          value={evaluateForm.key}
          onChange={(event) => setEvaluateForm({ ...evaluateForm, key: event.target.value })}
          required
        />
        <input
          placeholder="User ID"
          value={evaluateForm.userId}
          onChange={(event) => setEvaluateForm({ ...evaluateForm, userId: event.target.value })}
          required
        />
        <button className="ghost-button" type="submit">
          Evaluate
        </button>
      </form>
      {evaluation && (
        <p className="success-text">
          {evaluation.flagKey} is {evaluation.enabled ? 'enabled' : 'disabled'} for user {evaluation.userId || evaluateForm.userId}
        </p>
      )}
      <div className="flag-list">
        {flags.map((flag) => (
          <article className="flag-row" key={flag._id}>
            <div>
              <strong>{flag.name}</strong>
              <span>{flag.key}</span>
              <p>{flag.description || 'No description'}</p>
            </div>
            <button
              className={flag.enabled ? 'toggle enabled' : 'toggle'}
              type="button"
              onClick={() => toggle(flag)}
            >
              {flag.enabled ? 'On' : 'Off'}
            </button>
          </article>
        ))}
      </div>
      <div className="activity-panel">
        <h3>Recent audit history</h3>
        {auditLogs.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          auditLogs.map((entry) => (
            <div className="timeline-row" key={entry._id}>
              <span>{entry.action} · {entry.after?.name || entry.before?.name || 'flag'}</span>
              <strong>{new Date(entry.createdAt).toLocaleString()}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No records found</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString()
}

export default App
