const API_BASE_URL = 'http://127.0.0.1:8000';

const languageInput = document.getElementById('language');
const codeInput = document.getElementById('code');
const requirementsInput = document.getElementById('requirements');
const analyzeBtn = document.getElementById('analyzeBtn');
const statusBox = document.getElementById('statusBox');
const summaryCard = document.getElementById('summaryCard');
const findingsContainer = document.getElementById('findings');
const correctionsContainer = document.getElementById('corrections');

function setStatus(message, state = 'neutral') {
  statusBox.textContent = message;
  statusBox.className = `status-box ${state}`;
}

function renderSummary(data) {
  summaryCard.innerHTML = `
    <h3>Summary</h3>
    <p>${data.summary}</p>
    <p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(0)}%</p>
    <p><strong>Language:</strong> ${data.language}</p>
  `;
}

function renderFindings(findings) {
  if (!findings || findings.length === 0) {
    findingsContainer.innerHTML = '<div class="finding-item"><h4>No findings</h4><p>No issues were flagged in the initial review.</p></div>';
    return;
  }

  findingsContainer.innerHTML = findings.map((item) => `
    <div class="finding-item">
      <div class="finding-meta">${item.category}</div>
      <span class="severity-badge severity-${item.severity}">${item.severity}</span>
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <p><strong>Evidence:</strong> ${item.evidence}</p>
      <p><strong>Status:</strong> ${item.status}</p>
    </div>
  `).join('');
}

function renderCorrections(corrections) {
  if (!corrections || corrections.length === 0) {
    correctionsContainer.innerHTML = '';
    return;
  }

  correctionsContainer.innerHTML = corrections.map((item) => `
    <div class="correction-box">
      <h3>Suggested Fix</h3>
      <p>${item.summary}</p>
      <pre>${item.code}</pre>
    </div>
  `).join('');
}

async function analyzeCode() {
  const payload = {
    language: languageInput.value,
    code: codeInput.value,
    requirements: requirementsInput.value,
  };

  setStatus('Analyzing code...', 'neutral');
  analyzeBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errorBody.detail || 'Request failed');
    }

    const data = await response.json();
    renderSummary(data);
    renderFindings(data.findings);
    renderCorrections(data.corrections);

    const statusState = data.status === 'success' ? 'success' : 'warning';
    setStatus(`Analysis complete: ${data.status}`, statusState);
  } catch (error) {
    setStatus(`Error: ${error.message}`, 'warning');
    summaryCard.innerHTML = '<h3>Summary</h3><p>Analysis could not be completed.</p>';
    findingsContainer.innerHTML = '';
    correctionsContainer.innerHTML = '';
  } finally {
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener('click', analyzeCode);
