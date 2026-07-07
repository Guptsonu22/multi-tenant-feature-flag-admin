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
  const [stats, setStats] = useState({ tenants: 0, flags: 0, enabled: 0, disabled: 0 })

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
          const enabled = flags.filter((flag) => flag.enabled).length
          setStats({
            tenants: tenantData.tenants?.length || 0,
            flags: flags.length,
            enabled,
            disabled: flags.length - enabled,
          })
        }
      } catch {
        if (!ignore) {
          setStats({ tenants: 0, flags: 0, enabled: 0, disabled: 0 })
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
        <StatCard label="Disabled Flags" value={stats.disabled} />
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTenantId, setEditingTenantId] = useState(null)

  const loadTenants = useCallback(async () => {
    try {
      const data = await api.request('/tenants')
      setTenants(data.tenants || [])
    } catch (err) {
      setMessage(`❌ ${err.message}`)
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

    if (!form.name.trim()) {
      setMessage('❌ Please fill all fields.')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingTenantId) {
        await api.request(`/tenants/${editingTenantId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await api.request('/tenants', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }

      setForm({ name: '', description: '' })
      setEditingTenantId(null)
      setMessage(`✅ Tenant ${editingTenantId ? 'updated' : 'added'} successfully`)
      await loadTenants()
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (tenant) => {
    setEditingTenantId(tenant._id)
    setForm({ name: tenant.name, description: tenant.description || '' })
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingTenantId(null)
    setForm({ name: '', description: '' })
    setMessage('')
  }

  const removeTenant = async (tenant) => {
    if (!window.confirm(`Delete tenant ${tenant.name}?`)) {
      return
    }

    try {
      await api.request(`/tenants/${tenant._id}`, { method: 'DELETE' })
      setMessage('✅ Tenant deleted successfully')
      await loadTenants()
    } catch (err) {
      setMessage(`❌ ${err.message}`)
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
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (editingTenantId ? 'Updating...' : 'Adding...') : (editingTenantId ? 'Update Tenant' : 'Add Tenant')}
          </button>
          {editingTenantId && (
            <button className="ghost-button" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {message && <FeedbackBanner type={message.startsWith('✅') ? 'success' : 'error'}>{message}</FeedbackBanner>}
      <DataTable
        columns={['Name', 'Description', 'Created', 'Actions']}
        rows={tenants.map((tenant) => [
          <strong key={`${tenant._id}-name`}>{tenant.name}</strong>,
          tenant.description || '-',
          formatDate(tenant.createdAt),
          <div className="action-buttons" key={`${tenant._id}-actions`}>
            <button className="ghost-button small" type="button" onClick={() => startEdit(tenant)}>
              Edit
            </button>
            <button className="ghost-button small danger" type="button" onClick={() => removeTenant(tenant)}>
              Delete
            </button>
          </div>,
        ])}
      />
    </section>
  )
}

function FeatureFlagsPage({ api }) {
  const [flags, setFlags] = useState(initialFlags)
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState({ name: '', key: '', description: '', enabled: false, tenantId: '' })
  const [message, setMessage] = useState('')
  const [auditLogs, setAuditLogs] = useState([])
  const [evaluateForm, setEvaluateForm] = useState({ key: '', userId: '', tenantId: '' })
  const [evaluation, setEvaluation] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [editingFlagId, setEditingFlagId] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [tenantData, flagData] = await Promise.all([
        api.request('/tenants'),
        api.request('/flags'),
      ])
      setTenants(tenantData.tenants || [])
      setFlags(flagData.flags || [])
      setAuditLogs(flagData.auditLogs || [])
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    }
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadData])

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!form.name.trim() || !form.key.trim() || !form.tenantId) {
      setMessage('❌ Please fill all fields.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...form,
        tenantId: form.tenantId || tenants[0]?._id || '',
      }

      if (editingFlagId) {
        await api.request(`/flags/${editingFlagId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api.request('/flags', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      setForm({ name: '', key: '', description: '', enabled: false, tenantId: '' })
      setEditingFlagId(null)
      setMessage(`✅ Flag ${editingFlagId ? 'updated' : 'created'} successfully`)
      await loadData()
    } catch (err) {
      const text = err.message || ''
      if (text.includes('already exists')) {
        setMessage('❌ Flag already exists.')
      } else {
        setMessage(`❌ ${text}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (flag) => {
    setEditingFlagId(flag._id)
    setForm({
      name: flag.name,
      key: flag.key,
      description: flag.description || '',
      enabled: flag.enabled,
      tenantId: flag.tenantId || '',
    })
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingFlagId(null)
    setForm({ name: '', key: '', description: '', enabled: false, tenantId: '' })
    setMessage('')
  }

  const removeFlag = async (flag) => {
    if (!window.confirm('Delete this feature?')) {
      return
    }

    try {
      await api.request(`/flags/${flag._id}`, { method: 'DELETE' })
      setMessage('✅ Flag deleted successfully')
      await loadData()
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    }
  }

  const evaluate = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!evaluateForm.key.trim() || !evaluateForm.userId.trim() || !evaluateForm.tenantId) {
      setMessage('❌ Please fill all fields.')
      return
    }

    setIsEvaluating(true)

    try {
      const data = await api.request('/flags/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          key: evaluateForm.key,
          userId: evaluateForm.userId,
          tenantId: evaluateForm.tenantId,
        }),
      })
      setEvaluation(data)
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setIsEvaluating(false)
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
      await loadData()
    } catch (err) {
      setMessage(`❌ ${err.message}`)
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
        <select
          value={form.tenantId}
          onChange={(event) => setForm({ ...form, tenantId: event.target.value })}
          required
        >
          <option value="">Select tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant._id} value={tenant._id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
          />
          Enabled
        </label>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (editingFlagId ? 'Updating...' : 'Adding...') : (editingFlagId ? 'Update Flag' : 'Add Flag')}
          </button>
          {editingFlagId && (
            <button className="ghost-button" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
      {message && <FeedbackBanner type={message.startsWith('✅') ? 'success' : 'error'}>{message}</FeedbackBanner>}
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
        <select
          value={evaluateForm.tenantId}
          onChange={(event) => setEvaluateForm({ ...evaluateForm, tenantId: event.target.value })}
          required
        >
          <option value="">Select tenant</option>
          {tenants.map((tenant) => (
            <option key={tenant._id} value={tenant._id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <button className="ghost-button" type="submit" disabled={isEvaluating}>
          {isEvaluating ? 'Checking...' : 'Evaluate'}
        </button>
      </form>
      {evaluation && (
        <p className="success-text">
          {evaluation.message || `${evaluation.flagKey} is ${evaluation.enabled ? 'enabled' : 'disabled'} for user ${evaluation.userId || evaluateForm.userId}`}
        </p>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Tenant</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => {
              const tenantName = tenants.find((tenant) => tenant._id === flag.tenantId)?.name || 'Current Tenant'

              return (
                <tr key={flag._id}>
                  <td>{flag.name}</td>
                  <td>{flag.key}</td>
                  <td>{tenantName}</td>
                  <td>
                    <button
                      className={flag.enabled ? 'toggle-pill enabled' : 'toggle-pill'}
                      type="button"
                      onClick={() => toggle(flag)}
                    >
                      {flag.enabled ? 'ON' : 'OFF'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="ghost-button small" type="button" onClick={() => startEdit(flag)}>
                        Edit
                      </button>
                      <button className="ghost-button small danger" type="button" onClick={() => removeFlag(flag)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
              <tr key={`row-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function FeedbackBanner({ children, type }) {
  return <div className={`feedback-banner ${type === 'success' ? 'success' : 'error'}`}>{children}</div>
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString()
}

export default App
