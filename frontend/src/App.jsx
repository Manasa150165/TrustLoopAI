import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

const defaultCode = `def divide(a, b):
    return a / b

print(divide(10, 0))
`;

function DashboardPage({ user, history, result, language, setLanguage, code, setCode, requirements, setRequirements, handleAnalysis, loading, error, setError, token, logout }) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Verification workspace</h1>
        </div>
        <div className="user-chip">
          <span>{user.email}</span>
          <button className="secondary-btn small" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Projects reviewed</span>
          <strong>{history.length}</strong>
        </div>
        <div className="stat-card">
          <span>LLM mode</span>
          <strong>{result?.metadata?.llm_provider || 'local'}</strong>
        </div>
        <div className="stat-card">
          <span>Confidence</span>
          <strong>{result ? `${(result.confidence * 100).toFixed(0)}%` : '—'}</strong>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="panel code-panel">
          <div className="panel-header">
            <h3>Code input</h3>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="c++">C++</option>
            </select>
          </div>

          <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={18} />

          <label className="label">Requirements</label>
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4} />

          <button className="primary-btn full" onClick={handleAnalysis} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze code'}
          </button>
        </div>

        <div className="panel result-panel">
          <div className="panel-header">
            <h3>Verification report</h3>
          </div>

          {error && <div className="error-box">{error}</div>}

          {!result ? (
            <div className="empty-state">No analysis has been run yet.</div>
          ) : (
            <>
              <div className="result-banner">
                <span className={`status-pill ${result.status}`}>{result.status}</span>
                <strong>{result.summary}</strong>
              </div>

              <div className="result-section">
                <h4>Findings</h4>
                {result.findings.map((item, index) => (
                  <div key={index} className="finding-item">
                    <div className="finding-head">
                      <span>{item.category}</span>
                      <span className={`severity ${item.severity}`}>{item.severity}</span>
                    </div>
                    <h5>{item.title}</h5>
                    <p>{item.description}</p>
                    <small>{item.evidence}</small>
                  </div>
                ))}
              </div>

              <div className="result-section">
                <h4>Suggested fixes</h4>
                {result.corrections.map((item, index) => (
                  <div key={index} className="fix-item">
                    <p>{item.summary}</p>
                    <pre>{item.code}</pre>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="panel history-panel">
        <div className="panel-header">
          <h3>Recent history</h3>
        </div>

        {history.length === 0 ? (
          <div className="empty-state muted">No saved analyses yet.</div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div>
                  <strong>{item.language}</strong>
                  <p>{item.summary}</p>
                </div>
                <span>{item.created_at}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ProjectsPage() {
  return (
    <div className="page-card">
      <h1>Projects</h1>
      <p>Manage active verification workspaces and saved code reviews.</p>
      <div className="page-list">
        <div className="list-item">
          <strong>TrustLoop API service</strong>
          <span>2 unresolved issues</span>
        </div>
        <div className="list-item">
          <strong>AI review pipeline</strong>
          <span>5 checks passed</span>
        </div>
        <div className="list-item">
          <strong>Security audit module</strong>
          <span>1 critical finding</span>
        </div>
      </div>
    </div>
  );
}

function ReportsPage({ history = [] }) {
  const recent = [...history].slice(0, 6).reverse();
  const languageCounts = history.reduce((acc, item) => {
    acc[item.language] = (acc[item.language] || 0) + 1;
    return acc;
  }, {});

  const topLanguage = Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0];

  const getRisk = (summary = '') => {
    const text = summary.toLowerCase();
    if (text.includes('critical') || text.includes('security') || text.includes('vulnerab')) return { label: 'Action', tone: 'danger' };
    if (text.includes('warning') || text.includes('performance') || text.includes('risk')) return { label: 'Review', tone: 'warning' };
    return { label: 'Healthy', tone: 'success' };
  };

  const chartValues = recent.length
    ? recent.map((item, index) => {
        const base = 30 + ((index + 1) * 12);
        const summaryBoost = item.summary.toLowerCase().includes('critical') ? 18 : item.summary.toLowerCase().includes('warning') ? 10 : 0;
        return Math.min(100, base + summaryBoost);
      })
    : [0, 0, 0, 0, 0, 0];

  return (
    <div className="page-card">
      <h1>Reports</h1>
      <p>Track review trends, flagged issues, and remediation history.</p>

      <div className="report-grid">
        <div className="mini-card"><span>Total reviews</span><strong>{history.length}</strong></div>
        <div className="mini-card"><span>Top language</span><strong>{topLanguage ? topLanguage[0] : '—'}</strong></div>
        <div className="mini-card"><span>Recently flagged</span><strong>{history.filter((item) => getRisk(item.summary).tone !== 'success').length}</strong></div>
      </div>

      <div className="chart-card">
        <h3>Review activity</h3>
        <div className="chart-bars">
          {chartValues.map((value, index) => (
            <div key={index} className="chart-col">
              <span style={{ height: `${value}%` }} />
              <label>{recent[index]?.language || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</label>
            </div>
          ))}
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Language</th>
            <th>Status</th>
            <th>Summary</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {recent.length === 0 ? (
            <tr>
              <td colSpan="4">No analysis history yet.</td>
            </tr>
          ) : (
            recent.map((item, index) => {
              const risk = getRisk(item.summary);
              return (
                <tr key={`${item.id || index}-${item.created_at}`}>
                  <td>{item.language}</td>
                  <td><span className={`tag ${risk.tone}`}>{risk.label}</span></td>
                  <td>{item.summary || 'Review completed'}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function SettingsPage({ user }) {
  const defaultSettings = {
    provider: true,
    strictMode: true,
    autoSave: false,
    notifications: true,
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('trustloop_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('trustloop_settings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="page-card">
      <h1>Settings</h1>
      <p>Update environment, AI provider, and workspace preferences.</p>

      <div className="settings-list">
        <div className="setting-row">
          <span>Account</span>
          <strong>{user?.email || 'Not available'}</strong>
        </div>
        <div className="setting-row">
          <span>AI provider</span>
          <button className={`toggle ${settings.provider ? 'on' : ''}`} onClick={() => toggleSetting('provider')}>
            <span />
          </button>
        </div>
        <div className="setting-row">
          <span>Strict review mode</span>
          <button className={`toggle ${settings.strictMode ? 'on' : ''}`} onClick={() => toggleSetting('strictMode')}>
            <span />
          </button>
        </div>
        <div className="setting-row">
          <span>Auto save results</span>
          <button className={`toggle ${settings.autoSave ? 'on' : ''}`} onClick={() => toggleSetting('autoSave')}>
            <span />
          </button>
        </div>
        <div className="setting-row">
          <span>Email notifications</span>
          <button className={`toggle ${settings.notifications ? 'on' : ''}`} onClick={() => toggleSetting('notifications')}>
            <span />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, history = [] }) {
  const latestReview = history[0];
  const latestLanguage = latestReview?.language || 'Python';
  const latestDate = latestReview ? new Date(latestReview.created_at).toLocaleString() : 'No saved reviews yet';

  return (
    <div className="page-card profile-card">
      <h1>Profile</h1>

      <div className="profile-header">
        <div className="avatar">{(user?.username || user?.email || 'U').slice(0, 1).toUpperCase()}</div>
        <div>
          <h3>{user?.username || 'User'}</h3>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="mini-card">
          <span>Review count</span>
          <strong>{history.length}</strong>
        </div>
        <div className="mini-card">
          <span>Latest language</span>
          <strong>{latestLanguage}</strong>
        </div>
        <div className="mini-card">
          <span>Last activity</span>
          <strong>{latestDate}</strong>
        </div>
      </div>

      <div className="profile-details">
        <div className="setting-row"><span>Username</span><strong>{user?.username || 'N/A'}</strong></div>
        <div className="setting-row"><span>Email</span><strong>{user?.email || 'N/A'}</strong></div>
        <div className="setting-row"><span>Workspace</span><strong>{history.length > 0 ? 'Connected to backend history' : 'Ready for first review'}</strong></div>
      </div>
    </div>
  );
}

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    username: '',
    email: 'alice@example.com',
    password: 'secret123',
  });
  const [token, setToken] = useState(localStorage.getItem('trustloop_token') || '');
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(defaultCode);
  const [requirements, setRequirements] = useState(
    'The code should prevent divide-by-zero issues and handle invalid input safely.'
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchHistory() {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Unable to fetch history');
      const data = await response.json();
      setHistory(data.items || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCurrentUser() {
    const savedToken = localStorage.getItem('trustloop_token');
    if (!savedToken) return;
    setToken(savedToken);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload = authMode === 'signup'
      ? { username: authForm.username, email: authForm.email, password: authForm.password }
      : { email: authForm.email, password: authForm.password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Authentication failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('trustloop_token', data.token);
      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalysis() {
    if (!token) {
      setError('Please log in to run analysis.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language, code, requirements }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Analysis failed');
      setResult(data);
      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('trustloop_token');
    setToken('');
    setUser(null);
    setHistory([]);
    setResult(null);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="logo">T</div>
          <div>
            <p className="eyebrow">Multi-Agent</p>
            <h2>TrustLoop AI</h2>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Projects
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Reports
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Settings
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Profile
          </NavLink>
        </nav>
      </aside>

      <main className="main-panel">
        {!user ? (
          <section className="auth-card">
            <div className="card-header">
              <h1>{authMode === 'signup' ? 'Create account' : 'Welcome back'}</h1>
              <p>Review code with AI-powered verification.</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'signup' && (
                <label>
                  Username
                  <input
                    type="text"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </label>

              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Please wait...' : authMode === 'signup' ? 'Sign up' : 'Login'}
              </button>

              <button type="button" className="secondary-btn" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>
                {authMode === 'signup' ? 'Already have an account? Login' : 'Need an account? Sign up'}
              </button>
            </form>

            {error && <div className="error-box">{error}</div>}
          </section>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  user={user}
                  history={history}
                  result={result}
                  language={language}
                  setLanguage={setLanguage}
                  code={code}
                  setCode={setCode}
                  requirements={requirements}
                  setRequirements={setRequirements}
                  handleAnalysis={handleAnalysis}
                  loading={loading}
                  error={error}
                  setError={setError}
                  token={token}
                  logout={logout}
                />
              }
            />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/reports" element={<ReportsPage history={history} />} />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="/profile" element={<ProfilePage user={user} history={history} />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
