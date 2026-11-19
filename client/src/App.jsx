import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:3000/api';

const INITIAL_DEPARTMENTS = [
  { id: 1, _id: '1', name: 'Computer Science', code: 'CS' },
  { id: 2, _id: '2', name: 'Bioengineering', code: 'BIO' },
  { id: 3, _id: '3', name: 'Electrical Engineering', code: 'EE' },
  { id: 4, _id: '4', name: 'Mechanical Engineering', code: 'ME' },
];

const INITIAL_PROJECTS = [
  {
    id: 1,
    _id: '1',
    title: 'AI-driven Drug Discovery',
    description: 'Using ML for new compounds and molecular docking simulations.',
    department_id: 1,
    department_name: 'Computer Science',
    department: { id: 1, name: 'Computer Science', code: 'CS' },
    status: 'ACTIVE',
    innovators: [{ name: 'Dr. Alice Smith', role: 'Principal Investigator' }],
    outputs: [{ type: 'PUBLICATION', title: 'Deep Learning in Pharmacology', impact_score: 5 }],
  },
  {
    id: 2,
    _id: '2',
    title: 'Prosthetic Limb V2',
    description: 'Advanced robotics limb with neural signal sensory feedback.',
    department_id: 2,
    department_name: 'Bioengineering',
    department: { id: 2, name: 'Bioengineering', code: 'BIO' },
    status: 'UNDER_REVIEW',
    innovators: [{ name: 'Dr. Bob Jones', role: 'Lead Engineer' }],
    outputs: [{ type: 'PATENT', title: 'Neural Interface Sensor', impact_score: 10 }],
  },
  {
    id: 3,
    _id: '3',
    title: 'Quantum Key Distribution',
    description: 'High-security cryptographic communication network prototype.',
    department_id: 1,
    department_name: 'Computer Science',
    department: { id: 1, name: 'Computer Science', code: 'CS' },
    status: 'DRAFT',
    innovators: [{ name: 'Charlie Brown', role: 'Researcher' }],
    outputs: [],
  },
];

function App() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modal States
  const [editingProject, setEditingProject] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: 1,
    status: 'DRAFT',
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      }
    } catch {
      // Keep initial departments if server is offline
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      }
    } catch {
      // Keep initial projects if server is offline
    } finally {
      setLoading(false);
    }
  };

  // 1. OPEN EDIT MODAL (Prefill Entity Data)
  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      department_id: project.department_id || (project.department ? project.department.id || project.department._id : 1),
      status: project.status || 'DRAFT',
    });
  };

  // 2. UPDATE ENTITY HANDLER
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
      department: selectedDept || { name: 'General', code: 'GEN' },
      status: formData.status,
    };

    try {
      // Attempt backend API call
      await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
    } catch (err) {
      console.warn('Backend update failed, updating locally:', err);
    }

    // Update in local state
    setProjects((prev) =>
      prev.map((p) =>
        String(p.id || p._id) === String(projectId)
          ? { ...p, ...updatedPayload }
          : p
      )
    );

    setEditingProject(null);
    showNotification(`Project "${updatedPayload.title}" updated successfully!`);
  };

  // 3. DELETE ENTITY HANDLER
  const handleDeleteProject = async (id) => {
    const projectToDelete = projects.find((p) => String(p.id || p._id) === String(id));
    const projectTitle = projectToDelete ? projectToDelete.title : 'Project';

    try {
      await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err);
    }

    // Remove entity from React state
    setProjects((prev) => prev.filter((p) => String(p.id || p._id) !== String(id)));
    setDeleteConfirmId(null);
    showNotification(`Project "${projectTitle}" deleted successfully!`, 'info');
  };

  // 4. CREATE NEW ENTITY
  const handleCreateProject = async (e) => {
    e.preventDefault();
    const selectedDept = departments.find(
      (d) => String(d.id || d._id) === String(formData.department_id)
    );

    const newProject = {
      id: Date.now(),
      _id: String(Date.now()),
      title: formData.title.trim(),
      description: formData.description.trim(),
      department_id: Number(formData.department_id) || 1,
      department_name: selectedDept ? selectedDept.name : 'Computer Science',
      department: selectedDept || { name: 'Computer Science', code: 'CS' },
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
      // Local addition
    }

    setProjects((prev) => [newProject, ...prev]);
    setIsCreateOpen(false);
    showNotification(`Project "${newProject.title}" created successfully!`);
  };

  // Filter projects by search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-active';
      case 'UNDER_REVIEW':
        return 'badge-review';
      case 'COMPLETED':
        return 'badge-completed';
      case 'DRAFT':
      default:
        return 'badge-draft';
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-logo">⚡</div>
            <div>
              <h1>InnovationTrack</h1>
              <p className="subtitle">University Project & Impact Output Management</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
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
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Statistics Bar */}
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Projects</span>
            <span className="stat-number">{projects.length}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Active Innovations</span>
            <span className="stat-number">
              {projects.filter((p) => p.status === 'ACTIVE').length}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Under Review</span>
            <span className="stat-number">
              {projects.filter((p) => p.status === 'UNDER_REVIEW').length}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Departments</span>
            <span className="stat-number">{departments.length}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search projects by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="filter-group">
            <label htmlFor="status-select">Status Filter:</label>
            <select
              id="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-input"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="loading-state">Loading innovation projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>No projects match your current filters.</p>
          </div>
        ) : (
          <div className="project-grid">
            {filteredProjects.map((project) => {
              const pId = project.id || project._id;
              const deptName =
                project.department_name ||
                (project.department ? project.department.name : 'General');

              return (
                <div key={pId} className="project-card">
                  <div className="card-top">
                    <div>
                      <span className="dept-tag">{deptName}</span>
                      <h3 className="project-title">{project.title}</h3>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="project-desc">{project.description || 'No description provided.'}</p>

                  {/* Innovators */}
                  {project.innovators && project.innovators.length > 0 && (
                    <div className="team-section">
                      <span className="section-title">Team:</span>
                      <div className="chips">
                        {project.innovators.map((inn, idx) => (
                          <span key={idx} className="chip">
                            {inn.name || (inn.innovator ? inn.innovator.name : 'Member')} ({inn.role || 'Contributor'})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outputs */}
                  {project.outputs && project.outputs.length > 0 && (
                    <div className="outputs-section">
                      <span className="section-title">Impact Outputs:</span>
                      <div className="chips">
                        {project.outputs.map((out, idx) => (
                          <span key={idx} className="output-chip">
                            {out.type}: {out.title} (+{out.impact_score || 0} pts)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entity Actions: UPDATE and DELETE */}
                  <div className="card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEdit(project)}
                      title="Update Project"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
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
      </main>

      {/* EDIT (UPDATE) MODAL */}
      {editingProject && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Update Project</h2>
              <button
                className="close-btn"
                onClick={() => setEditingProject(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  className="form-control"
                >
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="form-control"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="form-control"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingProject(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes (Update)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                className="close-btn"
                onClick={() => setIsCreateOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-driven Diagnostics"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value })
                  }
                  className="form-control"
                >
                  {departments.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="form-control"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Brief summary of innovation goals..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="form-control"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-sm">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button
                className="close-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                &times;
              </button>
            </div>
            <p style={{ margin: '1rem 0', color: '#4b5563' }}>
              Are you sure you want to permanently delete this project? This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteProject(deleteConfirmId)}
              >
                Yes, Delete Entity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
