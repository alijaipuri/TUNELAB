const API = 'http://localhost:9000';

const state = {
  page: 'dashboard',
  jobs: [],
  datasets: {},
  chatHistory: [],
  chatDomain: 'general',
  activeJob: null,
  systemMetrics: {},
  trainingChart: null,
  benchmarkResults: null,
};

// ─── ROUTER ───────────────────────────────────────
function navigate(page) {
  state.page = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.getElementById('page-title').textContent = {
    dashboard: 'Mission Control',
    finetune: 'Fine-Tune Engine',
    chat: 'AI Playground',
    evaluate: 'Evaluation Suite',
    deploy: 'Deploy & Export',
    monitor: 'System Monitor',
  }[page] || page;
  renderPage(page);
}

// ─── NOTIFICATIONS ────────────────────────────────
function notify(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── API HELPERS ─────────────────────────────────
async function api(path, opts = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    return res.json();
  } catch (e) {
    console.error(e);
    return { error: e.message };
  }
}

// ─── SYSTEM METRICS LOOP ─────────────────────────
async function refreshSystemMetrics() {
  try {
    const data = await api('/api/system');
    state.systemMetrics = data;
    const el = document.getElementById('sys-badge');
    if (el && data.cpu_percent !== undefined) {
      el.innerHTML = `
        <div class="metric-row"><span>CPU</span><span class="metric-val">${data.cpu_percent}%</span></div>
        <div class="metric-row"><span>RAM</span><span class="metric-val">${data.ram_used_gb}/${data.ram_total_gb} GB</span></div>
        <div class="metric-row"><span>DISK</span><span class="metric-val">${data.disk_used_gb} GB</span></div>
        ${data.gpu ? `<div class="metric-row"><span>GPU</span><span class="metric-val">${data.gpu.util}%</span></div>` : ''}
      `;
    }
  } catch (e) {}
}
setInterval(refreshSystemMetrics, 4000);

// ─── PARTICLE CANVAS ─────────────────────────────
function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108,99,255,${p.opacity})`;
      ctx.fill();
    });
    // draw connections
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(108,99,255,${0.06 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ─── PAGES ────────────────────────────────────────
function renderPage(page) {
  const content = document.getElementById('content');
  const pages = { dashboard: renderDashboard, finetune: renderFinetune, chat: renderChat, evaluate: renderEvaluate, deploy: renderDeploy, monitor: renderMonitor };
  content.innerHTML = '';
  (pages[page] || (() => { content.innerHTML = '<p>Page not found</p>'; }))();
}

// ── DASHBOARD ─────────────────────────────────────
function renderDashboard() {
  const content = document.getElementById('content');
  const jobs = state.jobs;
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  content.innerHTML = `
    <div class="grid-4" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-value">${jobs.length}</div>
        <div class="stat-label">Total Training Jobs</div>
        <div class="stat-change up">↑ All time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--accent4)">${runningJobs}</div>
        <div class="stat-label">Active Jobs</div>
        <div class="stat-change ${runningJobs > 0 ? 'up' : ''}">${runningJobs > 0 ? '⚡ Running' : '— Idle'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--success)">${completedJobs}</div>
        <div class="stat-label">Completed</div>
        <div class="stat-change up">✓ Success</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--accent2)">${Object.keys(state.datasets).length}</div>
        <div class="stat-label">Datasets Loaded</div>
        <div class="stat-change">📦 Ready</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div><div class="card-title">🚀 Quick Start</div><div class="card-sub">Launch a new fine-tuning run</div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-primary" onclick="navigate('finetune')">⚡ Start Fine-Tuning</button>
          <button class="btn btn-secondary" onclick="navigate('chat')">💬 Open AI Playground</button>
          <button class="btn btn-secondary" onclick="navigate('evaluate')">📊 Run Benchmarks</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div><div class="card-title">🧠 Model: llama-3.3-70b</div><div class="card-sub">via Groq — ultra-fast inference</div></div>
          <span class="badge badge-green">ONLINE</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--text2)">
          <div>📍 Context Window: <span style="color:var(--accent2)">128K tokens</span></div>
          <div>⚡ Speed: <span style="color:var(--accent2)">~750 tokens/sec (Groq)</span></div>
          <div>🌐 Domains: <span style="color:var(--accent2)">Wellness · Legal · Code · General</span></div>
          <div>🔧 Methods: <span style="color:var(--accent2)">LoRA · QLoRA · DoRA · GRPO</span></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">📋 Recent Jobs</div>
        <button class="btn btn-sm btn-secondary" onclick="navigate('finetune')">+ New Job</button>
      </div>
      ${jobs.length === 0 ? `<div style="text-align:center;padding:30px;color:var(--text3);font-size:13px">No jobs yet. Start your first fine-tuning run →</div>` : `
        <table class="metrics-table">
          <thead><tr><th>JOB ID</th><th>DOMAIN</th><th>STATUS</th><th>PROGRESS</th><th>ACTION</th></tr></thead>
          <tbody>
            ${jobs.slice(-5).reverse().map(j => `
              <tr>
                <td><span style="font-family:var(--font-mono);font-size:11px">${j.job_id}</span></td>
                <td><span class="badge badge-purple">${j.config?.domain || 'general'}</span></td>
                <td><span class="badge ${j.status === 'completed' ? 'badge-green' : j.status === 'running' ? 'badge-cyan' : 'badge-yellow'}">${j.status}</span></td>
                <td>
                  <div class="progress-bar" style="width:120px"><div class="progress-fill" style="width:${j.progress}%"></div></div>
                </td>
                <td><button class="btn btn-sm btn-secondary" onclick="viewJob('${j.job_id}')">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">⚡ TuneLab Features</div></div>
      <div class="grid-3" style="gap:12px">
        ${[
          ['🧬','Multimodal Fine-Tuning','Text + EEG/physiological signal fusion for mental wellness AI'],
          ['⚡','Unsloth-Powered Training','2× faster, 70% less VRAM vs standard PEFT'],
          ['🔍','AI Dataset Analysis','Groq LLM auto-analyzes your data quality & recommends strategy'],
          ['📊','Live Loss Dashboard','Real-time training curves, GPU utilization, live terminal logs'],
          ['🚀','One-Click Deploy','Export LoRA adapters → Docker / HF Space / FastAPI instantly'],
          ['🛡️','Privacy-First','Fully local mode or edge deployment — no data leaves your machine'],
        ].map(([icon, title, desc]) => `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:16px">
            <div style="font-size:22px;margin-bottom:8px">${icon}</div>
            <div style="font-family:var(--font-head);font-size:13px;font-weight:700;margin-bottom:4px">${title}</div>
            <div style="font-size:12px;color:var(--text3);line-height:1.5">${desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  refreshJobs();
}

async function refreshJobs() {
  const data = await api('/api/finetune/jobs');
  if (Array.isArray(data)) { state.jobs = data; }
}

// ── FINETUNE PAGE ─────────────────────────────────
function renderFinetune() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div>
        <div class="card">
          <div class="card-header"><div class="card-title">📦 Dataset Upload</div></div>
          <div class="upload-zone" id="upload-zone" onclick="document.getElementById('file-input').click()">
            <div class="upload-icon">🗂️</div>
            <div class="upload-text">Drop your dataset here</div>
            <div class="upload-sub">CSV · JSON · JSONL · TXT supported</div>
          </div>
          <input type="file" id="file-input" style="display:none" accept=".csv,.json,.jsonl,.txt" onchange="handleFileUpload(event)">
          <div id="dataset-info" style="margin-top:12px"></div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">⚙️ Training Config</div></div>
          <div class="form-group">
            <label class="label">Method</label>
            <select id="cfg-method">
              <option value="lora">LoRA (Recommended)</option>
              <option value="qlora">QLoRA (Low VRAM)</option>
              <option value="dora">DoRA (Higher Quality)</option>
              <option value="grpo">GRPO (Reasoning)</option>
              <option value="full">Full Fine-Tune</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Base Model</label>
            <select id="cfg-model">
              <option value="llama-3.1-8b">Llama 3.1 8B</option>
              <option value="llama-3.1-70b">Llama 3.1 70B</option>
              <option value="mistral-7b">Mistral 7B</option>
              <option value="phi-3-mini">Phi-3 Mini</option>
              <option value="gemma-2-9b">Gemma 2 9B</option>
              <option value="qwen2.5-7b">Qwen 2.5 7B</option>
            </select>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="label">Epochs: <span id="epochs-val">3</span></label>
              <input type="range" min="1" max="10" value="3" oninput="document.getElementById('epochs-val').textContent=this.value" id="cfg-epochs">
            </div>
            <div class="form-group">
              <label class="label">Batch Size: <span id="batch-val">4</span></label>
              <input type="range" min="1" max="32" value="4" oninput="document.getElementById('batch-val').textContent=this.value" id="cfg-batch">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="label">Learning Rate</label>
              <select id="cfg-lr">
                <option value="0.0002">2e-4 (LoRA default)</option>
                <option value="0.00005">5e-5 (Conservative)</option>
                <option value="0.001">1e-3 (Aggressive)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">LoRA Rank</label>
              <select id="cfg-rank">
                <option value="16">r=16</option>
                <option value="32">r=32</option>
                <option value="64">r=64</option>
                <option value="128">r=128</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="label">Quantization</label>
            <select id="cfg-quant">
              <option value="4bit">4-bit (QLoRA)</option>
              <option value="8bit">8-bit</option>
              <option value="fp16">FP16</option>
              <option value="fp8">FP8 (Experimental)</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:center;justify-content:space-between">
            <label class="label" style="margin:0">Enable WandB Tracking</label>
            <label class="toggle"><input type="checkbox" id="cfg-wandb"><span class="toggle-slider"></span></label>
          </div>
          <div class="form-group" style="display:flex;align-items:center;justify-content:space-between">
            <label class="label" style="margin:0">Privacy Mode (Local Only)</label>
            <label class="toggle"><input type="checkbox" id="cfg-privacy" checked><span class="toggle-slider"></span></label>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px" onclick="startTraining()">
            ⚡ Launch Training
          </button>
        </div>
      </div>

      <div>
        <div class="card" id="training-card">
          <div class="card-header">
            <div class="card-title">📈 Training Monitor</div>
            <span id="job-status-badge" class="badge badge-yellow" style="display:none">IDLE</span>
          </div>
          <div id="progress-section" style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:4px">
              <span>Progress</span><span id="progress-pct">0%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" id="main-progress" style="width:0%"></div></div>
          </div>
          <div class="chart-container" style="margin-bottom:16px">
            <canvas id="loss-chart"></canvas>
          </div>
          <div class="terminal" id="training-log">
            <div class="log-line" style="color:var(--text3)">// Waiting for training job...</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-sm btn-danger" onclick="cancelJob()" style="flex:1;justify-content:center">⏹ Cancel</button>
            <button class="btn btn-sm btn-success" onclick="downloadModel()" style="flex:1;justify-content:center">⬇ Export Model</button>
          </div>
        </div>

        <div class="card" id="ai-analysis-card" style="display:none">
          <div class="card-header"><div class="card-title">🤖 AI Dataset Analysis</div><span class="badge badge-cyan">Powered by Groq</span></div>
          <div id="analysis-content"></div>
        </div>
      </div>
    </div>
  `;

  if (state.activeJob) pollJobStatus(state.activeJob);
  initLossChart();
}

function initLossChart() {
  const ctx = document.getElementById('loss-chart');
  if (!ctx) return;
  if (typeof Chart === 'undefined') return;
  state.trainingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Train Loss', data: [], borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,0.08)', tension: 0.4, pointRadius: 0 },
        { label: 'Eval Loss', data: [], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.06)', tension: 0.4, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { labels: { color: '#9090b0', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#5a5a80', maxTicksLimit: 8 }, grid: { color: 'rgba(42,42,69,0.4)' } },
        y: { ticks: { color: '#5a5a80' }, grid: { color: 'rgba(42,42,69,0.4)' } }
      }
    }
  });
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const zone = document.getElementById('upload-zone');
  zone.innerHTML = `<div class="upload-icon">⏳</div><div class="upload-text">Analyzing: ${file.name}...</div>`;
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const res = await fetch(`${API}/api/finetune/upload-dataset`, { method: 'POST', body: formData });
    const data = await res.json();
    
    if (data.error) { notify(data.error, 'error'); return; }
    
    state.datasets[data.dataset_id] = data;
    state.currentDatasetId = data.dataset_id;
    
    zone.innerHTML = `
      <div class="upload-icon">✅</div>
      <div class="upload-text" style="color:var(--success)">${file.name}</div>
      <div class="upload-sub">${data.stats.rows} rows · ${(data.stats.estimated_tokens || 0).toLocaleString()} est. tokens</div>
    `;
    
    // Show AI analysis
    const card = document.getElementById('ai-analysis-card');
    const content = document.getElementById('analysis-content');
    card.style.display = 'block';
    const a = data.analysis || {};
    content.innerHTML = `
      <div class="grid-2" style="gap:10px;margin-bottom:12px">
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">DOMAIN</div>
          <div style="font-weight:600"><span class="badge badge-purple">${a.domain || 'general'}</span></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">STRATEGY</div>
          <div><span class="badge badge-cyan">${a.fine_tuning_strategy || 'LoRA'}</span></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">QUALITY SCORE</div>
          <div style="font-family:var(--font-mono);font-size:20px;color:var(--success)">${a.quality_score || 75}/100</div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:12px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">TASK</div>
          <div><span class="badge badge-green">${a.recommended_task || 'generation'}</span></div>
        </div>
      </div>
      ${a.preprocessing_steps?.length ? `
        <div style="font-size:12px;color:var(--text3);margin-bottom:6px">Recommended Steps:</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${a.preprocessing_steps.map(s => `<span class="badge badge-yellow">${s}</span>`).join('')}
        </div>
      ` : ''}
    `;
    notify('Dataset analyzed by Groq AI!', 'success');
  } catch (e) {
    notify('Upload failed: ' + e.message, 'error');
    zone.innerHTML = `<div class="upload-icon">❌</div><div class="upload-text">Upload failed</div>`;
  }
}

async function startTraining() {
  const config = {
    method: document.getElementById('cfg-method').value,
    model: document.getElementById('cfg-model').value,
    epochs: parseInt(document.getElementById('cfg-epochs').value),
    batch_size: parseInt(document.getElementById('cfg-batch').value),
    learning_rate: parseFloat(document.getElementById('cfg-lr').value),
    lora_rank: parseInt(document.getElementById('cfg-rank').value),
    quantization: document.getElementById('cfg-quant').value,
    wandb: document.getElementById('cfg-wandb').checked,
    privacy_mode: document.getElementById('cfg-privacy').checked,
  };
  
  const payload = { config };
  if (state.currentDatasetId) payload.dataset_id = state.currentDatasetId;
  
  const data = await api('/api/finetune/start-training', { method: 'POST', body: JSON.stringify(payload) });
  if (data.job_id) {
    state.activeJob = data.job_id;
    state.jobs.push(data);
    document.getElementById('job-status-badge').style.display = '';
    document.getElementById('job-status-badge').textContent = 'RUNNING';
    document.getElementById('job-status-badge').className = 'badge badge-cyan';
    notify(`Job ${data.job_id} started!`, 'success');
    pollJobStatus(data.job_id);
  }
}

function pollJobStatus(jobId) {
  const interval = setInterval(async () => {
    const data = await api(`/api/finetune/job/${jobId}`);
    if (!data || data.status === 'not_found') { clearInterval(interval); return; }
    
    const pct = data.progress || 0;
    const pgEl = document.getElementById('main-progress');
    const pctEl = document.getElementById('progress-pct');
    const badge = document.getElementById('job-status-badge');
    if (pgEl) pgEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (badge) {
      badge.textContent = data.status.toUpperCase();
      badge.className = `badge ${data.status === 'completed' ? 'badge-green' : data.status === 'running' ? 'badge-cyan' : 'badge-red'}`;
    }
    
    // Update chart
    if (state.trainingChart && data.metrics) {
      const m = data.metrics;
      state.trainingChart.data.labels = m.steps || [];
      state.trainingChart.data.datasets[0].data = m.train_loss || [];
      state.trainingChart.data.datasets[1].data = m.eval_loss || [];
      state.trainingChart.update('none');
    }
    
    // Terminal logs
    const logEl = document.getElementById('training-log');
    if (logEl && data.logs) {
      logEl.innerHTML = data.logs.slice(-20).map(l => `<div class="log-line">${l}</div>`).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
    
    if (data.status === 'completed' || data.status === 'cancelled') {
      clearInterval(interval);
      if (data.status === 'completed') {
        notify('Training complete! 🎉', 'success');
        if (data.summary) {
          const logEl2 = document.getElementById('training-log');
          if (logEl2) logEl2.innerHTML += `<div class="log-line" style="color:var(--accent2);margin-top:8px">// ${data.summary.replace(/\n/g, ' ')}</div>`;
        }
      }
    }
  }, 1500);
}

async function cancelJob() {
  if (!state.activeJob) return;
  await api(`/api/finetune/job/${state.activeJob}`, { method: 'DELETE' });
  notify('Job cancellation requested', 'info');
}

function downloadModel() {
  notify('Export functionality requires GPU machine with Unsloth installed', 'info');
}

function viewJob(jobId) {
  state.activeJob = jobId;
  navigate('finetune');
}

// ── CHAT PAGE ─────────────────────────────────────
function renderChat() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2" style="height:calc(100vh - 160px)">
      <div style="display:flex;flex-direction:column;height:100%">
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div class="card-header" style="flex-shrink:0">
            <div class="card-title">💬 AI Playground</div>
            <div style="display:flex;gap:8px;align-items:center">
              <select id="chat-domain" style="width:auto;font-size:12px;padding:5px 10px" onchange="state.chatDomain=this.value;updateSystemPreview()">
                <option value="general">🌐 General</option>
                <option value="mental_wellness">🧠 Mental Wellness</option>
                <option value="legal">⚖️ Legal Research</option>
                <option value="code">💻 Code Assistant</option>
              </select>
              <button class="btn btn-sm btn-secondary" onclick="clearChat()">Clear</button>
            </div>
          </div>
          <div class="chat-messages" id="chat-messages">
            <div class="chat-msg assistant">
              <div class="chat-avatar">🤖</div>
              <div class="chat-bubble">Hello! I'm TuneLab AI running <strong>llama-3.3-70b-versatile</strong> via Groq. Select a domain above and ask me anything — I'm optimized for mental wellness, legal research, and code.</div>
            </div>
          </div>
          <div class="chat-input-area" style="flex-shrink:0">
            <textarea class="chat-input" id="chat-input" placeholder="Ask anything... (Shift+Enter for newline)" onkeydown="handleChatKey(event)" rows="1"></textarea>
            <button class="btn btn-primary" onclick="sendChat()" style="align-self:flex-end">Send ↑</button>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-header"><div class="card-title">🔧 System Prompt</div><span class="badge badge-purple">Editable</span></div>
          <textarea id="system-prompt-input" style="height:120px;font-family:var(--font-mono);font-size:11px" placeholder="Custom system prompt (leave blank for default)..."></textarea>
          <button class="btn btn-sm btn-secondary" style="margin-top:8px" onclick="generateSystemPrompt()">✨ AI-Generate Prompt</button>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">🎛️ Parameters</div></div>
          <div class="form-group">
            <label class="label">Temperature: <span id="temp-val">0.7</span></label>
            <input type="range" min="0" max="2" step="0.1" value="0.7" oninput="document.getElementById('temp-val').textContent=parseFloat(this.value).toFixed(1)" id="chat-temp">
          </div>
          <div class="form-group" style="display:flex;align-items:center;justify-content:space-between">
            <label class="label" style="margin:0">Streaming</label>
            <label class="toggle"><input type="checkbox" id="chat-streaming" checked><span class="toggle-slider"></span></label>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">💡 Quick Prompts</div></div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${[
              ['🧠','Analyze sentiment in this text: "I feel overwhelmed lately"'],
              ['⚖️','Summarize key principles of contract law'],
              ['💻','Write a Python async FastAPI endpoint with auth'],
              ['📊','What fine-tuning strategy should I use for a 7B model?'],
            ].map(([icon, prompt]) => `
              <button class="btn btn-secondary btn-sm" style="text-align:left;justify-content:flex-start" onclick="quickPrompt(${JSON.stringify(prompt)})">
                ${icon} <span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${prompt}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

function quickPrompt(text) {
  document.getElementById('chat-input').value = text;
  sendChat();
}

function clearChat() {
  state.chatHistory = [];
  const msgs = document.getElementById('chat-messages');
  if (msgs) msgs.innerHTML = `<div class="chat-msg assistant"><div class="chat-avatar">🤖</div><div class="chat-bubble">Chat cleared. Ready for a new conversation!</div></div>`;
}

async function generateSystemPrompt() {
  const domain = document.getElementById('chat-domain').value;
  const btn = event.target;
  btn.textContent = '⏳ Generating...';
  const data = await api('/api/generate-system-prompt', { method: 'POST', body: JSON.stringify({ domain, task: 'general assistance' }) });
  if (data.system_prompt) {
    document.getElementById('system-prompt-input').value = data.system_prompt;
    notify('System prompt generated!', 'success');
  }
  btn.textContent = '✨ AI-Generate Prompt';
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  
  input.value = '';
  state.chatHistory.push({ role: 'user', content: text });
  
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML += `<div class="chat-msg user"><div class="chat-avatar">👤</div><div class="chat-bubble">${escHtml(text)}</div></div>`;
  
  const assistantDiv = document.createElement('div');
  assistantDiv.className = 'chat-msg assistant';
  assistantDiv.innerHTML = `<div class="chat-avatar">🤖</div><div class="chat-bubble" id="streaming-bubble"><span class="blink">▌</span></div>`;
  msgs.appendChild(assistantDiv);
  msgs.scrollTop = msgs.scrollHeight;
  
  const streaming = document.getElementById('chat-streaming')?.checked ?? true;
  const temperature = parseFloat(document.getElementById('chat-temp')?.value || '0.7');
  const systemPrompt = document.getElementById('system-prompt-input')?.value || null;
  
  const payload = { messages: state.chatHistory, domain: state.chatDomain, temperature, streaming, system_prompt: systemPrompt || undefined };
  
  const bubble = document.getElementById('streaming-bubble');
  
  if (streaming) {
    let fullText = '';
    try {
      const response = await fetch(`${API}/api/chat`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') break;
            fullText += d;
            bubble.innerHTML = formatChatText(fullText) + '<span class="blink">▌</span>';
            msgs.scrollTop = msgs.scrollHeight;
          }
        }
      }
      bubble.innerHTML = formatChatText(fullText);
      state.chatHistory.push({ role: 'assistant', content: fullText });
    } catch (e) {
      bubble.innerHTML = `<span style="color:var(--danger)">Error: ${e.message}</span>`;
    }
  } else {
    const data = await api('/api/chat', { method: 'POST', body: JSON.stringify({...payload, streaming: false}) });
    const resp = data.response || 'No response';
    bubble.innerHTML = formatChatText(resp);
    state.chatHistory.push({ role: 'assistant', content: resp });
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function formatChatText(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(108,99,255,0.15);padding:2px 5px;border-radius:4px">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── EVALUATE PAGE ─────────────────────────────────
function renderEvaluate() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">🧪 Manual Evaluation</div></div>
        <div class="form-group">
          <label class="label">Domain</label>
          <select id="eval-domain">
            <option value="general">General</option>
            <option value="mental_wellness">Mental Wellness</option>
            <option value="legal">Legal</option>
            <option value="code">Code</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Question / Prompt</label>
          <textarea id="eval-question" placeholder="Enter test question..."></textarea>
        </div>
        <div class="form-group">
          <label class="label">Model Response</label>
          <textarea id="eval-response" placeholder="Paste model response to evaluate..."></textarea>
        </div>
        <div class="form-group">
          <label class="label">Expected Answer (optional)</label>
          <textarea id="eval-expected" placeholder="Leave blank for general quality eval..." style="min-height:60px"></textarea>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="runEval()">🔍 Evaluate with Groq</button>
      </div>

      <div>
        <div class="card" id="eval-results" style="display:none">
          <div class="card-header"><div class="card-title">📊 Evaluation Results</div><span class="badge badge-cyan">AI-Scored</span></div>
          <div id="eval-scores"></div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">🏆 Auto-Benchmark</div></div>
          <div class="form-group">
            <label class="label">Domain</label>
            <select id="bench-domain">
              <option value="general">General</option>
              <option value="mental_wellness">Mental Wellness</option>
              <option value="legal">Legal Research</option>
              <option value="code">Code Generation</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="runBenchmark()">⚡ Run Auto-Benchmark</button>
          <div id="benchmark-results" style="margin-top:16px"></div>
        </div>
      </div>
    </div>
  `;
}

async function runEval() {
  const payload = {
    question: document.getElementById('eval-question').value,
    response: document.getElementById('eval-response').value,
    expected: document.getElementById('eval-expected').value || null,
    domain: document.getElementById('eval-domain').value,
  };
  if (!payload.question || !payload.response) { notify('Question and response are required', 'error'); return; }
  
  const btn = event.target;
  btn.textContent = '⏳ Evaluating...';
  const data = await api('/api/evaluate/evaluate', { method: 'POST', body: JSON.stringify(payload) });
  btn.textContent = '🔍 Evaluate with Groq';
  
  if (data.error) { notify(data.error, 'error'); return; }
  
  const card = document.getElementById('eval-results');
  const scores = document.getElementById('eval-scores');
  card.style.display = 'block';
  
  const metrics = ['accuracy', 'clarity', 'completeness', 'domain_expertise'];
  scores.innerHTML = `
    <div class="grid-2" style="gap:12px;margin-bottom:16px">
      ${metrics.map(m => {
        const val = data[m] || 7;
        const pct = (val / 10) * 100;
        return `
          <div style="background:var(--bg3);border-radius:10px;padding:12px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:12px;color:var(--text3)">${m.replace('_',' ').toUpperCase()}</span>
              <span style="font-family:var(--font-mono);font-size:14px;color:var(--accent2)">${val}/10</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${val>=8?'var(--success)':val>=5?'var(--accent)':'var(--danger)'}"></div></div>
          </div>
        `;
      }).join('')}
    </div>
    ${data.feedback ? `<div style="font-size:13px;color:var(--text2);line-height:1.6;background:var(--bg3);padding:12px;border-radius:10px">${data.feedback}</div>` : ''}
  `;
  notify('Evaluation complete!', 'success');
}

async function runBenchmark() {
  const domain = document.getElementById('bench-domain').value;
  const btn = event.target;
  btn.textContent = '⏳ Running...';
  const data = await api('/api/evaluate/benchmark', { method: 'POST', body: JSON.stringify({ domain }) });
  btn.textContent = '⚡ Run Auto-Benchmark';
  
  const el = document.getElementById('benchmark-results');
  if (data.results) {
    el.innerHTML = `
      <div style="background:var(--bg3);border-radius:10px;padding:14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text2)">${domain} benchmark</span>
        <span style="font-family:var(--font-mono);font-size:22px;color:var(--success)">${data.average_score}/10</span>
      </div>
      ${data.results.map((r,i) => `
        <div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:8px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:4px">Test ${i+1}: ${escHtml(r.question?.slice(0,80) || '')}...</div>
          <div style="display:flex;gap:8px;margin-top:6px">
            ${['accuracy','clarity'].map(k => `<span class="badge badge-purple">${k}: ${r.scores?.[k] || 7}/10</span>`).join('')}
          </div>
        </div>
      `).join('')}
    `;
    notify(`Benchmark done! Avg score: ${data.average_score}/10`, 'success');
  }
}

// ── DEPLOY PAGE ───────────────────────────────────
function renderDeploy() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">🚀 Deploy Configuration</div></div>
        <div class="form-group">
          <label class="label">Target Platform</label>
          <select id="deploy-platform">
            <option value="docker">🐳 Docker Container</option>
            <option value="huggingface">🤗 HuggingFace Space</option>
            <option value="kubernetes">☸️ Kubernetes Pod</option>
            <option value="fastapi">⚡ FastAPI + Gradio</option>
            <option value="edge">📱 Edge Device (ONNX)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Job ID (optional)</label>
          <input type="text" id="deploy-job-id" placeholder="Leave blank for latest job">
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateDeployConfig()">⚙️ Generate Config</button>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">📦 Export Formats</div></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            ['LoRA Adapter (.bin)', '~50 MB', 'badge-purple'],
            ['Merged GGUF Q4_K_M', '~4 GB', 'badge-cyan'],
            ['ONNX Export', '~7 GB', 'badge-green'],
            ['TensorFlow Lite', '~2 GB', 'badge-yellow'],
            ['HuggingFace Hub Push', 'Hosted', 'badge-red'],
          ].map(([name, size, badge]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg3);border-radius:10px;padding:10px 14px">
              <span style="font-size:13px">${name}</span>
              <div style="display:flex;gap:8px;align-items:center">
                <span class="badge ${badge}">${size}</span>
                <button class="btn btn-sm btn-secondary" onclick="notify('Export requires GPU machine with model trained','info')">Export</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="card" id="deploy-config-card" style="display:none">
      <div class="card-header"><div class="card-title">📋 Generated Config</div><button class="btn btn-sm btn-secondary" onclick="copyDeployConfig()">Copy</button></div>
      <div class="terminal" id="deploy-config-output" style="height:300px;color:var(--accent2)"></div>
    </div>
  `;
}

async function generateDeployConfig() {
  const platform = document.getElementById('deploy-platform').value;
  const jobId = document.getElementById('deploy-job-id').value;
  const btn = event.target;
  btn.textContent = '⏳ Generating...';
  
  const data = await api('/api/deploy/generate-deploy-config', { method: 'POST', body: JSON.stringify({ platform, job_id: jobId || state.activeJob }) });
  btn.textContent = '⚙️ Generate Config';
  
  const card = document.getElementById('deploy-config-card');
  const output = document.getElementById('deploy-config-output');
  card.style.display = 'block';
  if (data.config) {
    output.innerHTML = data.config.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
    notify('Deploy config generated!', 'success');
  }
}

function copyDeployConfig() {
  const text = document.getElementById('deploy-config-output')?.innerText;
  if (text) { navigator.clipboard.writeText(text); notify('Copied to clipboard!', 'success'); }
}

// ── MONITOR PAGE ──────────────────────────────────
function renderMonitor() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><div class="card-title">💻 System Resources</div><span class="badge badge-green" id="monitor-live">● LIVE</span></div>
        <div id="monitor-metrics" style="display:flex;flex-direction:column;gap:10px">
          <div style="color:var(--text3);font-size:13px">Loading metrics...</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">📋 Active Jobs</div></div>
        <div id="monitor-jobs"></div>
      </div>
    </div>
  `;
  
  async function refreshMonitor() {
    const data = await api('/api/system');
    const el = document.getElementById('monitor-metrics');
    if (el && data.cpu_percent !== undefined) {
      const metrics = [
        ['CPU', data.cpu_percent, '%', 'var(--accent)'],
        ['RAM', data.ram_percent, '%', 'var(--accent2)'],
        ['Disk', Math.round(data.disk_used_gb / data.disk_total_gb * 100), '%', 'var(--accent3)'],
      ];
      el.innerHTML = metrics.map(([name, val, unit, color]) => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:var(--text3)">${name}</span>
            <span style="font-family:var(--font-mono);color:${color}">${val}${unit}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${val}%;background:${color}"></div></div>
        </div>
      `).join('') + `
        <div style="font-size:12px;color:var(--text3);margin-top:8px">
          RAM: ${data.ram_used_gb}/${data.ram_total_gb} GB &nbsp;|&nbsp; Disk: ${data.disk_used_gb}/${data.disk_total_gb} GB
        </div>
        ${data.gpu ? `<div style="background:var(--bg3);border-radius:10px;padding:10px;margin-top:8px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">GPU</div>
          <div style="font-family:var(--font-mono);font-size:13px;color:var(--success)">Util: ${data.gpu.util}% | VRAM: ${data.gpu.mem_used}/${data.gpu.mem_total} MB | ${data.gpu.temp}°C</div>
        </div>` : `<div style="color:var(--text3);font-size:12px;margin-top:8px">No GPU detected (running on CPU)</div>`}
      `;
    }
    const jobsEl = document.getElementById('monitor-jobs');
    const jobs = await api('/api/finetune/jobs');
    if (jobsEl && Array.isArray(jobs)) {
      jobsEl.innerHTML = jobs.length === 0
        ? '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px">No jobs running</div>'
        : jobs.map(j => `
          <div style="background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-family:var(--font-mono);font-size:11px">${j.job_id}</span>
              <span class="badge ${j.status === 'completed' ? 'badge-green' : j.status === 'running' ? 'badge-cyan' : 'badge-yellow'}">${j.status}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${j.progress}%"></div></div>
          </div>
        `).join('');
    }
  }
  refreshMonitor();
  const id = setInterval(refreshMonitor, 3000);
  state._monitorInterval = id;
}

// ─── BOOTSTRAP ────────────────────────────────────
function initApp() {
  initParticles();

  document.getElementById('app').innerHTML = `
    <div class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-text">TuneLab</div>
        <div class="logo-sub">LLM FINE-TUNING STUDIO</div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-label">WORKSPACE</div>
          ${[
            ['dashboard','🏠','Mission Control'],
            ['finetune','⚡','Fine-Tune Engine'],
            ['chat','💬','AI Playground'],
          ].map(([page, icon, label]) => `
            <div class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}" onclick="navigate('${page}')">
              <span class="nav-icon">${icon}</span>${label}
            </div>
          `).join('')}
        </div>
        <div class="nav-section">
          <div class="nav-section-label">ANALYSIS</div>
          ${[
            ['evaluate','📊','Evaluation Suite'],
            ['deploy','🚀','Deploy & Export'],
            ['monitor','📡','System Monitor'],
          ].map(([page, icon, label]) => `
            <div class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}" onclick="navigate('${page}')">
              <span class="nav-icon">${icon}</span>${label}
            </div>
          `).join('')}
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="system-badge" id="sys-badge">
          <div class="metric-row"><span>Loading...</span></div>
        </div>
      </div>
    </div>
    <div class="main">
      <div class="topbar">
        <div class="page-title" id="page-title">Mission Control</div>
        <div class="topbar-right">
          <div class="model-badge">llama-3.3-70b-versatile</div>
          <div class="status-dot" title="API Connected"></div>
        </div>
      </div>
      <div class="content" id="content"></div>
    </div>
  `;

  navigate('dashboard');
  refreshSystemMetrics();
}

// Load Chart.js then init
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
script.onload = () => initApp();
document.head.appendChild(script);
