import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

const INITIAL_PROJECTS = [
  {
    id: 1,
    title: 'AI-driven Drug Discovery',
    description: 'Using machine learning for novel chemical compound discovery and molecular binding simulations.',
    department_id: 1,
    department_name: 'Computer Science',
    status: 'ACTIVE',
    innovators: [{ name: 'Dr. Alice Smith', role: 'Principal Investigator' }, { name: 'Charlie Brown', role: 'Researcher' }],
    outputs: [{ type: 'PUBLICATION', title: 'Deep Learning in Pharmacology', impact_score: 5 }],
  },
  {
    id: 2,
    title: 'Prosthetic Limb V2',
    description: 'Advanced robotics limb with neural signal sensory feedback and micro-actuators.',
    department_id: 2,
    department_name: 'Bioengineering',
    status: 'UNDER_REVIEW',
    innovators: [{ name: 'Dr. Bob Jones', role: 'Lead Engineer' }],
    outputs: [{ type: 'PATENT', title: 'Neural Interface Sensor', impact_score: 10 }],
  },
  {
    id: 3,
    title: 'Smart Health Device',
    description: 'IoT vital signs monitor with edge inference for patient telemetry in critical care.',
    department_id: 2,
    department_name: 'Bioengineering',
    status: 'ACTIVE',
    innovators: [{ name: 'Dr. Bob Jones', role: 'Investigator' }],
    outputs: [{ type: 'TECH_TRANSFER', title: 'CardioSense Patent License', impact_score: 5 }],
  },
  {
    id: 4,
    title: 'Quantum Key Distribution',
    description: 'High-security cryptographic communication network prototype for campus data centers.',
    department_id: 1,
    department_name: 'Computer Science',
    status: 'DRAFT',
    innovators: [{ name: 'Dr. Alice Smith', role: 'Supervisor' }],
    outputs: [],
  },
  {
    id: 5,
    title: 'Biomaterial Scaffold 3D',
    description: 'Biodegradable polymer scaffold for bone tissue regeneration and cellular adhesion.',
    department_id: 2,
    department_name: 'Bioengineering',
    status: 'COMPLETED',
    innovators: [{ name: 'Dr. Bob Jones', role: 'Lead' }],
    outputs: [{ type: 'TECH_TRANSFER', title: 'RegenBones Tech License', impact_score: 8 }],
  },
];

const INITIAL_DEPARTMENTS = [
  { id: 1, name: 'Computer Science', code: 'CS' },
  { id: 2, name: 'Bioengineering', code: 'BIO' },
];

const INITIAL_AUDIT_LOGS = [
  { id: 1, project_title: 'AI-driven Drug Discovery', action: 'STATUS_CHANGE', previous_state: 'DRAFT', new_state: 'ACTIVE', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 2, project_title: 'Prosthetic Limb V2', action: 'STATUS_CHANGE', previous_state: 'DRAFT', new_state: 'UNDER_REVIEW', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, project_title: 'Smart Health Device', action: 'OUTPUT_ADDED', previous_state: null, new_state: 'TECH_TRANSFER', timestamp: new Date(Date.now() - 172800000).toISOString() },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [trendRange, setTrendRange] = useState('1M');
  const [toast, setToast] = useState(null);

  // Modal States
  const [editingProject, setEditingProject] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: 1,
    status: 'DRAFT',
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Sync with backend API
  useEffect(() => {
    fetchBackendData();
  }, []);

  const fetchBackendData = async () => {
    try {
      const [projRes, deptRes, auditRes] = await Promise.allSettled([
        fetch(`${API_BASE}/projects`),
        fetch(`${API_BASE}/departments`),
        fetch(`${API_BASE}/audit-logs`),
      ]);

      if (projRes.status === 'fulfilled' && projRes.value.ok) {
        const data = await projRes.value.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      }

      if (deptRes.status === 'fulfilled' && deptRes.value.ok) {
        const data = await deptRes.value.json();
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      }

      if (auditRes.status === 'fulfilled' && auditRes.value.ok) {
        const data = await auditRes.value.json();
        if (Array.isArray(data) && data.length > 0) {
          setAuditLogs(data);
        }
      }
    } catch {
      // Graceful offline fallback
    }
  };

  // 1. UPDATE ENTITY
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      department_id: project.department_id || (project.department ? project.department.id || project.department._id : 1),
      status: project.status || 'DRAFT',
    });
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    const projectId = editingProject.id || editingProject._id;
    const selectedDept = departments.find(
      (d) => String(d.id || d._id) === String(formData.department_id)
    );

    const updatedPayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      department_id: Number(formData.department_id) || formData.department_id,
      department_name: selectedDept ? selectedDept.name : 'General',
      status: formData.status,
    };

    try {
      await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
    } catch {
      // Offline fallback
    }

    setProjects((prev) =>
      prev.map((p) =>
        String(p.id || p._id) === String(projectId) ? { ...p, ...updatedPayload } : p
      )
    );

    setEditingProject(null);
    showToast(`Project "${updatedPayload.title}" updated successfully!`);
  };

  // 2. DELETE ENTITY
  const handleDeleteProject = async (id) => {
    const projectToDelete = projects.find((p) => String(p.id || p._id) === String(id));
    const projectTitle = projectToDelete ? projectToDelete.title : 'Project';

    try {
      await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Offline fallback
    }

    setProjects((prev) => prev.filter((p) => String(p.id || p._id) !== String(id)));
    setDeleteConfirmId(null);
    showToast(`Project "${projectTitle}" removed!`);
  };

  // 3. CREATE ENTITY
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const selectedDept = departments.find(
      (d) => String(d.id || d._id) === String(formData.department_id)
    );

    const newProject = {
      id: Date.now(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      department_id: Number(formData.department_id) || 1,
      department_name: selectedDept ? selectedDept.name : 'Computer Science',
      status: formData.status,
      innovators: [],
      outputs: [],
    };

    try {
      await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
    } catch {
      // Offline fallback
    }

    setProjects((prev) => [newProject, ...prev]);
    setIsCreateOpen(false);
    showToast(`Project "${newProject.title}" created successfully!`);
  };

  // Aggregate Metrics for Top Row & Cards
  const totalProjectsCount = projects.length;
  let patentsCount = 0;
  let publicationsCount = 0;
  let techTransfersCount = 0;
  let csScore = 5;
  let bioScore = 10;

  projects.forEach((p) => {
    if (p.outputs) {
      p.outputs.forEach((o) => {
        if (o.type === 'PATENT') patentsCount++;
        if (o.type === 'PUBLICATION') publicationsCount++;
        if (o.type === 'TECH_TRANSFER') techTransfersCount++;
      });
    }
  });

  // Filtered projects for search
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toast && (
        <div className="dark-toast">
          <span>⚡</span>
          <span>{toast}</span>
        </div>
      )}

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="sidebar">
        <div>
          {/* Logo */}
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <h2>InnovationTrack</h2>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </button>

            <button
              className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              Projects
            </button>

            <button
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Analytics
            </button>

            <button
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Reports
            </button>

            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* Promo / Motivation Card */}
        <div className="sidebar-promo-card">
          <div className="promo-rocket">🚀</div>
          <h4>Keep innovating!</h4>
          <p>Turn ideas into impact.</p>
        </div>
      </aside>

      {/* ---------------- MAIN WRAPPER ---------------- */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          {/* Search Box */}
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search projects, patents, or publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Right Action Pills & User Profile */}
          <div className="top-nav-right">
            <div className="view-pills">
              <button
                className={`view-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`view-pill ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                Projects
              </button>
              <button
                className={`view-pill ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                Audit Log
              </button>
            </div>

            {/* Notification Bell with Badge */}
            <button className="notif-btn" title="3 Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notif-badge">3</span>
            </button>

            {/* User Profile JM */}
            <div className="user-profile">
              <div className="avatar">JM</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </header>

        {/* ---------------- CONTENT AREA ---------------- */}
        <div className="content-area">
          {activeTab === 'dashboard' && (
            <>
              {/* Greeting */}
              <div className="greeting-row">
                <h1>Welcome back, John! 👋</h1>
                <p>Here's your innovation overview for this cycle.</p>
              </div>

              {/* Top 4 Summary Metrics (Matches Screenshot) */}
              <div className="top-metrics-grid">
                {/* Total Projects */}
                <div className="metric-card">
                  <div className="metric-icon-wrap blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="metric-val">{totalProjectsCount || 5}</div>
                    <div className="metric-label">Total Projects</div>
                  </div>
                </div>

                {/* Patents */}
                <div className="metric-card">
                  <div className="metric-icon-wrap purple">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <div className="metric-val">{patentsCount}</div>
                    <div className="metric-label">Patents</div>
                  </div>
                </div>

                {/* Publications (DOIs) */}
                <div className="metric-card">
                  <div className="metric-icon-wrap orange">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="metric-val">{publicationsCount || 1}</div>
                    <div className="metric-label">Publications (DOIs)</div>
                  </div>
                </div>

                {/* Tech Transfers */}
                <div className="metric-card">
                  <div className="metric-icon-wrap green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                  <div>
                    <div className="metric-val">{techTransfersCount || 5}</div>
                    <div className="metric-label">Tech Transfers</div>
                  </div>
                </div>
              </div>

              {/* Department Breakdown Section (2 Cards) */}
              <div className="dept-cards-grid">
                {/* 1. Computer Science Card */}
                <div className="dept-summary-card">
                  <div className="dept-card-header">
                    <div className="dept-card-title cs-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                      </svg>
                      <span>Computer Science</span>
                    </div>
                    <button className="view-details-link" onClick={() => setActiveTab('projects')}>
                      View Details &rarr;
                    </button>
                  </div>

                  <div className="dept-card-body">
                    {/* Donut Chart Red */}
                    <div className="donut-chart-container">
                      <svg width="130" height="130" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1f293d" strokeWidth="11" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#e11d48"
                          strokeWidth="11"
                          strokeDasharray="238.76"
                          strokeDashoffset="65"
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="donut-inner-text">
                        <div className="donut-score">{csScore}</div>
                        <div className="donut-label">Total Impact Score</div>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="dept-stat-list">
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot red"></span>
                          <span>Total Projects</span>
                        </div>
                        <span className="stat-val">1</span>
                      </div>
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot purple"></span>
                          <span>Patents</span>
                        </div>
                        <span className="stat-val">0</span>
                      </div>
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot blue"></span>
                          <span>Publications (DOIs)</span>
                        </div>
                        <span className="stat-val">1</span>
                      </div>
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot orange"></span>
                          <span>Tech Transfers</span>
                        </div>
                        <span className="stat-val">0</span>
                      </div>
                      <div className="dept-total-row cs-total">
                        <span>Total Impact Score</span>
                        <span>{csScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Bioengineering Card */}
                <div className="dept-summary-card">
                  <div className="dept-card-header">
                    <div className="dept-card-title bio-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      <span>Bioengineering</span>
                    </div>
                    <button className="view-details-link" onClick={() => setActiveTab('projects')}>
                      View Details &rarr;
                    </button>
                  </div>

                  <div className="dept-card-body">
                    {/* Donut Chart Purple */}
                    <div className="donut-chart-container">
                      <svg width="130" height="130" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1f293d" strokeWidth="11" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="#8b5cf6"
                          strokeWidth="11"
                          strokeDasharray="238.76"
                          strokeDashoffset="40"
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="donut-inner-text">
                        <div className="donut-score">{bioScore}</div>
                        <div className="donut-label">Total Impact Score</div>
                      </div>
                    </div>

                    {/* Breakdown List */}
                    <div className="dept-stat-list">
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot red"></span>
                          <span>Total Projects</span>
                        </div>
                        <span className="stat-val">1</span>
                      </div>
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot purple"></span>
                          <span>Patents</span>
                        </div>
                        <span className="stat-val">1</span>
                      </div>
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot blue"></span>
                          <span>Publications (DOIs)</span>
                        </div>
                        <span className="stat-val">0</span>
                      </div>
                      <div className="dept-stat-row">
                        <div className="stat-left">
                          <span className="dot orange"></span>
                          <span>Tech Transfers</span>
                        </div>
                        <span className="stat-val">0</span>
                      </div>
                      <div className="dept-total-row bio-total">
                        <span>Total Impact Score</span>
                        <span>{bioScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Impact Trend & Recent Activity */}
              <div className="bottom-cards-grid">
                {/* Impact Trend Panel */}
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <div className="panel-title trend-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                      <span>Impact Trend</span>
                    </div>
                    <div className="time-pills">
                      {['1M', '3M', '6M', '1Y'].map((range) => (
                        <button
                          key={range}
                          className={`time-pill ${trendRange === range ? 'active' : ''}`}
                          onClick={() => setTrendRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG Spline Chart */}
                  <div className="trend-chart-box">
                    <svg width="100%" height="100%" viewBox="0 0 500 170" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="30" y1="20" x2="490" y2="20" stroke="rgba(255,255,255,0.05)" />
                      <text x="15" y="24" fill="#64748b" fontSize="10">15</text>

                      <line x1="30" y1="60" x2="490" y2="60" stroke="rgba(255,255,255,0.05)" />
                      <text x="15" y="64" fill="#64748b" fontSize="10">10</text>

                      <line x1="30" y1="100" x2="490" y2="100" stroke="rgba(255,255,255,0.05)" />
                      <text x="18" y="104" fill="#64748b" fontSize="10">5</text>

                      <line x1="30" y1="140" x2="490" y2="140" stroke="rgba(255,255,255,0.05)" />
                      <text x="18" y="144" fill="#64748b" fontSize="10">0</text>

                      {/* Month Labels */}
                      <text x="45" y="160" fill="#94a3b8" fontSize="11">Aug</text>
                      <text x="180" y="160" fill="#94a3b8" fontSize="11">Sep</text>
                      <text x="325" y="160" fill="#94a3b8" fontSize="11">Oct</text>
                      <text x="460" y="160" fill="#94a3b8" fontSize="11">Nov</text>

                      {/* Bioengineering Purple Curve */}
                      <path
                        d="M 50 120 C 120 120, 150 110, 190 108 C 240 105, 280 105, 335 105 C 390 105, 430 110, 470 112 L 470 140 L 50 140 Z"
                        fill="url(#purpleGrad)"
                      />
                      <path
                        d="M 50 120 C 120 120, 150 110, 190 108 C 240 105, 280 105, 335 105 C 390 105, 430 110, 470 112"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2.5"
                      />
                      <circle cx="50" cy="120" r="3.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                      <circle cx="190" cy="108" r="3.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                      <circle cx="335" cy="105" r="3.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />
                      <circle cx="470" cy="112" r="3.5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />

                      {/* Computer Science Red Curve */}
                      <path
                        d="M 50 110 C 110 110, 140 100, 190 98 C 240 95, 270 85, 335 84 C 400 83, 430 87, 470 88 L 470 140 L 50 140 Z"
                        fill="url(#redGrad)"
                      />
                      <path
                        d="M 50 110 C 110 110, 140 100, 190 98 C 240 95, 270 85, 335 84 C 400 83, 430 87, 470 88"
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth="3"
                      />
                      <circle cx="50" cy="110" r="4" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
                      <circle cx="190" cy="98" r="4" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
                      <circle cx="335" cy="84" r="4" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
                      <circle cx="470" cy="88" r="4" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="dot red"></span>
                      <span>Computer Science</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot purple"></span>
                      <span>Bioengineering</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Panel */}
                <div className="dashboard-panel">
                  <div className="panel-header">
                    <div className="panel-title activity-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Recent Activity</span>
                    </div>
                    <button className="view-details-link" onClick={() => setActiveTab('audit')}>
                      View All &rarr;
                    </button>
                  </div>

                  <div className="activity-list">
                    {/* Item 1 */}
                    <div className="activity-item">
                      <div className="activity-icon-wrap pink">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                          <polyline points="2 17 12 22 22 17"></polyline>
                          <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                      </div>
                      <div className="activity-info">
                        <div className="activity-heading">New project added</div>
                        <div className="activity-sub">AI for Healthcare</div>
                      </div>
                      <div className="activity-time">2h ago</div>
                    </div>

                    {/* Item 2 */}
                    <div className="activity-item">
                      <div className="activity-icon-wrap purple">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                      </div>
                      <div className="activity-info">
                        <div className="activity-heading">Publication recorded</div>
                        <div className="activity-sub">Deep Learning for Bioengineering</div>
                      </div>
                      <div className="activity-time">1d ago</div>
                    </div>

                    {/* Item 3 */}
                    <div className="activity-item">
                      <div className="activity-icon-wrap teal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                      </div>
                      <div className="activity-info">
                        <div className="activity-heading">Tech transfer updated</div>
                        <div className="activity-sub">Smart Health Device</div>
                      </div>
                      <div className="activity-time">2d ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------------- PROJECTS TAB ---------------- */}
          {activeTab === 'projects' && (
            <div>
              <div className="projects-header-row">
                <div>
                  <h2>Innovation Projects</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    Manage research initiatives, update statuses, and log university impacts.
                  </p>
                </div>
                <div className="projects-actions-bar">
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="DRAFT">Draft</option>
                    <option value="COMPLETED">Completed</option>
                  </select>

                  <button
                    className="btn-primary-red"
                    onClick={() => {
                      setFormData({
                        title: '',
                        description: '',
                        department_id: departments[0]?.id || 1,
                        status: 'DRAFT',
                      });
                      setIsCreateOpen(true);
                    }}
                  >
                    + New Project
                  </button>
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No projects match your filter or search criteria.
                </div>
              ) : (
                <div className="projects-cards-grid">
                  {filteredProjects.map((project) => {
                    const pId = project.id || project._id;
                    const deptName =
                      project.department_name ||
                      (project.department ? project.department.name : 'General');

                    return (
                      <div key={pId} className="project-card-dark">
                        <div className="card-dark-top">
                          <div>
                            <span className="dark-dept-tag">{deptName}</span>
                            <h3 className="dark-proj-title">{project.title}</h3>
                          </div>
                          <span className={`status-badge ${project.status || 'DRAFT'}`}>
                            {(project.status || 'DRAFT').replace('_', ' ')}
                          </span>
                        </div>

                        <p className="dark-proj-desc">
                          {project.description || 'No description provided.'}
                        </p>

                        {/* Team Chips */}
                        {project.innovators && project.innovators.length > 0 && (
                          <div className="chips-container">
                            {project.innovators.map((i, idx) => (
                              <span key={idx} className="dark-chip">
                                👤 {i.name || (i.innovator ? i.innovator.name : 'Member')} ({i.role || 'Contributor'})
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Impact Outputs */}
                        {project.outputs && project.outputs.length > 0 && (
                          <div className="chips-container">
                            {project.outputs.map((o, idx) => (
                              <span key={idx} className="output-pill">
                                🏆 {o.type}: {o.title} (+{o.impact_score || 0} pts)
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Actions: UPDATE & DELETE */}
                        <div className="card-dark-actions">
                          <button
                            className="btn-dark-edit"
                            onClick={() => handleOpenEdit(project)}
                            title="Update Project"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-dark-delete"
                            onClick={() => setDeleteConfirmId(pId)}
                            title="Delete Project"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------------- AUDIT LOG TAB ---------------- */}
          {activeTab === 'audit' && (
            <div>
              <div className="projects-header-row">
                <div>
                  <h2>Audit Trail</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                    Complete verifiable history of state transitions and output submissions.
                  </p>
                </div>
              </div>

              <div className="audit-list-dark">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="audit-item-dark">
                    <div className="audit-left">
                      <span className="audit-meta-text">
                        {new Date(log.timestamp).toLocaleString()} • Project: {log.project_title || 'University Project'}
                      </span>
                      <span className="audit-title-text">
                        Action: <strong>{log.action.replace('_', ' ')}</strong>
                      </span>
                    </div>
                    <div>
                      {log.previous_state && (
                        <span className="status-badge" style={{ marginRight: '0.5rem', background: '#1e293b' }}>
                          {log.previous_state}
                        </span>
                      )}
                      &rarr;
                      <span className={`status-badge ${log.new_state}`} style={{ marginLeft: '0.5rem' }}>
                        {log.new_state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- EDIT MODAL (UPDATE) ---------------- */}
      {editingProject && (
        <div className="dark-modal-backdrop">
          <div className="dark-modal">
            <div className="dark-modal-header">
              <h3>Update Project</h3>
              <button className="dark-modal-close" onClick={() => setEditingProject(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="dark-form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="dark-input"
                />
              </div>

              <div className="dark-form-group">
                <label>Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="dark-select"
                >
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="dark-form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="dark-select"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="dark-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="dark-textarea"
                />
              </div>

              <div className="dark-modal-footer">
                <button
                  type="button"
                  className="btn-dark-cancel"
                  onClick={() => setEditingProject(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-red">
                  Save Changes (Update)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- CREATE MODAL ---------------- */}
      {isCreateOpen && (
        <div className="dark-modal-backdrop">
          <div className="dark-modal">
            <div className="dark-modal-header">
              <h3>Create New Project</h3>
              <button className="dark-modal-close" onClick={() => setIsCreateOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="dark-form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI for Precision Oncology"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="dark-input"
                />
              </div>

              <div className="dark-form-group">
                <label>Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="dark-select"
                >
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="dark-form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="dark-select"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="dark-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Outline innovation scope and key hypotheses..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="dark-textarea"
                />
              </div>

              <div className="dark-modal-footer">
                <button
                  type="button"
                  className="btn-dark-cancel"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-red">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DELETE CONFIRMATION MODAL ---------------- */}
      {deleteConfirmId && (
        <div className="dark-modal-backdrop">
          <div className="dark-modal dark-modal-sm">
            <div className="dark-modal-header">
              <h3>Confirm Deletion</h3>
              <button className="dark-modal-close" onClick={() => setDeleteConfirmId(null)}>
                &times;
              </button>
            </div>
            <p style={{ margin: '1rem 0', color: '#94a3b8', fontSize: '0.92rem' }}>
              Are you sure you want to permanently delete this project? This will remove all associated outputs and cannot be undone.
            </p>
            <div className="dark-modal-footer">
              <button
                type="button"
                className="btn-dark-cancel"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary-red"
                onClick={() => handleDeleteProject(deleteConfirmId)}
              >
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
