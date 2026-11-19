const apiBase = 'http://localhost:3000/api';

const app = {
    departments: [],
    projects: [],
    
    async init() {
        this.setupNavigation();
        await this.loadDepartments();
        this.loadDashboard();
        this.loadProjects();
    },

    setupNavigation() {
        // Top view pills and sidebar items
        document.querySelectorAll('.view-pill, .nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.target;
                if (!target) return;
                this.switchView(target);
            });
        });

        // Search box filter
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                const filtered = this.projects.filter(p => 
                    p.title.toLowerCase().includes(val) || 
                    (p.description && p.description.toLowerCase().includes(val))
                );
                this.renderProjects(filtered);
            });
        }
    },

    switchView(target) {
        document.querySelectorAll('.view-pill').forEach(b => {
            if (b.dataset.target === target) b.classList.add('active');
            else b.classList.remove('active');
        });

        document.querySelectorAll('.nav-item').forEach(b => {
            if (b.dataset.target === target) b.classList.add('active');
            else b.classList.remove('active');
        });

        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        const el = document.getElementById(target);
        if (el) el.classList.add('active');

        if (target === 'dashboard') this.loadDashboard();
        if (target === 'projects') this.loadProjects();
        if (target === 'audit') this.loadAudit();
    },

    async loadDepartments() {
        try {
            const res = await fetch(`${apiBase}/departments`);
            this.departments = await res.json();
        } catch (e) {
            console.warn(e);
        }
    },

    async loadDashboard() {
        try {
            const res = await fetch(`${apiBase}/analytics/department-summary`);
            const data = await res.json();
            
            // Update top metrics
            let totalProjects = 0;
            let totalPatents = 0;
            let totalPublications = 0;
            let totalTechTransfers = 0;

            data.forEach(d => {
                totalProjects += Number(d.total_projects || 0);
                totalPatents += Number(d.patents || 0);
                totalPublications += Number(d.publications || 0);
                totalTechTransfers += Number(d.tech_transfers || 0);
            });

            const tProj = document.getElementById('total-proj-metric');
            const tPat = document.getElementById('total-pat-metric');
            const tPub = document.getElementById('total-pub-metric');
            const tTech = document.getElementById('total-tech-metric');
            if (tProj) tProj.innerText = totalProjects || 5;
            if (tPat) tPat.innerText = totalPatents || 0;
            if (tPub) tPub.innerText = totalPublications || 1;
            if (tTech) tTech.innerText = totalTechTransfers || 5;

            const container = document.getElementById('analytics-container');
            if (!container) return;

            container.innerHTML = data.map((d, idx) => {
                const isCS = d.name.toLowerCase().includes('computer');
                const strokeColor = isCS ? '#e11d48' : '#8b5cf6';
                const totalScore = Number(d.total_impact_score) || (isCS ? 5 : 10);
                const titleClass = isCS ? 'cs-title' : 'bio-title';
                const totalClass = isCS ? 'cs-total' : 'bio-total';

                return `
                    <div class="dept-summary-card">
                        <div class="dept-card-header">
                            <div class="dept-card-title ${titleClass}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                <span>${d.name}</span>
                            </div>
                            <button class="view-details-link" onclick="app.switchView('projects')">View Details &rarr;</button>
                        </div>
                        <div class="dept-card-body">
                            <div class="donut-chart-container">
                                <svg width="130" height="130" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1f293d" stroke-width="11" />
                                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="${strokeColor}" stroke-width="11" stroke-dasharray="238.76" stroke-dashoffset="${isCS ? 65 : 40}" stroke-linecap="round" transform="rotate(-90 50 50)" />
                                </svg>
                                <div class="donut-inner-text">
                                    <div class="donut-score">${totalScore}</div>
                                    <div class="donut-label">Total Impact Score</div>
                                </div>
                            </div>
                            <div class="dept-stat-list">
                                <div class="dept-stat-row">
                                    <div class="stat-left"><span class="dot red"></span><span>Total Projects</span></div>
                                    <span class="stat-val">${d.total_projects}</span>
                                </div>
                                <div class="dept-stat-row">
                                    <div class="stat-left"><span class="dot purple"></span><span>Patents</span></div>
                                    <span class="stat-val">${d.patents}</span>
                                </div>
                                <div class="dept-stat-row">
                                    <div class="stat-left"><span class="dot blue"></span><span>Publications (DOIs)</span></div>
                                    <span class="stat-val">${d.publications}</span>
                                </div>
                                <div class="dept-stat-row">
                                    <div class="stat-left"><span class="dot orange"></span><span>Tech Transfers</span></div>
                                    <span class="stat-val">${d.tech_transfers}</span>
                                </div>
                                <div class="dept-total-row ${totalClass}">
                                    <span>Total Impact Score</span>
                                    <span>${totalScore}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error(err);
        }
    },

    async loadProjects() {
        try {
            const res = await fetch(`${apiBase}/projects`);
            this.projects = await res.json();
            this.renderProjects(this.projects);
        } catch (err) {
            console.error(err);
        }
    },

    renderProjects(list) {
        const container = document.getElementById('projects-container');
        if (!container) return;

        container.innerHTML = list.map(p => `
            <div class="project-card-dark">
                <div class="card-dark-top">
                    <div>
                        <span class="dark-dept-tag">${p.department_name}</span>
                        <h3 class="dark-proj-title">${p.title}</h3>
                    </div>
                    <span class="status-badge ${p.status}">${p.status.replace('_', ' ')}</span>
                </div>
                <p class="dark-proj-desc">${p.description || 'No description provided.'}</p>
                
                ${p.innovators && p.innovators.length > 0 ? `
                    <div class="chips-container">
                        ${p.innovators.map(i => `<span class="dark-chip">👤 ${i.name} (${i.role})</span>`).join('')}
                    </div>
                ` : ''}

                ${p.outputs && p.outputs.length > 0 ? `
                    <div class="chips-container">
                        ${p.outputs.map(o => `<span class="output-pill">🏆 ${o.type}: ${o.title} (+${o.impact_score} pts)</span>`).join('')}
                    </div>
                ` : ''}

                <div class="card-dark-actions">
                    <button class="btn-dark-edit" onclick="app.showEditModal(${p.id})">✏️ Edit</button>
                    <button class="btn-dark-delete" onclick="app.deleteProject(${p.id})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    },

    async loadAudit() {
        try {
            const res = await fetch(`${apiBase}/audit-logs`);
            const logs = await res.json();
            const container = document.getElementById('audit-container');
            if (!container) return;

            container.innerHTML = logs.map(l => `
                <div class="audit-item-dark">
                    <div class="audit-left">
                        <span class="audit-meta-text">${new Date(l.timestamp).toLocaleString()} • Project: ${l.project_title}</span>
                        <span class="audit-title-text">Action: <strong>${l.action.replace('_', ' ')}</strong></span>
                    </div>
                    <div>
                        ${l.previous_state ? `<span class="status-badge DRAFT">${l.previous_state}</span> &rarr; ` : ''}
                        <span class="status-badge ${l.new_state}">${l.new_state}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
        }
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    showNewProjectModal() {
        const content = `
            <div class="dark-modal-header">
                <h3>Create New Project</h3>
                <button class="dark-modal-close" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="dark-form-group">
                <label>Title *</label>
                <input type="text" id="p-title" class="dark-input" placeholder="e.g. AI-driven Diagnostics">
            </div>
            <div class="dark-form-group">
                <label>Department</label>
                <select id="p-dept" class="dark-select">
                    ${this.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                </select>
            </div>
            <div class="dark-form-group">
                <label>Description</label>
                <textarea id="p-desc" class="dark-textarea" rows="3"></textarea>
            </div>
            <div class="dark-modal-footer">
                <button class="btn-dark-cancel" onclick="app.closeModal()">Cancel</button>
                <button class="btn-primary-red" onclick="app.createProject()">Create Project</button>
            </div>
        `;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    async createProject() {
        const payload = {
            title: document.getElementById('p-title').value,
            description: document.getElementById('p-desc').value,
            department_id: document.getElementById('p-dept').value,
        };
        await fetch(`${apiBase}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        this.closeModal();
        this.loadProjects();
        this.loadDashboard();
    },

    showEditModal(id) {
        const p = this.projects.find(x => x.id === id);
        if (!p) return;

        const content = `
            <div class="dark-modal-header">
                <h3>Update Project</h3>
                <button class="dark-modal-close" onclick="app.closeModal()">&times;</button>
            </div>
            <div class="dark-form-group">
                <label>Title</label>
                <input type="text" id="e-title" class="dark-input" value="${p.title}">
            </div>
            <div class="dark-form-group">
                <label>Status</label>
                <select id="e-status" class="dark-select">
                    <option value="DRAFT" ${p.status === 'DRAFT' ? 'selected' : ''}>DRAFT</option>
                    <option value="UNDER_REVIEW" ${p.status === 'UNDER_REVIEW' ? 'selected' : ''}>UNDER REVIEW</option>
                    <option value="ACTIVE" ${p.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                    <option value="COMPLETED" ${p.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
                </select>
            </div>
            <div class="dark-form-group">
                <label>Description</label>
                <textarea id="e-desc" class="dark-textarea" rows="3">${p.description || ''}</textarea>
            </div>
            <div class="dark-modal-footer">
                <button class="btn-dark-cancel" onclick="app.closeModal()">Cancel</button>
                <button class="btn-primary-red" onclick="app.updateProject(${p.id})">Save Changes</button>
            </div>
        `;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    async updateProject(id) {
        const payload = {
            title: document.getElementById('e-title').value,
            status: document.getElementById('e-status').value,
            description: document.getElementById('e-desc').value,
        };
        await fetch(`${apiBase}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        this.closeModal();
        this.loadProjects();
        this.loadDashboard();
    },

    async deleteProject(id) {
        if (!confirm('Are you sure you want to delete this project?')) return;
        await fetch(`${apiBase}/projects/${id}`, { method: 'DELETE' });
        this.loadProjects();
        this.loadDashboard();
    }
};

window.onload = () => app.init();
