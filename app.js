/**
 * AETHER IA - Core Application Logic (Entorno Virgen Simplificado)
 * Vanilla JavaScript ES6+ - Pure Sequential Logic
 */

const State = {
    currentView: 'dashboard',
    students: [],
    selectedStudentId: null,
    charts: {}
};

// --- Estado Virgen Forzado (Garantía de Cero Registros Residuales) ---
const loadDataFromStorage = () => {
    localStorage.removeItem('aether_students'); 
    localStorage.setItem('aether_students', JSON.stringify([]));
    State.students = [];
};

// --- Componentes UI Core ---
const UI = {
    updateClock() {
        const now = new Date();
        document.getElementById('current-time').textContent = now.toLocaleTimeString();
    },

    switchView(targetId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');
        
        const targetNav = document.querySelector(`[data-target="${targetId}"]`);
        if (targetNav) targetNav.classList.add('active');

        State.currentView = targetId;
        if (targetId === 'dashboard') {
            this.renderCharts();
        }
    },

    renderMetrics() {
        const data = State.students;
        const total = data.length;
        
        if (total === 0) {
            document.getElementById('metric-total-absences').textContent = 0;
            document.getElementById('metric-ia-automation').textContent = '0%';
            document.getElementById('metric-critical-threshold').textContent = 0;
            return;
        }

        const automated = data.filter(s => s.score >= 85).length;
        const critical = data.filter(s => s.score < 50).length;

        document.getElementById('metric-total-absences').textContent = total;
        document.getElementById('metric-ia-automation').textContent = `${Math.round((automated / total) * 100)}%`;
        document.getElementById('metric-critical-threshold').textContent = critical;
    },

    renderLog() {
        const tbody = document.getElementById('log-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const data = State.students;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); font-family: var(--font-mono); padding: 3rem 1rem;">SISTEMA VIRGEN: Esperando transmisiones externas...</td></tr>`;
            return;
        }

        data.forEach(student => {
            const tr = document.createElement('tr');
            if (State.selectedStudentId === student.id) tr.style.background = 'rgba(139, 92, 246, 0.15)';
            
            const statusClass = `status-${student.status}`;
            const statusText = student.status === 'valid' ? 'Validado' : (student.status === 'pending' ? 'Pendiente' : 'Apelación/Rechazado');

            tr.innerHTML = `
                <td>
                    <div style="font-weight:700;">${student.name}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${student.carne || 'Sin Carné'}</div>
                </td>
                <td><span class="reason-tag">${student.reason}</span></td>
                <td class="mono" style="color: ${student.score >= 85 ? 'var(--status-ok)' : (student.score < 50 ? 'var(--status-error)' : 'var(--status-warn)')}; font-weight:700;">${student.score}%</td>
                <td><span class="table-status ${statusClass}">${statusText}</span></td>
                <td><button class="table-action-btn" onclick="UI.selectForReview('${student.id}')"><i class="fa-solid fa-eye"></i> Revisar</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    selectForReview(id) {
        State.selectedStudentId = id;
        const student = State.students.find(s => s.id === id);
        if (!student) return;

        this.switchView('review');

        document.getElementById('extract-id').value = student.id;
        document.getElementById('extract-student').value = student.name;
        document.getElementById('extract-carne').value = student.carne || 'N/A';
        document.getElementById('extract-date').value = student.date || 'N/A';
        document.getElementById('extract-reason-badge').value = (student.reason || 'OTROS').toUpperCase();
        document.getElementById('extract-reason').value = student.description || 'Procesado analíticamente por el Core.';
        
        const statusPill = document.getElementById('extract-status-pill');
        if (statusPill) {
            statusPill.className = `status-pill ${student.status === 'valid' ? 'success' : (student.status === 'pending' ? 'warning' : 'danger')}`;
            statusPill.textContent = student.status === 'valid' ? 'Validado por Sistema' : (student.status === 'pending' ? 'Pendiente de Firma' : 'Rechazado / Apelación');
        }

        const scoreBadge = document.getElementById('confidence-score');
        if (scoreBadge) scoreBadge.textContent = `${student.score}%`;
        
        const wrapper = document.getElementById('confidence-score-wrapper');
        if (wrapper) wrapper.style.borderColor = student.score >= 85 ? 'var(--status-ok)' : (student.score < 50 ? 'var(--status-error)' : 'var(--status-warn)');

        document.getElementById('btn-action-approve').disabled = false;
        document.getElementById('btn-action-reject').disabled = false;

        const docTitle = document.getElementById('doc-title-render');
        const docBody = document.getElementById('doc-body-render');
        
        if (docTitle) docTitle.textContent = (student.fileName || 'DOCUMENTO_ADJUNTO.PDF').toUpperCase();
        
        if (docBody) {
            if (student.fileData) {
                docBody.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; gap:1rem; padding: 2rem 0;">
                        <i class="fa-solid fa-file-shield" style="font-size:3.5rem; color:var(--accent-cyan);"></i>
                        <p style="font-family:var(--font-mono); font-size:0.85rem; text-align:center;">Constancia binaria Base64 detectada</p>
                        <button class="table-action-btn" onclick="UI.openBase64Window('${student.id}')" style="padding: 0.5rem 1rem; background: var(--accent-violet); color: white; border: none; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Documento</button>
                    </div>
                `;
            } else {
                docBody.innerHTML = `
                    <div class="doc-header" style="border-bottom:1px dashed var(--border-color); padding-bottom:0.5rem; margin-bottom:1rem; font-size:0.85rem; color:var(--accent-violet);">EXTRACTOR LÓGICO NLP</div>
                    <div style="font-size:0.85rem; line-height:1.6; font-family:var(--font-mono); color:var(--text-secondary);">
                        <p><strong>ID TRANSACCIÓN:</strong> ${student.id}</p>
                        <p><strong>FECHA REGISTRADA:</strong> ${student.date || 'N/A'}</p>
                        <div style="margin-top:1rem; border:1px solid var(--border-color); padding:1rem; background:rgba(0,0,0,0.2); border-radius:6px;">
                            "${student.description || 'Documento procesado correctamente sin alertas heurísticas.'}"
                        </div>
                    </div>
                `;
            }
        }
        this.renderLog();
    },

    openBase64Window(id) {
        const student = State.students.find(s => s.id === id);
        if(student && student.fileData) {
            const win = window.open();
            win.document.write(`<iframe src="${student.fileData}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
    },

    executeAction(newStatus) {
        const id = document.getElementById('extract-id').value;
        if (!id) return;

        const index = State.students.findIndex(s => s.id === id);
        if (index === -1) return;

        State.students[index].status = newStatus;
        localStorage.setItem('aether_students', JSON.stringify(State.students));

        this.renderMetrics();
        this.renderLog();
        this.selectForReview(id); 
        
        const wsStatus = document.getElementById('ws-status');
        if (wsStatus) {
            wsStatus.textContent = `Dictamen manual: ${newStatus === 'valid' ? 'Aprobado' : 'Rechazado'}`;
            wsStatus.style.color = 'var(--accent-cyan)';
            setTimeout(() => { wsStatus.textContent = "Bus Local: Activo"; wsStatus.style.color = 'var(--text-secondary)'; }, 3000);
        }
    },

    renderCharts() {
        const data = State.students;
        const canvasWeekly = document.getElementById('weeklyAbsenceChart');
        const canvasReason = document.getElementById('reasonChart');

        if (data.length === 0) {
            if (State.charts.weekly) { State.charts.weekly.destroy(); State.charts.weekly = null; }
            if (State.charts.reason) { State.charts.reason.destroy(); State.charts.reason = null; }
            return;
        }

        const counts = {};
        data.forEach(s => {
            const reason = s.reason || 'Otros';
            counts[reason] = (counts[reason] || 0) + 1;
        });

        const weeklyDistribution = { 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0 };
        const diasSemanaMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        data.forEach(s => {
            if (s.date) {
                const dateObj = new Date(s.date + 'T00:00:00');
                const dayLabel = diasSemanaMap[dateObj.getDay()];
                if (weeklyDistribution[dayLabel] !== undefined) {
                    weeklyDistribution[dayLabel]++;
                }
            }
        });

        if (State.charts.weekly) State.charts.weekly.destroy();
        if (State.charts.reason) State.charts.reason.destroy();

        if (canvasWeekly) {
            State.charts.weekly = new Chart(canvasWeekly.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
                    datasets: [{
                        label: 'Inasistencias',
                        data: [weeklyDistribution['Lun'], weeklyDistribution['Mar'], weeklyDistribution['Mié'], weeklyDistribution['Jue'], weeklyDistribution['Vie']],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.05)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: '#1e1e2f' }, ticks: { stepSize: 1, color: '#64748b', font: { family: 'JetBrains Mono' } } },
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } } }
                    }
                }
            });
        }

        if (canvasReason) {
            State.charts.reason = new Chart(canvasReason.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(counts),
                    datasets: [{
                        data: Object.values(counts),
                        backgroundColor: ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Urbanist', size: 12 } } } 
                    },
                    cutout: '70%'
                }
            });
        }
    }
};

// --- Gestión de Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();

    setInterval(() => UI.updateClock(), 1000);
    UI.updateClock();

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => UI.switchView(item.dataset.target));
    });

    const btnApprove = document.getElementById('btn-action-approve');
    const btnReject = document.getElementById('btn-action-reject');
    if (btnApprove) btnApprove.onclick = () => UI.executeAction('valid');
    if (btnReject) btnReject.onclick = () => UI.executeAction('appeal');

    window.addEventListener('storage', (e) => {
        if (e.key === 'aether_students') {
            State.students = JSON.parse(e.newValue || '[]');
            UI.renderMetrics();
            UI.renderLog();
            if (State.currentView === 'dashboard') UI.renderCharts();
        }
    });

    UI.renderMetrics();
    UI.renderLog();
    UI.renderCharts();
});