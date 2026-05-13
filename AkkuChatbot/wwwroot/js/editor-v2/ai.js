// ═══════════════════════════════════════════════════════════════════
//  AkkuChatbot — Image Editor V2
//  FILE : wwwroot/js/editor-v2/ai.js
//  Handles : AI Image Generation, Template Integration,
//            Remove Background, Upscale, Inpainting,
//            Recent Generated Grid, Coin balance sync
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ─────────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────────
const AI = {
    recentImages: [],          // { url, prompt, model, seed }
    maxRecent: 9,
    generating: false,
    inpaintActive: false,
    inpaintCanvas: null,
    inpaintCtx: null,
    inpaintDrawing: false,
    brushSize: 24,
};

// ─────────────────────────────────────────────────────────────────
//  INIT — runs after DOM ready (called from core.js or inline)
// ─────────────────────────────────────────────────────────────────
function initAI() {
    loadRecentFromStorage();
    renderRecentGrid();
    syncCoinBalance();
    applyTemplateFromUrl();   // ← Template "Use" button integration
}

// ─────────────────────────────────────────────────────────────────
//  🎯 TEMPLATE FROM URL — PromptTemplates "Use" button sends params
//  URL format: /Tools/ImageEditor?prompt=...&model=...&neg=...
//              &width=...&height=...&steps=...&cfg=...&seed=...
// ─────────────────────────────────────────────────────────────────
function applyTemplateFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (!p.get('prompt')) return;

    // ── Set prompt fields ──────────────────────────────────────
    setElVal('genPrompt', p.get('prompt'));
    setElVal('genNeg', p.get('neg'));
    setElVal('genModel', p.get('model'));
    setElVal('genSeed', p.get('seed'));

    // ── Steps (needs Priority-1 slider in cshtml) ──────────────
    const stepsEl = document.getElementById('genSteps');
    if (stepsEl && p.get('steps')) {
        stepsEl.value = p.get('steps');
        stepsEl.dispatchEvent(new Event('input'));
    }

    // ── CFG / Guidance Scale ───────────────────────────────────
    const cfgEl = document.getElementById('genCfg');
    if (cfgEl && p.get('cfg')) {
        cfgEl.value = p.get('cfg');
        cfgEl.dispatchEvent(new Event('input'));
    }

    // ── Size: match width×height to dropdown or add custom ─────
    const w = p.get('width'), h = p.get('height');
    if (w && h) {
        const sizeEl = document.getElementById('genSize');
        if (sizeEl) {
            const target = `${w}x${h}`;
            const exists = [...sizeEl.options].some(o => o.value === target);
            if (!exists) {
                const opt = new Option(`${w}×${h} (template)`, target, false, false);
                sizeEl.add(opt);
            }
            sizeEl.value = target;
        }
    }

    // ── Toast & badge ──────────────────────────────────────────
    const promptPreview = (p.get('prompt') || '').substring(0, 50);
    showToast(`🧩 Template loaded: ${promptPreview}…`, 'info');

    // Show green badge above Generate button
    const genBtn = document.getElementById('genBtn');
    if (genBtn) {
        let badge = document.getElementById('templateLoadedBadge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'templateLoadedBadge';
            badge.style.cssText = `
                background:rgba(46,160,67,.15);color:#3fb950;
                border:1px solid rgba(46,160,67,.3);border-radius:4px;
                padding:4px 7px;font-size:10px;margin-bottom:5px;
                display:flex;align-items:center;justify-content:space-between;
            `;
            genBtn.parentNode.insertBefore(badge, genBtn);
        }
        const modelLabel = p.get('model') || 'flux';
        const sizeLabel = (w && h) ? `${w}×${h}` : '';
        badge.innerHTML = `
            <span>🧩 Template: <b>${modelLabel}</b>${sizeLabel ? ` · ${sizeLabel}` : ''}</span>
            <button onclick="this.parentElement.remove()" style="
                background:none;border:none;color:inherit;font-size:11px;cursor:pointer;padding:0 2px
            ">✕</button>`;
    }

    // Clean URL without page reload
    window.history.replaceState({}, '', window.location.pathname);
}

// ─────────────────────────────────────────────────────────────────
//  HELPER — safely set element value + fire events
// ─────────────────────────────────────────────────────────────────
function setElVal(id, val) {
    if (!val && val !== 0) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
}

// ─────────────────────────────────────────────────────────────────
//  MAIN — Generate AI Image
// ─────────────────────────────────────────────────────────────────
async function generateAIImage() {
    if (AI.generating) return;

    const prompt = document.getElementById('genPrompt')?.value?.trim();
    if (!prompt) { showToast('Please enter a prompt first', 'warn'); return; }

    // ── Read all settings ──────────────────────────────────────
    const neg = document.getElementById('genNeg')?.value?.trim() || '';
    const model = document.getElementById('genModel')?.value || 'flux';
    const style = document.getElementById('genStyle')?.value || '';
    const seed = parseInt(document.getElementById('genSeed')?.value) || null;
    const steps = parseInt(document.getElementById('genSteps')?.value) || 20;
    const cfg = parseFloat(document.getElementById('genCfg')?.value) || 7.5;

    // ── Parse size ─────────────────────────────────────────────
    const sizeVal = document.getElementById('genSize')?.value || '1024x1024';
    const [width, height] = sizeVal.split('x').map(Number);

    // ── Build final prompt (append style if selected) ──────────
    const finalPrompt = style ? `${prompt}, ${style} style` : prompt;

    // ── UI: loading state ──────────────────────────────────────
    AI.generating = true;
    const genBtn = document.getElementById('genBtn');
    if (genBtn) {
        genBtn.disabled = true;
        genBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Generating…';
    }
    showCanvasOverlay(true, 'Generating image…');

    try {
        const res = await fetch('/ImageGenerator/Generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: finalPrompt,
                model,
                width: width || 1024,
                height: height || 1024,
                seed,
                negativePrompt: neg || null,
                steps,              // ← passed to API
                guidanceScale: cfg  // ← passed to API
            })
        });

        const data = await res.json();

        if (!data.success) {
            showToast('❌ ' + (data.error || 'Generation failed'), 'err');
            return;
        }

        // ── Add generated image to canvas ──────────────────────
        await addImageToCanvas(data.url, true);

        // ── Update coin badge ──────────────────────────────────
        if (data.newBalance !== undefined) updateCoinBadge(data.newBalance);

        // ── Save to recent ─────────────────────────────────────
        addToRecent({ url: data.url, prompt: finalPrompt, model, seed: seed || 0 });

        showToast('✅ Image generated!', 'ok');

    } catch (err) {
        console.error('[AI] Generate error:', err);
        showToast('❌ Network error — try again', 'err');
    } finally {
        AI.generating = false;
        if (genBtn) {
            genBtn.disabled = false;
            genBtn.innerHTML = '<i class="fa fa-wand-magic-sparkles"></i> Generate <small style="opacity:.7;font-weight:400">⬡2</small>';
        }
        showCanvasOverlay(false);
    }
}

// ─────────────────────────────────────────────────────────────────
//  ADD IMAGE URL TO FABRIC CANVAS
// ─────────────────────────────────────────────────────────────────
function addImageToCanvas(url, center = true) {
    return new Promise((resolve) => {
        if (!window.canvas) { resolve(); return; }

        fabric.Image.fromURL(url, function (img) {
            if (!img) { showToast('⚠️ Could not load image', 'warn'); resolve(); return; }

            // Scale to fit canvas if larger
            const cw = window.canvas.getWidth();
            const ch = window.canvas.getHeight();
            const scale = Math.min(cw / img.width, ch / img.height, 1);

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: center ? cw / 2 : 20,
                top: center ? ch / 2 : 20,
                originX: center ? 'center' : 'left',
                originY: center ? 'center' : 'top',
            });

            window.canvas.add(img);
            window.canvas.setActiveObject(img);
            window.canvas.renderAll();

            if (typeof pushHistory === 'function') pushHistory();
            resolve();
        }, { crossOrigin: 'anonymous' });
    });
}

// ─────────────────────────────────────────────────────────────────
//  OPEN TEMPLATES MODAL — Inline sidebar loader
// ─────────────────────────────────────────────────────────────────
async function openTemplatesModal() {
    const grid = document.getElementById('recentGenGrid');
    if (!grid) return;

    // Show loading
    grid.innerHTML = `
        <div style="font-size:10px;color:var(--txt3);text-align:center;
                    padding:16px;grid-column:1/-1">
            <i class="fa fa-spinner fa-spin"></i> Loading templates…
        </div>`;

    // Switch to AI tab so user sees the grid
    if (typeof switchLTab === 'function') switchLTab('ai');

    try {
        const res = await fetch('/api/PromptTemplate/public?pageSize=9&sort=popular', {
            headers: { 'Accept': 'application/json' }
        });

        if (res.status === 401) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;font-size:10px;color:var(--err)">
                Login required</div>`;
            return;
        }

        const data = await res.json();
        const items = data.items ?? data.Items ?? [];

        if (!items.length) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;font-size:10px;color:var(--txt3)">
                No templates found</div>`;
            return;
        }

        grid.innerHTML = items.map(t => {
            const thumb = t.thumbnailUrl
                ? `<img src="${t.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:3px"
                        onerror="this.style.display='none'">`
                : `<span style="font-size:20px">${getCategoryEmojiAI(t.category)}</span>`;
            return `
            <div class="rg-item" title="${escAI(t.title)}\n${escAI((t.prompt || '').substring(0, 80))}"
                 onclick='applyTemplateToEditor(${JSON.stringify(t)})'
                 style="display:flex;align-items:center;justify-content:center;
                        font-size:9px;text-align:center;overflow:hidden">
                ${thumb}
            </div>`;
        }).join('');

        // Add "Browse All" link at bottom
        grid.insertAdjacentHTML('afterend', `
            <div style="text-align:center;margin-top:6px" id="browseAllLink">
                <a href="/Tools/PromptTemplates" target="_blank"
                   style="font-size:10px;color:var(--acc);text-decoration:none">
                    🧩 Browse all templates ↗
                </a>
            </div>`);

    } catch (err) {
        console.error('[AI] loadTemplates error:', err);
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;font-size:10px;color:var(--err)">
            Failed to load templates</div>`;
    }
}

// ─────────────────────────────────────────────────────────────────
//  APPLY TEMPLATE → Fill all editor fields
// ─────────────────────────────────────────────────────────────────
function applyTemplateToEditor(t) {
    setElVal('genPrompt', t.prompt);
    setElVal('genNeg', t.negativePrompt);
    setElVal('genModel', t.fluxModel || 'flux');
    if (t.seed) setElVal('genSeed', t.seed);

    // Steps slider
    const stepsEl = document.getElementById('genSteps');
    if (stepsEl && t.steps) {
        stepsEl.value = t.steps;
        stepsEl.dispatchEvent(new Event('input'));
    }

    // CFG slider
    const cfgEl = document.getElementById('genCfg');
    if (cfgEl && t.guidanceScale) {
        cfgEl.value = t.guidanceScale;
        cfgEl.dispatchEvent(new Event('input'));
    }

    // Size
    if (t.width && t.height) {
        const sizeEl = document.getElementById('genSize');
        if (sizeEl) {
            const target = `${t.width}x${t.height}`;
            const exists = [...sizeEl.options].some(o => o.value === target);
            if (!exists) sizeEl.add(new Option(`${t.width}×${t.height}`, target));
            sizeEl.value = target;
        }
    }

    showToast(`🧩 Template: ${t.title}`, 'info');

    // Remove "Browse All" helper link
    document.getElementById('browseAllLink')?.remove();
}

// ─────────────────────────────────────────────────────────────────
//  REMOVE BACKGROUND  (⬡2)
// ─────────────────────────────────────────────────────────────────
async function removeBackground() {
    if (!window.canvas) return;
    const active = window.canvas.getActiveObject();
    if (!active || active.type !== 'image') {
        showToast('Select an image layer first', 'warn'); return;
    }

    showToast('⏳ Removing background… ⬡2', 'info');
    showCanvasOverlay(true, 'Removing background…');

    try {
        // Export selected object as PNG base64
        const dataUrl = active.toDataURL({ format: 'png', multiplier: 1 });
        const base64 = dataUrl.split(',')[1];

        const res = await fetch('/ImageGenerator/RemoveBackground', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 })
        });
        const data = await res.json();

        if (!data.success) {
            showToast('❌ ' + (data.error || 'BG removal failed'), 'err');
            return;
        }

        // Replace with result
        fabric.Image.fromURL(data.url, function (img) {
            if (!img) return;
            img.set({
                left: active.left,
                top: active.top,
                scaleX: active.scaleX,
                scaleY: active.scaleY,
                angle: active.angle,
            });
            window.canvas.remove(active);
            window.canvas.add(img);
            window.canvas.setActiveObject(img);
            window.canvas.renderAll();
            if (typeof pushHistory === 'function') pushHistory();
        }, { crossOrigin: 'anonymous' });

        if (data.newBalance !== undefined) updateCoinBadge(data.newBalance);
        showToast('✅ Background removed!', 'ok');

    } catch (err) {
        console.error('[AI] RemoveBG error:', err);
        showToast('❌ Network error', 'err');
    } finally {
        showCanvasOverlay(false);
    }
}

// ─────────────────────────────────────────────────────────────────
//  UPSCALE IMAGE  (⬡3)
// ─────────────────────────────────────────────────────────────────
async function upscaleImage() {
    if (!window.canvas) return;
    const active = window.canvas.getActiveObject();
    if (!active || active.type !== 'image') {
        showToast('Select an image layer first', 'warn'); return;
    }

    showToast('⏳ Upscaling… ⬡3', 'info');
    showCanvasOverlay(true, 'Upscaling image…');

    try {
        const dataUrl = active.toDataURL({ format: 'png', multiplier: 1 });
        const base64 = dataUrl.split(',')[1];

        const res = await fetch('/ImageGenerator/Upscale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, scale: 2 })
        });
        const data = await res.json();

        if (!data.success) {
            showToast('❌ ' + (data.error || 'Upscale failed'), 'err');
            return;
        }

        fabric.Image.fromURL(data.url, function (img) {
            if (!img) return;
            const scale = active.scaleX * 0.5; // 2x image but same canvas size
            img.set({
                left: active.left,
                top: active.top,
                scaleX: scale,
                scaleY: scale,
                angle: active.angle,
            });
            window.canvas.remove(active);
            window.canvas.add(img);
            window.canvas.setActiveObject(img);
            window.canvas.renderAll();
            if (typeof pushHistory === 'function') pushHistory();
        }, { crossOrigin: 'anonymous' });

        if (data.newBalance !== undefined) updateCoinBadge(data.newBalance);
        showToast('✅ Image upscaled 2×!', 'ok');

    } catch (err) {
        console.error('[AI] Upscale error:', err);
        showToast('❌ Network error', 'err');
    } finally {
        showCanvasOverlay(false);
    }
}

// ─────────────────────────────────────────────────────────────────
//  AI INPAINTING  (⬡5)
// ─────────────────────────────────────────────────────────────────
function openInpaintingTool() {
    if (!window.canvas) return;
    const active = window.canvas.getActiveObject();
    if (!active || active.type !== 'image') {
        showToast('Select an image layer first to use Inpainting', 'warn');
        return;
    }

    AI.inpaintActive = true;
    showToast('🖌 Inpainting mode — draw mask on the area to replace, then click Apply', 'info');

    // Show inpaint toolbar
    const toolbar = document.querySelector('.inp-toolbar');
    if (toolbar) toolbar.classList.add('active');
    document.querySelector('.inp-mode-toggle')?.classList.add('active');

    // Create overlay canvas for mask drawing
    const wrapper = document.querySelector('.canvas-container-wrapper');
    if (!wrapper) return;

    if (!AI.inpaintCanvas) {
        AI.inpaintCanvas = document.createElement('canvas');
        AI.inpaintCanvas.id = 'inpaintCanvas';
        AI.inpaintCanvas.style.cssText = `
            position:absolute;inset:0;z-index:50;cursor:crosshair;opacity:.7;
        `;
        wrapper.appendChild(AI.inpaintCanvas);
    }

    AI.inpaintCanvas.width = window.canvas.getWidth();
    AI.inpaintCanvas.height = window.canvas.getHeight();
    AI.inpaintCanvas.style.display = 'block';
    AI.inpaintCtx = AI.inpaintCanvas.getContext('2d');
    AI.inpaintCtx.clearRect(0, 0, AI.inpaintCanvas.width, AI.inpaintCanvas.height);

    // Brush drawing events
    AI.inpaintCanvas.addEventListener('mousedown', inpaintStart);
    AI.inpaintCanvas.addEventListener('mousemove', inpaintDraw);
    AI.inpaintCanvas.addEventListener('mouseup', inpaintEnd);
    AI.inpaintCanvas.addEventListener('mouseleave', inpaintEnd);
}

function inpaintStart(e) {
    AI.inpaintDrawing = true;
    drawInpaintBrush(e);
}
function inpaintDraw(e) { if (AI.inpaintDrawing) drawInpaintBrush(e); }
function inpaintEnd() { AI.inpaintDrawing = false; }

function drawInpaintBrush(e) {
    if (!AI.inpaintCtx) return;
    const rect = AI.inpaintCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    AI.inpaintCtx.globalAlpha = 0.8;
    AI.inpaintCtx.fillStyle = '#ff0080';
    AI.inpaintCtx.beginPath();
    AI.inpaintCtx.arc(x, y, AI.brushSize / 2, 0, Math.PI * 2);
    AI.inpaintCtx.fill();
}

async function applyInpainting() {
    if (!AI.inpaintActive || !AI.inpaintCanvas) return;

    const inpaintPrompt = document.getElementById('inpaintPrompt')?.value?.trim();
    if (!inpaintPrompt) { showToast('Enter what to replace the masked area with', 'warn'); return; }

    showToast('⏳ Applying inpainting… ⬡5', 'info');
    showCanvasOverlay(true, 'AI Inpainting…');

    try {
        const active = window.canvas.getActiveObject();
        const imageData = active?.toDataURL({ format: 'png' }) || '';
        const maskData = AI.inpaintCanvas.toDataURL('image/png');

        const res = await fetch('/ImageGenerator/Inpaint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageBase64: imageData.split(',')[1],
                maskBase64: maskData.split(',')[1],
                prompt: inpaintPrompt
            })
        });
        const data = await res.json();

        if (!data.success) { showToast('❌ ' + (data.error || 'Inpaint failed'), 'err'); return; }

        await addImageToCanvas(data.url, false);
        if (data.newBalance !== undefined) updateCoinBadge(data.newBalance);
        showToast('✅ Inpainting applied!', 'ok');

    } catch (err) {
        showToast('❌ Network error', 'err');
    } finally {
        showCanvasOverlay(false);
        closeInpaintingTool();
    }
}

function closeInpaintingTool() {
    AI.inpaintActive = false;
    if (AI.inpaintCanvas) {
        AI.inpaintCanvas.removeEventListener('mousedown', inpaintStart);
        AI.inpaintCanvas.removeEventListener('mousemove', inpaintDraw);
        AI.inpaintCanvas.removeEventListener('mouseup', inpaintEnd);
        AI.inpaintCanvas.style.display = 'none';
    }
    document.querySelector('.inp-toolbar')?.classList.remove('active');
    document.querySelector('.inp-mode-toggle')?.classList.remove('active');
}

function setInpaintBrushSize(size) {
    AI.brushSize = parseInt(size);
    const lbl = document.getElementById('brushSizeLbl');
    if (lbl) lbl.textContent = size + 'px';
}

// ─────────────────────────────────────────────────────────────────
//  RECENT GENERATED GRID
// ─────────────────────────────────────────────────────────────────
function addToRecent(item) {
    AI.recentImages.unshift(item);
    if (AI.recentImages.length > AI.maxRecent)
        AI.recentImages = AI.recentImages.slice(0, AI.maxRecent);
    saveRecentToStorage();
    renderRecentGrid();
}

function renderRecentGrid() {
    const grid = document.getElementById('recentGenGrid');
    if (!grid) return;

    if (!AI.recentImages.length) {
        grid.innerHTML = `<div style="font-size:10px;color:var(--txt3);
            text-align:center;padding:10px;grid-column:1/-1">
            Generate an image first</div>`;
        return;
    }

    grid.innerHTML = AI.recentImages.map((item, i) => `
        <img class="rg-item" src="${item.url}" loading="lazy"
             title="${escAI(item.prompt)}"
             onclick="addImageToCanvas('${item.url}', true)"
             ondblclick="reuseRecentPrompt(${i})"
             onerror="this.style.opacity='.3'"
        >`
    ).join('');
}

function reuseRecentPrompt(index) {
    const item = AI.recentImages[index];
    if (!item) return;
    setElVal('genPrompt', item.prompt);
    setElVal('genModel', item.model);
    if (item.seed) setElVal('genSeed', item.seed);
    showToast('📋 Prompt reloaded from recent', 'info');
}

function clearRecentGen() {
    AI.recentImages = [];
    saveRecentToStorage();
    renderRecentGrid();
    showToast('Recent images cleared', 'info');
}

function saveRecentToStorage() {
    try { localStorage.setItem('akku_recent_gen', JSON.stringify(AI.recentImages)); } catch { }
}
function loadRecentFromStorage() {
    try {
        const saved = localStorage.getItem('akku_recent_gen');
        if (saved) AI.recentImages = JSON.parse(saved).slice(0, AI.maxRecent);
    } catch { }
}

// ─────────────────────────────────────────────────────────────────
//  COIN BALANCE SYNC
// ─────────────────────────────────────────────────────────────────
async function syncCoinBalance() {
    try {
        const res = await fetch('/api/PromptTemplate/balance', { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        updateCoinBadge(data.balance ?? 0);
    } catch { }
}

function updateCoinBadge(balance) {
    const badge = document.querySelector('.coin-badge');
    if (badge) badge.textContent = `⬡ ${balance}`;
}

// ─────────────────────────────────────────────────────────────────
//  CANVAS OVERLAY (loading spinner)
// ─────────────────────────────────────────────────────────────────
function showCanvasOverlay(show, msg = '') {
    let ov = document.getElementById('canvasGenOverlay');

    if (!show) {
        if (ov) { ov.style.display = 'none'; }
        return;
    }

    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'canvasGenOverlay';
        ov.className = 'canvas-overlay';
        ov.innerHTML = `
            <div class="spin"></div>
            <div id="canvasOverlayMsg" style="font-size:12px;color:var(--txt2)"></div>`;
        const wrap = document.querySelector('.canvas-scroll-wrap');
        if (wrap) wrap.appendChild(ov);
    }

    document.getElementById('canvasOverlayMsg').textContent = msg;
    ov.style.display = 'flex';
}

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
function getCategoryEmojiAI(cat) {
    const m = {
        'Cinematic': '🎬', 'Digital Art': '🎨',
        'Photography': '📷', 'Code': '💻',
        'Writing': '✍️', 'Analysis': '📊',
        'Translate': '🌐', 'Tamil': '🪔',
        'image': '🖼️'
    };
    return m[cat] || '🧩';
}

function escAI(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────────────────
//  EXPORT — functions used by editor-v2.cshtml buttons
// ─────────────────────────────────────────────────────────────────
window.generateAIImage = generateAIImage;
window.openTemplatesModal = openTemplatesModal;
window.applyTemplateToEditor = applyTemplateToEditor;
window.removeBackground = removeBackground;
window.upscaleImage = upscaleImage;
window.openInpaintingTool = openInpaintingTool;
window.applyInpainting = applyInpainting;
window.closeInpaintingTool = closeInpaintingTool;
window.setInpaintBrushSize = setInpaintBrushSize;
window.clearRecentGen = clearRecentGen;
window.reuseRecentPrompt = reuseRecentPrompt;
window.addImageToCanvas = addImageToCanvas;
window.syncCoinBalance = syncCoinBalance;
window.updateCoinBadge = updateCoinBadge;
window.initAI = initAI;

// ─────────────────────────────────────────────────────────────────
//  AUTO INIT when DOM is ready
// ─────────────────────────────────────────────────────────────────
if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initAI);
else
    initAI();