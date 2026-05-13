// wwwroot/js/chat.js – COMPLETE chat‑ui logic (no missing functions)

// ── Mermaid initialisation ─────────────────────────────────
mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
});

// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
let curSession = null;
let curModel = '';
let attachedFiles = [];
let pathAttachments = [];
let isRec = false;
let recog = null;
let totalTok = 0;
let isLoadingSession = false;
let modelParameters = {};
let sending = false;
let activeProfile = 'default';
let wsCurrentPath = '';
let wsSelectedFiles = [];

// ════════════════════════════════════════════════════════
//  OUTPUT PROFILES
// ════════════════════════════════════════════════════════
const OUTPUT_PROFILES = {
    default: { label: 'Default', icon: '📝' },
    coder: { label: 'Coder', icon: '💻' },
    reasoning: { label: 'Reasoning', icon: '🧠' },
    creative: { label: 'Creative', icon: '✨' },
    analyst: { label: 'Analyst', icon: '📊' },
};

function setProfile(p) {
    activeProfile = p;
    const pi = document.getElementById('profileIndicator');
    if (pi) {
        const prof = OUTPUT_PROFILES[p];
        pi.textContent = prof ? prof.icon + ' ' + prof.label : '';
    }
    const sel = document.getElementById('paramProfile');
    if (sel && sel.value !== p) sel.value = p;
}

// ════════════════════════════════════════════════════════
//  MODEL CATALOG
// ════════════════════════════════════════════════════════
const MODEL_CATALOG = {
    'gemini-3-flash-preview:cloud': { name: '✨ Gemini 3 Flash', icon: '✨', provider: 'Google / Ollama Cloud', desc: 'Google Gemini 3 Flash – fast multimodal cloud model', vis: true, web: true, tools: true, code: true, rea: false, ctx: 1000000, bestFor: 'Fast responses, vision, long context', temp: 0.70, topP: 0.90, maxTok: 4096, outputProfile: 'default' },
    'gpt-oss:120b-cloud': { name: '🟢 GPT-OSS 120B', icon: '🟢', provider: 'OpenAI OSS / Ollama Cloud', desc: 'OpenAI open-source 120B model via Ollama Cloud', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'General purpose, coding, instruction following', temp: 0.70, topP: 0.90, maxTok: 4096, outputProfile: 'reasoning' },
    'mistral-large-3:675b-cloud': { name: '💨 Mistral Large 3 675B', icon: '💨', provider: 'Mistral / Ollama Cloud', desc: 'Mistral Large 3 flagship 675B parameter model', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Complex reasoning, code, multilingual', temp: 0.70, topP: 0.90, maxTok: 8192, outputProfile: 'coder' },
    'deepseek-v3.2:cloud': { name: '🔭 DeepSeek V3.2', icon: '🔭', provider: 'DeepSeek / Ollama Cloud', desc: 'DeepSeek V3.2 – latest flagship, strong at code & math', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Math, code, logic, science', temp: 0.60, topP: 0.95, maxTok: 8192, outputProfile: 'reasoning' },
    'deepseek-v4-flash:cloud': { name: '⚡ DeepSeek V4 Flash', icon: '⚡', provider: 'DeepSeek / Ollama Cloud', desc: 'DeepSeek V4 Flash – extremely fast and efficient model', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Speed, code, quick reasoning', temp: 0.60, topP: 0.95, maxTok: 4096, outputProfile: 'coder' },
    'nemotron-3-super:cloud': { name: '🚀 Nemotron 3 Super', icon: '🚀', provider: 'NVIDIA / Ollama Cloud', desc: 'NVIDIA Nemotron 3 Super – advanced reasoning & code', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Complex reasoning, code, math', temp: 0.60, topP: 0.90, maxTok: 4096, outputProfile: 'reasoning' },
    'qwen3.5:397b-cloud': { name: '🧠 Qwen 3.5 (397B)', icon: '🧠', provider: 'Alibaba / Ollama Cloud', desc: 'Qwen 3.5 ultra-large 397B flagship – best quality', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Long context, multilingual, research', temp: 0.70, topP: 0.90, maxTok: 4096, outputProfile: 'analyst' },
    'qwen3.5:cloud': { name: '⚡ Qwen 3.5', icon: '⚡', provider: 'Alibaba / Ollama Cloud', desc: 'Qwen 3.5 fast and capable – best everyday model', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Code, math, multilingual tasks', temp: 0.70, topP: 0.90, maxTok: 4096, outputProfile: 'default' },
    'qwen3-coder-next:cloud': { name: '💻 Qwen3 Coder Next', icon: '💻', provider: 'Alibaba / Ollama Cloud', desc: 'Qwen3 Coder Next – specialised for software development', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Code generation, debugging, refactoring', temp: 0.30, topP: 0.90, maxTok: 8192, outputProfile: 'coder' },
    'qwen3-coder:480b-cloud': { name: '💻 Qwen3 Coder 480B', icon: '💻', provider: 'Alibaba / Ollama Cloud', desc: 'Qwen3 Coder 480B – massive code specialist', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Complex software engineering, large refactors', temp: 0.30, topP: 0.90, maxTok: 8192, outputProfile: 'coder' },
    'qwen3-vl:235b-cloud': { name: '👁 Qwen3 VL 235B', icon: '👁', provider: 'Alibaba / Ollama Cloud', desc: 'Qwen3 Vision-Language 235B – image understanding', vis: true, web: false, tools: false, code: false, rea: false, ctx: 32000, bestFor: 'Image analysis, OCR, visual Q&A', temp: 0.70, topP: 0.90, maxTok: 2048, outputProfile: 'default' },
    'qwen3-vl:235b-instruct-cloud': { name: '👁 Qwen3 VL 235B Instruct', icon: '👁', provider: 'Alibaba / Ollama Cloud', desc: 'Qwen3 VL 235B instruction-tuned – image & text', vis: true, web: false, tools: false, code: true, rea: false, ctx: 32000, bestFor: 'Image reasoning, instruction following', temp: 0.70, topP: 0.90, maxTok: 2048, outputProfile: 'default' },
    'kimi-k2-thinking:cloud': { name: '💭 Kimi K2 Thinking', icon: '💭', provider: 'Moonshot / Ollama Cloud', desc: 'Kimi K2 with extended chain-of-thought reasoning', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Deep thinking, math, science problems', temp: 0.60, topP: 0.95, maxTok: 8192, outputProfile: 'reasoning' },
    'kimi-k2:1t-cloud': { name: '💭 Kimi K2 1T', icon: '💭', provider: 'Moonshot / Ollama Cloud', desc: 'Kimi K2 1T – largest Moonshot model, exceptional reasoning', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Highest quality reasoning, research', temp: 0.60, topP: 0.95, maxTok: 8192, outputProfile: 'reasoning' },
    'glm-4.7:cloud': { name: '🔮 GLM 4.7', icon: '🔮', provider: 'Zhipu AI / Ollama Cloud', desc: 'GLM 4.7 – high-performance Chinese & English model', vis: true, web: true, tools: true, code: true, rea: false, ctx: 128000, bestFor: 'Chinese language, vision, general tasks', temp: 0.70, topP: 0.90, maxTok: 4096, outputProfile: 'default' },
    'gemma4:31b-cloud': { name: '💎 Gemma 4 (31B)', icon: '💎', provider: 'Google / Ollama Cloud', desc: 'Google Gemma 4 31B – efficient, vision-capable', vis: true, web: false, tools: true, code: true, rea: false, ctx: 128000, bestFor: 'General tasks, coding, image analysis', temp: 0.70, topP: 0.90, maxTok: 4096, outputProfile: 'default' },
    'cogito-2.1:671b-cloud': { name: '🧬 Cogito 2.1 (671B)', icon: '🧬', provider: 'Cogito / Ollama Cloud', desc: 'Cogito 2.1 – large scale reasoning and analysis model', vis: false, web: true, tools: true, code: true, rea: true, ctx: 128000, bestFor: 'Deep reasoning, analysis, research', temp: 0.60, topP: 0.90, maxTok: 8192, outputProfile: 'analyst' },
    'minimax-m2.7:cloud': { name: '🌟 MiniMax M2.7', icon: '🌟', provider: 'MiniMax / Ollama Cloud', desc: 'MiniMax M2.7 versatile conversation model', vis: false, web: true, tools: true, code: false, rea: false, ctx: 64000, bestFor: 'Conversation, creative writing, summarisation', temp: 0.80, topP: 0.90, maxTok: 4096, outputProfile: 'creative' },
};

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    loadBalance();
    applyTheme(localStorage.getItem('theme') || 'dark');
    populateStaticModels();
    loadOllamaModels();
    loadGroups();
    renderTemplateCards('all');

    const sel = document.getElementById('modelSelect');
    if (sel) {
        curModel = sel.value;
        if (curModel) onModelChange(curModel);
    }

    const firstSess = document.querySelector('.sess-item');
    if (firstSess) {
        const id = parseInt(firstSess.id.replace('sess-', ''));
        if (!isNaN(id)) loadSession(id);
    }

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'k') { e.preventDefault(); startNewChat(); }
        if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
        if (e.key === 'Escape') {
            document.getElementById('promptTemplatesModal').style.display = 'none';
            document.getElementById('groupSearchModal').style.display = 'none';
        }
    });

    const inp = document.getElementById('msgInput');
    if (inp) {
        inp.addEventListener('paste', () => {
            setTimeout(() => {
                const text = inp.value;
                const words = text.split(/[\s\n]+/);
                const url = words.find(w => w.startsWith('http://') || w.startsWith('https://'));
                if (url && !pathAttachments.find(p => p.value === url)) {
                    const label = url.replace(/^https?:\/\//, '').substring(0, 40) + (url.length > 45 ? '…' : '');
                    pathAttachments.push({ label, value: url, type: 'url' });
                    renderAttachPreview();
                }
            }, 10);
        });
    }
});

// ── Helper Functions ───────────────────────────────────
function escHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escAttr(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ════════════════════════════════════════════════════════
//  BALANCE
// ════════════════════════════════════════════════════════
async function loadBalance() {
    try {
        const r = await fetch('/Coin/Balance');
        const d = await r.json();
        document.getElementById('coinDisplay').textContent = d.balance;
        document.getElementById('statusBal').textContent = d.balance;
    } catch (e) { console.error('Balance error', e); }
}

// ════════════════════════════════════════════════════════
//  THEME / SIDEBAR / INFO PANEL
// ════════════════════════════════════════════════════════
function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
    mermaid.initialize({ theme: next === 'dark' ? 'dark' : 'default', startOnLoad: false, securityLevel: 'loose' });
}
function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
function toggleInfoPanel() { document.getElementById('modelInfoPanel').classList.toggle('open'); }

// ════════════════════════════════════════════════════════
//  STATIC MODELS + OLLAMA MODELS
// ════════════════════════════════════════════════════════
function populateStaticModels() {
    const sel = document.getElementById('modelSelect');
    Array.from(sel.options).forEach(opt => {
        if (!MODEL_CATALOG[opt.value]) sel.removeChild(opt);
    });
    const existing = new Set(Array.from(sel.options).map(o => o.value));
    Object.entries(MODEL_CATALOG).forEach(([id, m]) => {
        if (!existing.has(id)) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = m.name;
            sel.appendChild(opt);
        }
    });
}

async function loadOllamaModels() {
    try {
        const r = await fetch('/Chat/GetOllamaModels');
        if (!r.ok) return;
        const models = await r.json();
        if (!Array.isArray(models) || models.length === 0) return;
        const sel = document.getElementById('modelSelect');
        const prevVal = sel.value;
        const existing = new Set(Array.from(sel.options).map(o => o.value));
        models.forEach(m => {
            if (!existing.has(m.id)) {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name || m.id;
                sel.appendChild(opt);
            }
        });
        if (prevVal) sel.value = prevVal;
    } catch (e) { console.log('Using static model list'); }
}

function refreshModels() {
    const icon = document.getElementById('refreshIcon');
    icon.style.animation = 'spin 1s linear infinite';
    loadOllamaModels().finally(() => setTimeout(() => icon.style.animation = '', 1200));
}

// ════════════════════════════════════════════════════════
//  MODEL CHANGE
// ════════════════════════════════════════════════════════
async function onModelChange(id) {
    if (!id) return;
    curModel = id;
    const local = MODEL_CATALOG[id];
    if (local) {
        applyCapabilityBadges(local);
        const p = local.outputProfile || 'default';
        setProfile(p);
        renderModelInfo(id, local);
        document.getElementById('modelParams').style.display = 'block';
        loadModelParams(id, local);
    }
    try {
        const r = await fetch('/Chat/ModelInfo?modelId=' + encodeURIComponent(id));
        if (!r.ok) return;
        const m = await r.json();
        applyCapabilityBadges(m);
        renderModelInfo(id, m);
        document.getElementById('modelParams').style.display = 'block';
        loadModelParams(id, m);
    } catch (e) { /* use local data */ }
}

function applyCapabilityBadges(m) {
    document.getElementById('webBadge').style.display = (m.supportsWebSearch ?? m.web) ? 'inline-block' : 'none';
    document.getElementById('visBadge').style.display = (m.supportsVision ?? m.vis) ? 'inline-block' : 'none';
    document.getElementById('codBadge').style.display = (m.supportsCodeExecution ?? m.code) ? 'inline-block' : 'none';
    document.getElementById('reaBadge').style.display = (m.supportsReasoning ?? m.rea) ? 'inline-block' : 'none';
}

function renderModelInfo(id, m) {
    const info = document.getElementById('modelInfoContent');
    if (!info) return;
    const name = m.displayName || m.name || id;
    const icon = m.icon || '🤖';
    const prov = m.provider || 'Unknown';
    const desc = m.description || m.desc || '';
    const ctx = (m.maxContextTokens || m.ctx || 0).toLocaleString();
    const best = m.bestFor || '—';
    const sVis = m.supportsVision ?? m.vis ?? false;
    const sWeb = m.supportsWebSearch ?? m.web ?? false;
    const sTools = m.supportsTools ?? m.tools ?? false;
    const sCode = m.supportsCodeExecution ?? m.code ?? false;
    const sRea = m.supportsReasoning ?? m.rea ?? false;
    const sFiles = m.supportsFileUpload ?? m.vis ?? false;
    const prof = m.outputProfile || 'default';
    const profInfo = OUTPUT_PROFILES[prof] || OUTPUT_PROFILES.default;
    info.innerHTML = `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:2.2rem">${icon}</div>
      <div style="font-weight:700;margin-top:5px;font-size:.95rem">${escHtml(name)}</div>
      <div style="font-size:.7rem;color:var(--txt2);margin-top:2px">${escHtml(prov)}</div>
      <span class="profile-badge ${prof}">${profInfo.icon} ${profInfo.label}</span>
    </div>
    <p style="font-size:.78rem;color:var(--txt2)">${escHtml(desc)}</p>
    <div style="margin:8px 0 4px;font-size:.68rem;color:var(--txt2);text-transform:uppercase;letter-spacing:.5px">Capabilities</div>
    <div>
      <span class="cap-tag ${sVis ? 'yes' : 'no'}">${sVis ? '✅' : '❌'} Vision</span>
      <span class="cap-tag ${sWeb ? 'yes' : 'no'}">${sWeb ? '✅' : '❌'} Web</span>
      <span class="cap-tag ${sTools ? 'yes' : 'no'}">${sTools ? '✅' : '❌'} Tools</span>
      <span class="cap-tag ${sCode ? 'yes' : 'no'}">${sCode ? '✅' : '❌'} Code</span>
      <span class="cap-tag ${sRea ? 'yes' : 'no'}">${sRea ? '✅' : '❌'} Thinking</span>
      <span class="cap-tag ${sFiles ? 'yes' : 'no'}">${sFiles ? '✅' : '❌'} Files</span>
    </div>
    <div style="margin-top:10px;font-size:.78rem">
      <div><strong>Context:</strong> <span style="color:var(--txt2)">${ctx} tokens</span></div>
      <div style="margin-top:4px"><strong>Best for:</strong> <span style="color:var(--txt2)">${escHtml(best)}</span></div>
    </div>`;
}

// ════════════════════════════════════════════════════════
//  MODEL PARAMETERS
// ════════════════════════════════════════════════════════
function loadModelParams(modelId, modelData) {
    const saved = modelParameters[modelId] || {};
    const def = modelData || MODEL_CATALOG[modelId] || {};
    const set = (id, val, lbl, decimals) => {
        const el = document.getElementById(id);
        const la = document.getElementById(lbl);
        if (el) el.value = val;
        if (la) la.textContent = decimals === 0 ? Math.round(val) : Number(val).toFixed(decimals);
    };
    set('paramTemp', saved.temperature ?? def.temp ?? 0.70, 'tempVal', 2);
    set('paramTopP', saved.topP ?? def.topP ?? 0.90, 'topPVal', 2);
    set('paramMaxTok', saved.maxTokens ?? def.maxTok ?? 4096, 'maxTokVal', 0);
    set('paramCtxDepth', saved.contextDepth ?? 10, 'ctxDepthVal', 0);
    set('paramRepeatPen', saved.repeatPenalty ?? 1.10, 'repeatPenVal', 2);
    const sysPEl = document.getElementById('paramSysPrompt');
    if (sysPEl) sysPEl.value = saved.systemPrompt || '';
    const profSel = document.getElementById('paramProfile');
    const prof = saved.profile || def.outputProfile || 'default';
    if (profSel) profSel.value = prof;
    setProfile(prof);
}

function updateParamLabel(labelId, val, decimals) {
    const lbl = document.getElementById(labelId);
    if (lbl) lbl.textContent = decimals === 0 ? Math.round(val) : Number(val).toFixed(decimals);
}

function saveParams() {
    if (!curModel) return;
    const prof = document.getElementById('paramProfile')?.value || 'default';
    modelParameters[curModel] = {
        temperature: parseFloat(document.getElementById('paramTemp').value),
        topP: parseFloat(document.getElementById('paramTopP').value),
        maxTokens: parseInt(document.getElementById('paramMaxTok').value),
        contextDepth: parseInt(document.getElementById('paramCtxDepth').value),
        repeatPenalty: parseFloat(document.getElementById('paramRepeatPen').value),
        systemPrompt: document.getElementById('paramSysPrompt').value.trim() || undefined,
        profile: prof,
    };
    setProfile(prof);
    const btn = event.target;
    btn.textContent = '✓ Saved!';
    setTimeout(() => btn.textContent = '✓ Apply', 1500);
}

function resetParams() {
    const def = MODEL_CATALOG[curModel] || {};
    const set = (id, val, lbl, dec) => {
        const el = document.getElementById(id);
        const la = document.getElementById(lbl);
        if (el) el.value = val;
        if (la) la.textContent = dec === 0 ? Math.round(val) : Number(val).toFixed(dec);
    };
    set('paramTemp', def.temp || 0.70, 'tempVal', 2);
    set('paramTopP', def.topP || 0.90, 'topPVal', 2);
    set('paramMaxTok', def.maxTok || 4096, 'maxTokVal', 0);
    set('paramCtxDepth', 10, 'ctxDepthVal', 0);
    set('paramRepeatPen', 1.10, 'repeatPenVal', 2);
    const sysPEl = document.getElementById('paramSysPrompt');
    if (sysPEl) sysPEl.value = '';
    const prof = def.outputProfile || 'default';
    const profSel = document.getElementById('paramProfile');
    if (profSel) profSel.value = prof;
    setProfile(prof);
    if (curModel) delete modelParameters[curModel];
}

// ════════════════════════════════════════════════════════
//  FORMAT MESSAGE – Markdown via marked + DOMPurify
// ════════════════════════════════════════════════════════
function formatMsg(text) {
    if (!text) return '';

    marked.setOptions({
        gfm: true,
        breaks: true,
        sanitize: false,
        highlight: function (code, lang) {
            if (lang && Prism.languages[lang]) {
                try { return Prism.highlight(code, Prism.languages[lang], lang); }
                catch (e) { }
            }
            return code;
        }
    });

    let html = marked.parse(text);

    html = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'pre', 'code', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'div', 'span', 'svg', 'path', 'details', 'summary',
            'hr', 'sub', 'sup', 'del', 'ins', 'input', 'label'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'class', 'id', 'style', 'width', 'height', 'download']
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.querySelectorAll('pre > code.language-mermaid').forEach(cb => {
        const mermaidCode = cb.textContent.trim();
        const id = 'mmd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        const encoded = btoa(unescape(encodeURIComponent(mermaidCode)));
        const wrap = document.createElement('div');
        wrap.className = 'mermaid-wrap';
        wrap.innerHTML = `<div class="mermaid-diagram" id="${id}" data-mermaid="${encoded}">⏳ Rendering diagram…</div>`;
        cb.closest('pre').replaceWith(wrap);
    });
    html = tempDiv.innerHTML;

    const finalDiv = document.createElement('div');
    finalDiv.innerHTML = html;
    finalDiv.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (!src) return;
        const wrap = document.createElement('div');
        wrap.className = 'gen-img-wrap';
        wrap.innerHTML = `
      <img src="${src}" alt="${img.alt || ''}" class="chat-gen-img" loading="lazy" onclick="openImgModal('${src}')" />
      <div class="gen-img-actions">
        <a href="${src}" download="ai-image.jpg" class="img-act-btn">⬇ Download</a>
        <a href="${src}" target="_blank" class="img-act-btn">🔗 Open</a>
        <button class="img-act-btn" onclick="openImgModal('${src}')">🔍 Full Size</button>
      </div>`;
        img.replaceWith(wrap);
    });

    return finalDiv.innerHTML;
}

async function renderMermaidDiagrams(container) {
    if (!container || typeof mermaid === 'undefined') return;
    const diagrams = container.querySelectorAll('.mermaid-diagram[data-mermaid]');
    for (const el of diagrams) {
        try {
            const code = decodeURIComponent(escape(atob(el.dataset.mermaid)));
            const id = el.id + '-svg';
            const { svg } = await mermaid.render(id, code);
            el.innerHTML = svg;
        } catch (e) {
            el.innerHTML = `<div style="color:var(--err);font-size:.78rem;padding:6px">⚠️ Diagram error: ${escHtml(e.message)}</div>`;
        }
    }
}

// ════════════════════════════════════════════════════════
//  SEND MESSAGE
// ════════════════════════════════════════════════════════
async function sendMessage() {
    if (sending) return;
    sending = true;
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
        const input = document.getElementById('msgInput');
        const msg = input.value.trim();
        if (!msg && attachedFiles.length === 0 && pathAttachments.length === 0) return;

        if (!curSession) {
            await startNewChat();
            if (!curSession) { alert('Failed to create session'); return; }
        }

        const selectedModel = document.getElementById('modelSelect').value;
        const currentParams = modelParameters[selectedModel] || {};
        const attachLabels = [...attachedFiles.map(f => f.name), ...pathAttachments.map(p => p.label)].join(', ') || null;

        input.value = '';
        autoResize(input);
        document.getElementById('welcomeScreen')?.remove();
        addMsg('user', msg || '(attachment)', new Date().toISOString(), 0, 0, attachLabels, null, true);

        const hasImages = attachedFiles.some(f => f.type.startsWith('image/'));
        const hasFiles = attachedFiles.some(f => !f.type.startsWith('image/'));
        const hasUrls = pathAttachments.length > 0 || /https?:\/\//i.test(msg);
        const thinkId = showThinking(hasUrls, hasFiles, hasImages);

        const fd = new FormData();
        fd.append('SessionId', curSession);
        fd.append('Message', msg || '');
        fd.append('ModelId', selectedModel);
        if (currentParams.temperature != null) fd.append('Temperature', currentParams.temperature);
        if (currentParams.topP != null) fd.append('TopP', currentParams.topP);
        if (currentParams.maxTokens != null) fd.append('MaxTokens', currentParams.maxTokens);
        if (currentParams.contextDepth != null) fd.append('ContextDepth', currentParams.contextDepth);
        if (currentParams.repeatPenalty != null) fd.append('RepeatPenalty', currentParams.repeatPenalty);
        if (currentParams.systemPrompt) fd.append('SystemPrompt', currentParams.systemPrompt);
        if (pathAttachments.length > 0) fd.append('FilePaths', JSON.stringify(pathAttachments.map(p => p.value)));
        attachedFiles.forEach(f => fd.append('Attachments', f));

        attachedFiles = [];
        pathAttachments = [];
        wsSelectedFiles = [];
        renderAttachPreview();
        document.getElementById('imageInput').value = '';
        document.getElementById('fileInput').value = '';

        const r = await fetch('/Chat/Send', { method: 'POST', body: fd });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        removeThinking(thinkId);

        if (d.success) {
            const msgGrp = addMsg('bot', d.response, new Date().toISOString(), 0, d.tokensUsed, null, d.messageId, true);
            if (msgGrp) renderMermaidDiagrams(msgGrp);
            totalTok += (d.tokensUsed || 0);
            document.getElementById('coinDisplay').textContent = d.newBalance;
            document.getElementById('statusBal').textContent = d.newBalance;
            document.getElementById('statusTok').style.display = 'flex';
            document.getElementById('tokCount').textContent = totalTok.toLocaleString();
            document.getElementById('tokenStatus').textContent = `⚡ ${d.tokensUsed} tok | ${d.modelUsed || selectedModel}`;
            if (d.sessionName) {
                const snEl = document.querySelector(`#sess-${curSession} .sess-name`);
                if (snEl) snEl.textContent = d.sessionName;
                document.getElementById('sessNameStatus').textContent = d.sessionName;
            }
            document.getElementById('exportPdfBtn').style.display = 'inline-flex';
        } else {
            addError(d.error || 'The server returned an error. Please try again.');
        }
    } catch (err) {
        console.error('Send error:', err);
        const msg = err.message?.includes('Failed to fetch')
            ? '⚠️ Cannot reach server. Please check Ollama is running and try again.'
            : 'Network error – please check your connection and try again.';
        addError(msg);
    } finally {
        sendBtn.disabled = false;
        sending = false;
        scrollBot();
        document.getElementById('msgInput').focus();
    }
}

// ════════════════════════════════════════════════════════
//  SESSION MANAGEMENT
// ════════════════════════════════════════════════════════
async function startNewChat() {
    const modelId = document.getElementById('modelSelect').value;
    if (!modelId) { alert('Please select a model first.'); return; }
    try {
        const r = await fetch('/Chat/NewSession', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modelId }) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        curSession = d.sessionId;
        totalTok = 0;
        clearMsgs();
        setActiveSess(d.sessionId);
        const list = document.getElementById('sessionsList');
        const div = document.createElement('div');
        div.className = 'sess-item active';
        div.id = `sess-${d.sessionId}`;
        div.onclick = () => { if (!div.classList.contains('active')) loadSession(d.sessionId); };
        div.innerHTML = `<span style="font-size:.75rem;opacity:.5">💬</span><span class="sess-name">${escHtml(d.name)}</span><div class="sess-acts"><button class="sess-act" title="Add to group" onclick="event.stopPropagation();showAddToGroup(${d.sessionId})">📁</button><button class="sess-act" title="Rename" onclick="event.stopPropagation();renameSession(${d.sessionId},'${escAttr(d.name)}')">✏️</button><button class="sess-act" title="Delete" style="color:var(--err)" onclick="event.stopPropagation();deleteSession(${d.sessionId})">🗑</button></div>`;
        list.prepend(div);
        document.getElementById('statusSess').style.display = 'flex';
        document.getElementById('sessNameStatus').textContent = d.name;
        document.getElementById('statusTok').style.display = 'none';
        document.getElementById('exportPdfBtn').style.display = 'none';
        document.getElementById('msgInput').focus();
    } catch (err) { console.error(err); alert('Failed to create new chat session. Please try again.'); }
}

async function loadSession(id) {
    if (isLoadingSession) return;
    if (id === curSession && document.querySelectorAll('.msg-group').length > 0) { document.getElementById('msgInput').focus(); return; }
    isLoadingSession = true;
    const area = document.getElementById('msgsArea');
    area.innerHTML = Array(4).fill('<div class="skeleton-message"></div>').join('');
    try {
        clearMsgs(); setActiveSess(id); curSession = id;
        const r = await fetch(`/Chat/GetMessages?sessionId=${id}`);
        if (r.status === 403) return;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        if (d.session?.modelUsed) {
            const sel = document.getElementById('modelSelect');
            if (!Array.from(sel.options).some(o => o.value === d.session.modelUsed)) {
                const opt = document.createElement('option');
                opt.value = d.session.modelUsed;
                const cat = MODEL_CATALOG[d.session.modelUsed];
                opt.textContent = cat ? cat.name : d.session.modelUsed;
                sel.appendChild(opt);
            }
            sel.value = d.session.modelUsed;
            curModel = d.session.modelUsed;
            onModelChange(d.session.modelUsed);
        }
        totalTok = 0;
        document.getElementById('welcomeScreen')?.remove();
        if (d.messages && Array.isArray(d.messages)) {
            d.messages.forEach(m => {
                if (m.userMessage) addMsg('user', m.userMessage, m.createdAt, m.coinsUsed, 0, m.attachmentName, m.id, m.includeInContext ?? true);
                if (m.botResponse) {
                    const grp = addMsg('bot', m.botResponse, m.createdAt, 0, m.tokensUsed, null, m.id, m.includeInContext ?? true);
                    if (grp) renderMermaidDiagrams(grp);
                    totalTok += (m.tokensUsed || 0);
                }
            });
        }
        const name = d.session?.name || 'Session';
        document.getElementById('statusSess').style.display = 'flex';
        document.getElementById('sessNameStatus').textContent = name;
        if (totalTok > 0) { document.getElementById('statusTok').style.display = 'flex'; document.getElementById('tokCount').textContent = totalTok.toLocaleString(); }
        document.getElementById('exportPdfBtn').style.display = (d.messages?.length > 0) ? 'inline-flex' : 'none';
        document.getElementById('msgInput').focus();
    } catch (err) { console.error('loadSession error:', err); addError('Failed to load session.'); }
    finally { isLoadingSession = false; scrollBot(); }
}

function setActiveSess(id) {
    document.querySelectorAll('.sess-item').forEach(e => e.classList.remove('active'));
    document.getElementById(`sess-${id}`)?.classList.add('active');
}
function clearMsgs() { document.getElementById('msgsArea').innerHTML = ''; }
function showWelcome() {
    document.getElementById('msgsArea').innerHTML = '<div class="welcome"><div style="font-size:3rem">🤖</div><h2>AkkuChatbot</h2><p>Select a model and start a new chat.</p></div>';
}

async function renameSession(id, cur) {
    const name = prompt('Rename session:', cur);
    if (!name?.trim()) return;
    await fetch('/Chat/RenameSession', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id, name: name.trim() }) });
    const el = document.querySelector(`#sess-${id} .sess-name`);
    if (el) el.textContent = name.trim();
    if (curSession === id) document.getElementById('sessNameStatus').textContent = name.trim();
}
async function deleteSession(id) {
    if (!confirm('Delete this session permanently?')) return;
    await fetch('/Chat/DeleteSession', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id }) });
    document.getElementById(`sess-${id}`)?.remove();
    if (curSession === id) { curSession = null; clearMsgs(); showWelcome(); document.getElementById('statusSess').style.display = 'none'; document.getElementById('statusTok').style.display = 'none'; document.getElementById('exportPdfBtn').style.display = 'none'; document.getElementById('tokenStatus').textContent = ''; }
}
async function quickStart(text) {
    const sel = document.getElementById('modelSelect');
    if (!sel.value) { alert('Select a model first.'); return; }
    await startNewChat();
    if (!curSession) return;
    setTimeout(() => { document.getElementById('msgInput').value = text; autoResize(document.getElementById('msgInput')); sendMessage(); }, 200);
}

// ════════════════════════════════════════════════════════
//  MESSAGE RENDERING
// ════════════════════════════════════════════════════════
function addMsg(role, txt, time, coins, toks, attach, msgId, includeCtx) {
    const area = document.getElementById('msgsArea');
    if (!area) return null;
    const timestamp = time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let ctxHtml = '';
    if (msgId) {
        const incl = includeCtx !== false;
        const excCls = incl ? '' : ' excluded';
        ctxHtml = `<label class="ctx-toggle${excCls}" id="ctx-${msgId}" title="${incl ? 'Included in AI context – click to exclude' : 'Excluded from AI context – click to include'}"><input type="checkbox" ${incl ? 'checked' : ''} onchange="toggleContextCheckbox(${msgId}, this.checked, document.getElementById('ctx-${msgId}'))"><span>${incl ? 'In-ctx' : 'Excluded'}</span></label>`;
    }
    let attachHtml = '';
    if (attach) {
        const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(e => attach.toLowerCase().endsWith('.' + e));
        const isUrl = attach.startsWith('http://') || attach.startsWith('https://');
        const icon = isImg ? '🖼️' : isUrl ? '🌐' : '📎';
        attachHtml = `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1);font-size:.74rem;opacity:.8;display:flex;align-items:center;gap:5px"><span>${icon}</span><span style="word-break:break-all">${escHtml(attach)}</span></div>`;
    }
    const formattedMsg = formatMsg(txt);
    const grp = document.createElement('div');
    grp.className = 'msg-group';
    if (msgId) grp.dataset.msgId = msgId;
    grp.innerHTML = `<div class="msg-row ${role}"><div class="msg-bubble ${role}">${formattedMsg}${attachHtml}</div></div><div class="msg-actions ${role}"><span class="msg-time">${timestamp}</span>${coins ? `<span style="font-size:.67rem">🪙 ${coins}</span>` : ''}${toks ? `<span style="font-size:.67rem">⚡ ${toks.toLocaleString()} tok</span>` : ''}<button class="act-btn" onclick="copyMsgText(this)" title="Copy message"><i class="fa fa-copy"></i> Copy</button>${ctxHtml}</div>`;
    area.appendChild(grp);
    scrollBot();
    return grp;
}

function copyMsgText(btn) {
    const bubble = btn.closest('.msg-group')?.querySelector('.msg-bubble');
    if (!bubble) return;
    const text = bubble.innerText || bubble.textContent || '';
    navigator.clipboard.writeText(text).then(() => { const orig = btn.innerHTML; btn.innerHTML = '<i class="fa fa-check"></i> Copied!'; setTimeout(() => btn.innerHTML = orig, 1800); }).catch(() => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); });
}

// ════════════════════════════════════════════════════════
//  IMAGE FULLSCREEN MODAL
// ════════════════════════════════════════════════════════
function openImgModal(url) {
    document.getElementById('akkuImgModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'akkuImgModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;cursor:zoom-out;animation:fadeIn .2s ease';
    modal.innerHTML = `<div style="position:relative;max-width:92vw;max-height:92vh;display:flex;flex-direction:column;align-items:center;gap:12px"><img src="${url}" style="max-width:100%;max-height:82vh;border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,.7);object-fit:contain" alt="Full size image"/><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a href="${url}" download="ai-image.jpg" style="background:rgba(255,255,255,.95);color:#1a1a1a;padding:8px 18px;border-radius:8px;text-decoration:none;font-size:.84rem;font-weight:600">⬇ Download</a><a href="${url}" target="_blank" rel="noopener" style="background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);padding:8px 18px;border-radius:8px;text-decoration:none;font-size:.84rem;font-weight:600">🔗 Open in new tab</a><button onclick="document.getElementById('akkuImgModal').remove()" style="background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);padding:8px 18px;border-radius:8px;font-size:.84rem;cursor:pointer">✕ Close</button></div></div>`;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    const esc = e => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
    document.body.appendChild(modal);
}

// ════════════════════════════════════════════════════════
//  CONTEXT TOGGLE
// ════════════════════════════════════════════════════════
async function toggleContextCheckbox(msgId, include, labelEl) {
    try {
        const r = await fetch('/Chat/ToggleContext', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: msgId, include }) });
        const d = await r.json();
        if (d.success && labelEl) {
            if (include) { labelEl.classList.remove('excluded'); labelEl.title = 'Included in AI context – click to exclude'; labelEl.querySelector('span').textContent = 'In-ctx'; }
            else { labelEl.classList.add('excluded'); labelEl.title = 'Excluded from AI context – click to include'; labelEl.querySelector('span').textContent = 'Excluded'; }
        } else { const cb = labelEl?.querySelector('input'); if (cb) cb.checked = !include; }
    } catch (e) { const cb = labelEl?.querySelector('input'); if (cb) cb.checked = !include; }
}

// ════════════════════════════════════════════════════════
//  THINKING INDICATOR
// ════════════════════════════════════════════════════════
function showThinking(hasUrls, hasFiles, hasImages) {
    const id = 'think-' + Date.now();
    const area = document.getElementById('msgsArea');
    let label = 'Thinking…';
    if (hasImages) label = '👁 Analysing image…'; else if (hasUrls) label = '🌐 Fetching URL content…'; else if (hasFiles) label = '📄 Reading file…';
    area.insertAdjacentHTML('beforeend', `<div id="${id}" class="thinking-row"><div class="thinking-dots"><span></span><span></span><span></span></div><span id="${id}-lbl" style="font-size:.8rem;color:var(--txt2)">${label}</span></div>`);
    if (hasUrls || hasFiles || hasImages) { setTimeout(() => { const lbl = document.getElementById(id + '-lbl'); if (lbl) lbl.textContent = '🤖 Generating response…'; }, 4000); }
    scrollBot();
    return id;
}
function removeThinking(id) { document.getElementById(id)?.remove(); }

// ════════════════════════════════════════════════════════
//  ATTACHMENTS
// ════════════════════════════════════════════════════════
function handleAttachments(input) {
    Array.from(input.files).forEach(f => { if (!attachedFiles.find(x => x.name === f.name)) attachedFiles.push(f); });
    renderAttachPreview();
}
function renderAttachPreview() {
    const prev = document.getElementById('attachPreview');
    if (!prev) return;
    const fileChips = attachedFiles.map((f, i) => {
        const isImg = f.type.startsWith('image/');
        const sizeLbl = f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB';
        return `<div class="a-chip"><span>${isImg ? '🖼' : '📎'}</span><span title="${escHtml(f.name)}">${escHtml(f.name)}</span><span style="color:var(--txt2);font-size:.65rem">${sizeLbl}</span><button onclick="removeAttach(${i})" title="Remove">×</button></div>`;
    });
    const pathChips = pathAttachments.map((p, i) => {
        const icon = p.type === 'url' ? '🌐' : '📁';
        return `<div class="a-chip"><span>${icon}</span><span title="${escHtml(p.value)}">${escHtml(p.label)}</span><button onclick="removePathAttach(${i})" title="Remove">×</button></div>`;
    });
    prev.innerHTML = [...fileChips, ...pathChips].join('');
}
function removeAttach(i) { attachedFiles.splice(i, 1); renderAttachPreview(); }
function removePathAttach(i) { pathAttachments.splice(i, 1); renderAttachPreview(); }

function togglePathBar() {
    const bar = document.getElementById('pathBar');
    const btn = document.getElementById('pathToggleBtn');
    const show = bar.style.display === 'none';
    bar.style.display = show ? 'flex' : 'none';
    btn.classList.toggle('active', show);
    if (show) document.getElementById('pathInput').focus();
}
function addPathAttachment() {
    const inp = document.getElementById('pathInput');
    const val = inp.value.trim();
    if (!val) return;
    const isUrl = val.startsWith('http://') || val.startsWith('https://');
    const label = isUrl ? val.replace(/^https?:\/\//, '').substring(0, 40) + (val.length > 45 ? '…' : '') : val.split(/[\\/]/).pop() || val;
    pathAttachments.push({ label, value: val, type: isUrl ? 'url' : 'path' });
    inp.value = '';
    renderAttachPreview();
}

// ════════════════════════════════════════════════════════
//  OCR TRIGGER
// ════════════════════════════════════════════════════════
function triggerOCR() {
    const sel = document.getElementById('modelSelect');
    const ocrOpt = Array.from(sel.options).find(o => o.value.includes('ocr'));
    if (ocrOpt) { sel.value = ocrOpt.value; onModelChange(ocrOpt.value); document.getElementById('imageInput').click(); }
    else { alert('GLM-OCR model not found. Please select a vision model manually then attach an image.'); }
}

// ════════════════════════════════════════════════════════
//  VOICE INPUT
// ════════════════════════════════════════════════════════
function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { alert('Voice recognition not supported. Please use Chrome.'); return; }
    const btn = document.getElementById('voiceBtn');
    if (isRec) { if (recog) { recog.stop(); recog = null; } isRec = false; btn.classList.remove('rec'); btn.innerHTML = '<i class="fa fa-microphone"></i>'; return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = document.getElementById('voiceLang').value;
    let final = '';
    recog.onresult = e => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) final += t + ' '; else interim += t; }
        const inp = document.getElementById('msgInput'); inp.value = final + interim; autoResize(inp);
    };
    recog.onerror = recog.onend = () => { isRec = false; btn.classList.remove('rec'); btn.innerHTML = '<i class="fa fa-microphone"></i>'; };
    recog.start();
    isRec = true; btn.classList.add('rec'); btn.innerHTML = '<i class="fa fa-stop"></i>';
}

// ════════════════════════════════════════════════════════
//  PDF EXPORT
// ════════════════════════════════════════════════════════
function exportPDF() { if (curSession) window.open(`/Chat/ExportPdf?sessionId=${curSession}`, '_blank'); }

// ════════════════════════════════════════════════════════
//  KEYBOARD / RESIZE HELPERS
// ════════════════════════════════════════════════════════
function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px'; }
function scrollBot() { const a = document.getElementById('msgsArea'); if (a) a.scrollTop = a.scrollHeight; }
function addError(msg) { document.getElementById('msgsArea').insertAdjacentHTML('beforeend', `<div style="text-align:center;padding:8px"><span style="background:#3d1010;border:1px solid var(--err);color:var(--err);padding:5px 16px;border-radius:8px;font-size:.8rem;display:inline-block">⚠️ ${escHtml(msg)}</span></div>`); scrollBot(); }

// ════════════════════════════════════════════════════════
//  GROUPS MANAGEMENT
// ════════════════════════════════════════════════════════
// ஏற்கனவே உள்ள chat.js-ன் இந்த section-ஐ மட்டும் மாற்றவும் (Groups Management)
// மற்ற எல்லா code-ம் unchanged.

    // ════════════════════════════════════════════════════════
    //  GROUPS MANAGEMENT (முழுமையாக்கப்பட்டது)
    // ════════════════════════════════════════════════════════
    async function loadGroups() {
        try {
            const res = await fetch('/SessionGroups/Index');
            const groups = await res.json();
            const list = document.getElementById('groupsList');
            list.innerHTML = groups.map(g => `
          <div class="group-item" id="grp-${g.id}">
            <span>${g.icon || '📁'}</span>
            <span class="group-name" onclick="toggleGroupSessions(${g.id})" title="${escHtml(g.name)}">${escHtml(g.name)} <span style="opacity:.5;font-size:.7rem">(${g.memberCount})</span></span>
            <div class="group-acts">
              <button class="group-act" title="Search" onclick="event.stopPropagation();searchGroup(${g.id})">🔍</button>
              <button class="group-act" title="Rename" onclick="event.stopPropagation();renameGroup(${g.id},'${escAttr(g.name)}')">✏️</button>
              <button class="group-act" title="Delete" style="color:var(--err)" onclick="event.stopPropagation();deleteGroup(${g.id})">🗑</button>
            </div>
          </div>
          <div class="group-sessions" id="grp-sess-${g.id}"></div>
        `).join('');
        } catch (e) { console.error('loadGroups error', e); }
    }

    async function toggleGroupSessions(groupId) {
        const el = document.getElementById(`grp-sess-${groupId}`);
        if (!el) return;
        if (el.classList.contains('open')) { el.classList.remove('open'); return; }

        // Fetch sessions for this group
        try {
            const res = await fetch(`/SessionGroups/GetSessions?groupId=${groupId}`);
            const sessions = await res.json();
            el.innerHTML = sessions.length
                ? sessions.map(s => `
              <div class="group-sess-item" onclick="loadSession(${s.id})" title="${escHtml(s.name)}">
                <span>💬</span>
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(s.name)}</span>
                <button class="group-act" style="font-size:.72rem" onclick="event.stopPropagation();removeSessionFromGroup(${groupId}, ${s.id})" title="Remove from group">✕</button>
              </div>`).join('')
                : '<div style="padding:4px 8px;font-size:.74rem;color:var(--txt2)">No sessions in this group</div>';
        } catch (e) {
            el.innerHTML = '<div style="padding:4px 8px;font-size:.74rem;color:var(--err)">Failed to load</div>';
        }
        el.classList.add('open');
    }

    async function removeSessionFromGroup(groupId, sessionId) {
        if (!confirm('Remove this session from group?')) return;
        await fetch('/SessionGroups/RemoveSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, sessionId })
        });
        // Reload group sessions
        const el = document.getElementById(`grp-sess-${groupId}`);
        if (el && el.classList.contains('open')) toggleGroupSessions(groupId);
        loadGroups(); // update member count
    }

    function showGroupCreate() {
        const name = prompt('Group name:');
        if (!name) return;
        const icon = prompt('Icon (emoji):', '📁') || '📁';
        fetch('/SessionGroups/Create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, icon })
        }).then(() => loadGroups());
    }

    async function renameGroup(id, cur) {
        const name = prompt('New name:', cur);
        if (!name) return;
        await fetch('/SessionGroups/Rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: id, name })
        });
        loadGroups();
    }

    async function deleteGroup(id) {
        if (!confirm('Delete group? (sessions will not be deleted)')) return;
        await fetch('/SessionGroups/Delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: id })
        });
        loadGroups();
    }

    function showAddToGroup(sessionId) {
        fetch('/SessionGroups/Index').then(r => r.json()).then(groups => {
            if (!groups.length) { alert('No groups yet. Create a group first.'); return; }
            const menu = document.createElement('div');
            menu.style.cssText = 'position:fixed;background:var(--bg2);border:1px solid var(--bdr);border-radius:8px;padding:8px;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4);min-width:160px;';
            menu.innerHTML = `
          <div style="font-size:.72rem;color:var(--txt2);padding:2px 6px 6px;border-bottom:1px solid var(--bdr);margin-bottom:4px">Add to group</div>
          ${groups.map(g => `<div class="group-item" onclick="addSessionToGroup(${g.id},${sessionId});this.parentElement.remove();">${g.icon || '📁'} ${escHtml(g.name)}</div>`).join('')}`;
            const rect = event.target.getBoundingClientRect();
            menu.style.left = rect.left + 'px';
            menu.style.top = (rect.bottom + 4) + 'px';
            document.body.appendChild(menu);
            setTimeout(() => {
                document.addEventListener('click', function h(e) {
                    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', h); }
                });
            }, 10);
        });
    }

    async function addSessionToGroup(groupId, sessionId) {
        await fetch('/SessionGroups/AddSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId, sessionId })
        });
        loadGroups();
    }

    // ── Group-க்குள் தேடுதல் (Find Characters inside Group) ──
    async function searchGroup(groupId) {
        const query = prompt('Search within group (session name or message content):');
        if (query === null) return;
        try {
            const r = await fetch(`/SessionGroups/Search?groupId=${groupId}&query=${encodeURIComponent(query)}`);
            const results = await r.json();
            const modal = document.getElementById('groupSearchModal');
            const list = document.getElementById('searchResultsList');
            if (!results.length) {
                list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--txt2)">No results found for "<strong>${escHtml(query)}</strong>"</div>`;
            } else {
                list.innerHTML = results.map(r => `
            <div class="search-result-item" onclick="loadSession(${r.id});document.getElementById('groupSearchModal').style.display='none'">
              <div style="font-size:.78rem;font-weight:600;margin-bottom:3px">📂 ${escHtml(r.name)}</div>
              <div style="font-size:.74rem;color:var(--txt2)">${escHtml(r.snippet)}</div>
              <div style="font-size:.67rem;color:var(--txt2);margin-top:3px">${new Date(r.createdAt).toLocaleString()}</div>
            </div>`).join('');
            }
            modal.style.display = 'flex';
        } catch (e) { alert('Search failed: ' + e.message); }
    }

// ════════════════════════════════════════════════════════
//  WORKSPACE BROWSER
// ════════════════════════════════════════════════════════
function openWorkspaceBrowser(subPath) {
    document.getElementById('workspaceModal').style.display = 'flex';
    wsSelectedFiles = [];
    loadWorkspaceDir(subPath || wsCurrentPath || '');
}
async function loadWorkspaceDir(subPath) {
    wsCurrentPath = subPath;
    const res = await fetch(`/Workspace/Browse?subPath=${encodeURIComponent(subPath || '')}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }
    document.getElementById('workspaceBreadcrumb').innerText = '📂 ' + (data.currentPath || '/');
    const list = document.getElementById('workspaceList');
    list.innerHTML = data.items.map(item => `<div class="workspace-item ${item.type}" onclick="${item.type === 'folder' ? `loadWorkspaceDir('${escAttr(data.currentPath ? data.currentPath + '\\' + item.name : item.name)}')` : `toggleWorkspaceFile('${escAttr(data.currentPath ? data.currentPath + '\\' + item.name : item.name)}','${escAttr(item.name)}',this)`}"><span>${item.type === 'folder' ? '📁' : getFileIcon(item.ext)}</span><span style="flex:1">${escHtml(item.name)}</span>${item.type === 'file' ? `<span style="font-size:.68rem;color:var(--txt2)">${formatFileSize(item.size)}</span>` : ''}</div>`).join('');
}
function workspaceGoUp() {
    if (!wsCurrentPath) return;
    const parts = wsCurrentPath.split(/[\\/]/);
    parts.pop();
    loadWorkspaceDir(parts.join('\\'));
}
function toggleWorkspaceFile(fullPath, name, el) {
    const idx = wsSelectedFiles.findIndex(f => f.path === fullPath);
    if (idx >= 0) { wsSelectedFiles.splice(idx, 1); el.style.background = ''; }
    else { wsSelectedFiles.push({ path: fullPath, name }); el.style.background = 'rgba(47,129,247,0.15)'; }
    const cnt = document.getElementById('wsSelectedCount');
    const btn = document.getElementById('wsSendAllBtn');
    cnt.textContent = wsSelectedFiles.length ? `${wsSelectedFiles.length} selected` : '';
    btn.style.display = wsSelectedFiles.length ? 'flex' : 'none';
}
async function sendAllSelectedWorkspace() {
    for (const f of wsSelectedFiles) {
        const res = await fetch(`/Workspace/Read?filePath=${encodeURIComponent(f.path)}`);
        const data = await res.json();
        if (data.content) pathAttachments.push({ label: f.name, value: f.path, type: 'file' });
    }
    wsSelectedFiles = [];
    renderAttachPreview();
    document.getElementById('workspaceModal').style.display = 'none';
}
async function setWorkspacePath(path) {
    if (!path?.trim()) return;
    await fetch('/Workspace/SetPath', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) });
    loadWorkspaceDir('');
}
function getFileIcon(ext) {
    const icons = { '.py': '🐍', '.js': '📜', '.ts': '📘', '.cs': '⚙️', '.json': '📋', '.md': '📝', '.txt': '📄', '.csv': '📊', '.html': '🌐', '.css': '🎨', '.zip': '🗜️', '.pdf': '📕', '.png': '🖼️', '.jpg': '🖼️', '.jpeg': '🖼️' };
    return icons[ext] || '📄';
}
function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// ════════════════════════════════════════════════════════
//  PROMPT TEMPLATES
// ════════════════════════════════════════════════════════
const PROMPT_TEMPLATES = [
    { cat: 'image', icon: '🖼️', title: 'Photorealistic Image', desc: 'Generate a detailed realistic photo', prompt: 'Generate a photorealistic image of: [describe subject here]. Use natural lighting, high detail, 4K quality.' },
    { cat: 'image', icon: '🎨', title: 'Digital Art', desc: 'Create stylized digital artwork', prompt: 'Create a stunning digital art illustration of: [subject]. Style: [art style, e.g. cyberpunk / watercolor / anime]. Vibrant colors, detailed composition.' },
    { cat: 'image', icon: '🗺️', title: 'Diagram / Chart', desc: 'Generate a visual diagram', prompt: 'Create a clear diagram showing: [topic]. Include labels, arrows, and structured layout.' },
    { cat: 'image', icon: '📸', title: 'Product Photography', desc: 'Professional product shot', prompt: 'Professional product photography of: [product]. White background, studio lighting, marketing-ready, multiple angles.' },
    { cat: 'image', icon: '🌆', title: 'Landscape Scene', desc: 'Beautiful landscape artwork', prompt: 'Create a breathtaking landscape of: [location/scene]. Dramatic lighting, rich colors, cinematic composition.' },
    { cat: 'code', icon: '🔍', title: 'Code Review', desc: 'Review and improve my code', prompt: 'Please review the following code and provide:\n1. Bug identification\n2. Performance improvements\n3. Best practices\n4. Security concerns\n\n```\n[paste your code here]\n```' },
    { cat: 'code', icon: '🐛', title: 'Debug This Error', desc: 'Fix a bug or error', prompt: 'I am getting this error:\n```\n[paste error message]\n```\n\nHere is my code:\n```\n[paste code]\n```\n\nPlease explain the cause and provide a fix.' },
    { cat: 'code', icon: '🧪', title: 'Write Unit Tests', desc: 'Generate tests for code', prompt: 'Write comprehensive unit tests for the following function/class. Cover edge cases, happy path, and error scenarios:\n\n```\n[paste your code]\n```' },
    { cat: 'code', icon: '♻️', title: 'Refactor Code', desc: 'Clean up and optimize code', prompt: 'Refactor the following code for better readability, performance, and maintainability. Explain each change:\n\n```\n[paste your code]\n```' },
    { cat: 'code', icon: '📡', title: 'API Design', desc: 'Design a REST API', prompt: 'Design a RESTful API for: [feature/system]. Include:\n- Endpoints (GET/POST/PUT/DELETE)\n- Request/Response JSON examples\n- Error codes\n- Authentication approach' },
    { cat: 'code', icon: '🏗️', title: 'Architecture Diagram', desc: 'System architecture with Mermaid', prompt: 'Create a system architecture diagram using Mermaid.js for: [system description].\n\nShow components, data flow, and relationships. Use ```mermaid code blocks.' },
    { cat: 'writing', icon: '📰', title: 'Blog Post', desc: 'Write a blog article', prompt: 'Write a compelling blog post about: [topic].\nTarget audience: [audience]\nTone: [professional/casual/technical]\nLength: ~800 words\nInclude: introduction, 3-4 key sections, and conclusion.' },
    { cat: 'writing', icon: '📧', title: 'Professional Email', desc: 'Draft a formal email', prompt: 'Write a professional email:\nFrom: [your role]\nTo: [recipient and their role]\nPurpose: [goal of the email]\nKey points to include: [list them]\nTone: [formal/friendly/urgent]' },
    { cat: 'writing', icon: '📋', title: 'Executive Summary', desc: 'Summarize a document', prompt: 'Create a concise executive summary of the following document. Include: key findings, recommendations, and next steps.\n\n[paste document text here]' },
    { cat: 'writing', icon: '🎭', title: 'Creative Story', desc: 'Write a short story', prompt: 'Write a short story with:\nGenre: [genre]\nSetting: [time and place]\nMain character: [brief description]\nConflict: [challenge they face]\nLength: ~500 words' },
    { cat: 'writing', icon: '💼', title: 'LinkedIn Post', desc: 'Social media content', prompt: 'Write an engaging LinkedIn post about: [topic/achievement/insight].\nTone: professional yet personable.\nInclude: a hook opening, key insight, and a call-to-action.\n3-5 paragraphs with good spacing.' },
    { cat: 'analysis', icon: '📊', title: 'Data Analysis', desc: 'Analyze data or numbers', prompt: 'Analyze the following data and provide:\n1. Key trends and patterns\n2. Statistical insights\n3. Anomalies or concerns\n4. Actionable recommendations\n\n[paste data here]' },
    { cat: 'analysis', icon: '⚖️', title: 'Compare & Contrast', desc: 'Detailed comparison', prompt: 'Compare and contrast: [Option A] vs [Option B]\n\nAnalyze:\n- Features and capabilities\n- Pros and cons of each\n- Use case scenarios\n- Cost/effort considerations\n- Final recommendation' },
    { cat: 'analysis', icon: '🔷', title: 'SWOT Analysis', desc: 'Strategic analysis framework', prompt: 'Perform a detailed SWOT analysis for: [company/product/project/idea]\n\nStrengths, Weaknesses, Opportunities, Threats – with specific examples and strategic implications for each.' },
    { cat: 'analysis', icon: '🧠', title: 'Decision Framework', desc: 'Help make a decision', prompt: 'Help me decide between these options: [list options]\n\nContext: [describe the situation]\nConstraints: [budget, time, resources]\nPriorities: [what matters most]\n\nProvide a structured decision framework with recommendation.' },
    { cat: 'analysis', icon: '📈', title: 'Market Research', desc: 'Research and analysis', prompt: 'Research and analyze the market for: [product/service/industry]\n\nCover: market size, key players, trends, opportunities, challenges, and target customer profile.' },
    { cat: 'translate', icon: '🇮🇳', title: 'Translate to Tamil', desc: 'English → Tamil', prompt: 'Translate the following text to Tamil (தமிழ்). Maintain natural, fluent language appropriate for [formal/informal] context:\n\n[paste text here]' },
    { cat: 'translate', icon: '🇬🇧', title: 'Translate to English', desc: 'Any language → English', prompt: 'Translate the following text to English. Preserve the tone and meaning accurately:\n\n[paste text here]' },
    { cat: 'translate', icon: '🎓', title: 'Simplify Language', desc: 'Make complex text simple', prompt: 'Rewrite the following text in simple, easy-to-understand language. Target reading level: [grade 8 / general public / beginner]:\n\n[paste complex text]' },
    { cat: 'translate', icon: '👔', title: 'Formal Writing Style', desc: 'Make text more formal', prompt: 'Rewrite the following text in a formal, professional style suitable for [business communication / academic writing / official documentation]:\n\n[paste text]' },
    { cat: 'tamil', icon: '📖', title: 'Tamil Explanation', desc: 'Explain topic in Tamil', prompt: 'இந்த தலைப்பை தமிழில் எளிமையாக விளக்கவும்: [topic]\n\nதயவுசெய்து:\n- எளிய தமிழில் விளக்கவும்\n- உதாரணங்கள் கொடுக்கவும்\n- முக்கிய புள்ளிகளை பட்டியலிடவும்' },
    { cat: 'tamil', icon: '✍️', title: 'Tamil Writing', desc: 'Write content in Tamil', prompt: 'பின்வரும் தலைப்பில் தமிழில் எழுதவும்: [topic]\n\nவகை: [கட்டுரை / கதை / கவிதை / விளம்பரம்]\nநீளம்: [word count]\nதொனி: [formal/informal]' },
    { cat: 'tamil', icon: '🔄', title: 'Tamil to English', desc: 'Tamil → English translation', prompt: 'Translate the following Tamil text to English accurately:\n\n[paste Tamil text here]\n\nProvide a natural English translation maintaining the original meaning.' },
    { cat: 'tamil', icon: '💬', title: 'Tamil Grammar Check', desc: 'Check Tamil writing', prompt: 'இந்த தமிழ் உரையில் இலக்கண பிழைகளை சரிசெய்யவும் மற்றும் மேம்படுத்தவும்:\n\n[உரையை இங்கே ஒட்டவும்]\n\nதிருத்தங்களை விளக்கவும்.' },
];

let tplCurrentCategory = 'all';
let tplSearchQuery = '';

function showPromptTemplates() {
    document.getElementById('promptTemplatesModal').style.display = 'flex';
    document.getElementById('tplSearch').value = '';
    tplSearchQuery = '';
    renderTemplateCards(tplCurrentCategory);
    document.getElementById('tplSearch').focus();
}
function closePromptTemplates() { document.getElementById('promptTemplatesModal').style.display = 'none'; }
function filterCategory(cat, btn) {
    tplCurrentCategory = cat;
    document.querySelectorAll('.tpl-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTemplateCards(cat);
}
function filterTemplates(query) { tplSearchQuery = query.toLowerCase(); renderTemplateCards(tplCurrentCategory); }
function renderTemplateCards(cat) {
    const body = document.getElementById('tplBody');
    if (!body) return;
    let templates = PROMPT_TEMPLATES;
    if (cat && cat !== 'all') templates = templates.filter(t => t.cat === cat);
    if (tplSearchQuery) templates = templates.filter(t => t.title.toLowerCase().includes(tplSearchQuery) || t.desc.toLowerCase().includes(tplSearchQuery) || t.prompt.toLowerCase().includes(tplSearchQuery));
    if (!templates.length) { body.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--txt2);padding:30px">No templates found.</div>'; return; }
    body.innerHTML = templates.map(t => `<div class="tpl-card"><h5>${t.icon} ${escHtml(t.title)}</h5><p>${escHtml(t.desc)}</p><button class="tpl-use-btn" onclick="insertTemplate(${PROMPT_TEMPLATES.indexOf(t)})">📋 Use Template</button></div>`).join('');
}
function insertTemplate(idx) {
    const t = PROMPT_TEMPLATES[idx];
    if (!t) return;
    const inp = document.getElementById('msgInput');
    if (inp) {
        inp.value = t.prompt;
        autoResize(inp);
        inp.focus();
        const placeholderStart = t.prompt.indexOf('[');
        const placeholderEnd = t.prompt.indexOf(']') + 1;
        if (placeholderStart >= 0) { inp.setSelectionRange(placeholderStart, placeholderEnd); }
    }
    closePromptTemplates();
}