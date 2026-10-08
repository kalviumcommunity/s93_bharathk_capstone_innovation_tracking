const apiBase = 'http://localhost:3000/api';

const app = {
    departments: [],
    
    async init() {
        this.setupNavigation();
        await this.loadDepartments();
        this.loadDashboard();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                
                const target = e.target.dataset.target;
                e.target.classList.add('active');
                document.getElementById(target).classList.add('active');
                
                if (target === 'dashboard') this.loadDashboard();
                if (target === 'projects') this.loadProjects();
                if (target === 'audit') this.loadAudit();
            });
        });
    },

    async loadDepartments() {
        const res = await fetch(`${apiBase}/departments`);
        this.departments = await res.json();
    },

    async loadDashboard() {
        const res = await fetch(`${apiBase}/analytics/department-summary`);
        const data = await res.json();
        
        const container = document.getElementById('analytics-container');
        container.innerHTML = data.map(d => `
            <div class="stat-card">
                <h3>${d.name}</h3>
                <div class="stat-item"><span>Total Projects</span> <span class="stat-value">${d.total_projects}</span></div>
                <div class="stat-item"><span>Patents</span> <span class="stat-value">${d.patents}</span></div>
                <div class="stat-item"><span>Publications (DOIs)</span> <span class="stat-value">${d.publications}</span></div>
                <div class="stat-item"><span>Tech Transfers</span> <span class="stat-value">${d.tech_transfers}</span></div>
                <div class="stat-item"><span>Total Impact Score</span> <span class="stat-value" style="color: var(--primary)">${d.total_impact_score}</span></div>
            </div>
        `).join('');
    },

    async loadProjects() {
        const res = await fetch(`${apiBase}/projects`);
        const projects = await res.json();
        
        const container = document.getElementById('projects-container');
        container.innerHTML = projects.map(p => `
            <div class="project-card">
                <div class="project-header">
                    <div>
                        <div class="project-title">${p.title}</div>
                        <div class="project-dept">${p.department_name}</div>
                    </div>
                    <span class="badge ${p.status}">${p.status.replace('_', ' ')}</span>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">${p.description}</p>
                
                <div style="font-size: 0.9rem;">
                    <strong>Innovators:</strong> ${p.innovators.map(i => `${i.name} (${i.role})`).join(', ')}
                </div>

                <div class="outputs-list">
                    ${p.outputs.map(o => `
                        <span class="badge ${o.type}">${o.type}: ${o.title} (${o.impact_score} pts)</span>
                    `).join('')}
                </div>
                
                <div class="actions">
                    <button class="btn secondary small" onclick="app.showAddOutputModal(${p.id})">Add Output</button>
                    <button class="btn secondary small" onclick="app.showStatusModal(${p.id}, '${p.status}')">Update Status</button>
                </div>
            </div>
        `).join('');
    },

    async loadAudit() {
        const res = await fetch(`${apiBase}/audit-logs`);
        const logs = await res.json();
        
        const container = document.getElementById('audit-container');
        container.innerHTML = logs.map(l => `
            <div class="audit-item">
                <div class="audit-meta">${new Date(l.timestamp).toLocaleString()} | Project: ${l.project_title}</div>
                <div><strong>${l.action.replace('_', ' ')}</strong> 
                ${l.previous_state ? `from <span class="badge ${l.previous_state}">${l.previous_state}</span>` : ''} 
                to <span class="badge ${l.new_state}">${l.new_state}</span></div>
            </div>
        `).join('');
    },

    // Modals
    closeModal() { document.getElementById('modal-overlay').style.display = 'none'; },
    
    showNewProjectModal() {
        const content = `
            <h3>Create New Innovation Project</h3>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="proj-title" class="form-control">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="proj-desc" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Department</label>
                <select id="proj-dept" class="form-control">
                    ${this.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn primary" onclick="app.createProject()">Create Project</button>
            </div>
        `;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    async createProject() {
        const payload = {
            title: document.getElementById('proj-title').value,
            description: document.getElementById('proj-desc').value,
            department_id: document.getElementById('proj-dept').value
        };
        await fetch(`${apiBase}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        this.closeModal();
        this.loadProjects();
    },

    showAddOutputModal(projectId) {
        const content = `
            <h3>Log Innovation Output</h3>
            <div class="form-group">
                <label>Type</label>
                <select id="out-type" class="form-control">
                    <option value="PATENT">Patent</option>
                    <option value="PUBLICATION">Publication (DOI)</option>
                    <option value="TECH_TRANSFER">Technology Transfer</option>
                </select>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="out-title" class="form-control">
            </div>
            <div class="form-group">
                <label>Identifier (DOI/Patent No.)</label>
                <input type="text" id="out-id" class="form-control">
            </div>
            <div class="form-group">
                <label>Impact Score (1-10)</label>
                <input type="number" id="out-score" class="form-control" min="1" max="10" value="5">
            </div>
            <div class="modal-actions">
                <button class="btn secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn primary" onclick="app.addOutput(${projectId})">Save Output</button>
            </div>
        `;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    async addOutput(projectId) {
        const payload = {
            type: document.getElementById('out-type').value,
            title: document.getElementById('out-title').value,
            identifier: document.getElementById('out-id').value,
            impact_score: parseInt(document.getElementById('out-score').value)
        };
        await fetch(`${apiBase}/projects/${projectId}/outputs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        this.closeModal();
        this.loadProjects();
    },

    showStatusModal(projectId, currentStatus) {
        const content = `
            <h3>Update State Machine Status</h3>
            <p style="margin-bottom:1rem; color:var(--text-muted)">Changes will be logged in the immutable audit trail.</p>
            <div class="form-group">
                <label>New Status</label>
                <select id="new-status" class="form-control">
                    <option value="DRAFT" ${currentStatus==='DRAFT'?'selected':''}>DRAFT</option>
                    <option value="UNDER_REVIEW" ${currentStatus==='UNDER_REVIEW'?'selected':''}>UNDER REVIEW</option>
                    <option value="ACTIVE" ${currentStatus==='ACTIVE'?'selected':''}>ACTIVE</option>
                    <option value="COMPLETED" ${currentStatus==='COMPLETED'?'selected':''}>COMPLETED</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn secondary" onclick="app.closeModal()">Cancel</button>
                <button class="btn primary" onclick="app.updateStatus(${projectId})">Update Status</button>
            </div>
        `;
        document.getElementById('modal-content').innerHTML = content;
        document.getElementById('modal-overlay').style.display = 'flex';
    },

    async updateStatus(projectId) {
        const new_status = document.getElementById('new-status').value;
        await fetch(`${apiBase}/projects/${projectId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_status })
        });
        this.closeModal();
        this.loadProjects();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
