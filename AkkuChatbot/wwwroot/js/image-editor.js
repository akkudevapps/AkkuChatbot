/* ═══════════════════════════════════════════════════════════════
   AKKU IMAGE EDITOR – image-editor.js v7.0
   ✅ FIX 1: Top Property Bar now appears ABOVE canvas (layout fix in CSHTML)
   ✅ FIX 2: Color palette click applies to ALL shape/text/image types
   ✅ FIX 3: Canvas Size presets work correctly (mm/in/px units fixed)
   ✅ FIX 4: Shape fill/stroke/border editable after creation via top bar
   ✅ FIX 5: Eraser Brush Tool added
   ✅ FIX 6: CorelDraw-style color palette strip + property bar with fill/stroke
   ✅ FIX 7: Copy/Paste elements (Ctrl+C / Ctrl+V + buttons)
   ✅ KEPT: All existing micro-functions preserved
   ═══════════════════════════════════════════════════════════════ */

const POLLINATIONS_MODELS = [
    { value: 'flux', label: 'FLUX.1 · Free (Best Quality)' },
    { value: 'turbo', label: 'Flux Schnell · Turbo (Fast)' },
    { value: 'flux-realism', label: 'Flux Realism · Photorealistic' },
    { value: 'flux-anime', label: 'Flux Anime · Cel-Shaded' },
    { value: 'flux-3d', label: 'Flux 3D · Render Style' },
    { value: 'flux-cablyai', label: 'Flux CablyAI · Artistic' },
    { value: 'any-dark', label: 'Any Dark · Moody Noir' },
];
const PROMPT_TEMPLATES = [
    { name: 'Cinematic', prompt: 'Cinematic scene of [subject], dramatic lighting, film grain, anamorphic lens flare', img: 'https://picsum.photos/120/80?random=1' },
    { name: 'Photorealistic', prompt: 'Photorealistic DSLR photo of [subject], 85mm lens, golden hour, shallow DOF', img: 'https://picsum.photos/120/80?random=2' },
    { name: 'Digital Art', prompt: 'Digital concept art of [subject], vivid colors, highly detailed, ArtStation trending', img: 'https://picsum.photos/120/80?random=3' },
    { name: 'Watercolor', prompt: 'Delicate watercolor painting of [subject], soft washes, artistic brushwork, white paper', img: 'https://picsum.photos/120/80?random=4' },
    { name: 'Anime', prompt: 'Anime illustration of [subject], cel shading, vibrant, studio quality, detailed background', img: 'https://picsum.photos/120/80?random=5' },
    { name: 'Cyberpunk', prompt: '[subject] in a cyberpunk city, neon lights, rain-slicked streets, ultra detailed', img: 'https://picsum.photos/120/80?random=6' },
    { name: 'Oil Painting', prompt: 'Oil painting of [subject], impasto technique, museum quality, Rembrandt lighting', img: 'https://picsum.photos/120/80?random=7' },
    { name: 'Logo Design', prompt: 'Minimalist vector logo for [subject], flat design, professional, clean, white background', img: 'https://picsum.photos/120/80?random=8' },
    { name: 'Epic Fantasy', prompt: 'Epic fantasy scene with [subject], magical atmosphere, golden light, ultra detailed 8K', img: 'https://picsum.photos/120/80?random=9' },
    { name: 'Sci-Fi', prompt: 'Futuristic sci-fi scene of [subject], space age, bioluminescent, concept art render', img: 'https://picsum.photos/120/80?random=10' },
    { name: 'Portrait', prompt: 'Professional studio portrait of [subject], key light, fill light, bokeh background, 4K', img: 'https://picsum.photos/120/80?random=11' },
    { name: 'Macro Photo', prompt: 'Extreme macro photography of [subject], crystal sharp, high contrast, dew drops, 8K', img: 'https://picsum.photos/120/80?random=12' },
];
const STYLE_PRESETS = [
    '', 'photographic', 'digital art', 'anime', 'oil painting', 'watercolor',
    'pencil sketch', 'cyberpunk', 'fantasy art', 'sci-fi concept',
    'minimalist', 'surrealism', 'pixel art', 'comic book', 'neon noir',
    'retro 80s', 'studio ghibli',
];



const EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤩', '😢', '😡', '🤔', '💡', '🔥', '⭐', '💯', '❤️', '🎉', '🎊',
    '🏆', '💎', '🌟', '✨', '🦋', '🌸', '🌈', '🌊', '⚡', '🌙', '☀️', '🍀', '🦁', '🐶', '🚀', '🎨',
    '🎭', '🎬', '🎵', '🎶', '📸', '🏠', '🌍', '🦅', '🐉', '🌺', '🍕', '🎃', '👑', '🔮', '🌴', '🐬',
];

const BLEND_MODES = [
    'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
];

const LAYER_ICONS = {
    image: 'fa-image', 'i-text': 'fa-font', text: 'fa-font',
    rect: 'fa-square', circle: 'fa-circle', ellipse: 'fa-circle',
    triangle: 'fa-play', line: 'fa-minus', polygon: 'fa-star',
    path: 'fa-pen-nib', group: 'fa-layer-group',
};

/* ── CorelDraw-style full color palette (100 swatches) ────── */
const COREL_PALETTE = [
    /* Neutral grays */
    '#ffffff', '#f0f0f0', '#d8d8d8', '#c0c0c0', '#a8a8a8', '#909090', '#787878', '#606060', '#484848', '#303030', '#181818', '#000000',
    /* Primary spectrum */
    '#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00', '#ccff00', '#99ff00', '#66ff00', '#33ff00',
    '#00ff00', '#00ff33', '#00ff66', '#00ff99', '#00ffcc', '#00ffff', '#00ccff', '#0099ff', '#0066ff', '#0033ff',
    '#0000ff', '#3300ff', '#6600ff', '#9900ff', '#cc00ff', '#ff00ff', '#ff00cc', '#ff0099', '#ff0066', '#ff0033',
    /* Pastel row */
    '#ffcccc', '#ffd9cc', '#ffe6cc', '#fff2cc', '#ffffcc', '#f2ffcc', '#e5ffcc', '#ccffcc', '#ccffe5', '#ccfff2',
    '#ccffff', '#ccf2ff', '#cce5ff', '#ccd9ff', '#ccccff', '#d9ccff', '#e5ccff', '#f2ccff', '#ffccff', '#ffccf2',
    /* Muted mid-tones */
    '#cc0000', '#cc3300', '#cc6600', '#cc9900', '#cccc00', '#66cc00', '#00cc00', '#00cc66', '#00cccc', '#0066cc',
    '#0000cc', '#6600cc', '#cc00cc', '#cc0066',
    /* Deep/dark */
    '#800000', '#804000', '#808000', '#408000', '#008000', '#008040', '#008080', '#004080', '#000080', '#400080',
    '#800080', '#800040',
    /* Browns / wood */
    '#8b4513', '#a0522d', '#cd853f', '#deb887', '#d2691e', '#c19a6b', '#7b4f28', '#4a2f1a',
    /* Teals / emerald */
    '#006400', '#228b22', '#2e8b57', '#20b2aa', '#008b8b', '#008080',
    /* Special */
    '#ffd700', '#c0c0c0', '#b8860b', '#ff8c00',
    /* None/transparent */
    'transparent',
];

/* ── State ─────────────────────────────────────────────────── */
let canvas;
let currentArtworkId = null;
let activeRightTab = 'tools';
let activeTool = 'select';
let activeShapeType = 'rect';
let isDrawingShape = false;
let shapeOrigin = null;
let shapeCurrent = null;
let dragSrcIdx = null;
let _pathBeingCreated = false;
let _clipboard = null;   /* ✅ FIX 7: internal clipboard */
let _eraserBgColor = '#1a1a22';

const histStack = [];
let histCursor = -1;
let histLocked = false;
const MAX_HIST = 40;

const brush = { color: '#ff5555', width: 5 };

/* ── CSRF ──────────────────────────────────────────────────── */
const CSRF = () =>
    document.querySelector('meta[name="csrf-token"]')?.content
    || document.querySelector('input[name="__RequestVerificationToken"]')?.value
    || '';

/* ═══════════════════════════════════════════════════════════
   FORCE INTERACTIVE
   ═══════════════════════════════════════════════════════════ */
function forceInteractive(obj) {
    if (!obj) return;
    obj.set({
        selectable: true, hasControls: true, hasBorders: true,
        lockScalingX: false, lockScalingY: false,
        lockRotation: false, lockMovementX: false, lockMovementY: false,
        evented: true,
        borderColor: '#5d7cf8', cornerColor: '#5d7cf8',
        cornerSize: 10, cornerStrokeColor: '#ffffff',
        cornerStyle: 'circle', transparentCorners: false,
        perPixelTargetFind: true, targetFindTolerance: 5,
    });
    obj.setCoords();
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    buildSelects();
    initCanvas();
    loadCoinBalance();
    loadRecentImages();
    applyTheme(localStorage.getItem('akku_theme') || 'dark');
    bindKeyboard();
    bindMobileTouch();
    initNewFeatures();
});

/* ── Select builders ─────────────────────────────────────── */
function buildSelects() {
    const ms = document.getElementById('genModel');
    if (ms) ms.innerHTML = POLLINATIONS_MODELS.map(m =>
        `<option value="${m.value}">${m.label}</option>`).join('');

    const ss = document.getElementById('genStyle');
    if (ss) ss.innerHTML = STYLE_PRESETS.map(s =>
        `<option value="${s}">${s ? s.charAt(0).toUpperCase() + s.slice(1) : 'None (use prompt only)'}</option>`).join('');

    const bm = document.getElementById('pBlend');
    if (bm) bm.innerHTML = BLEND_MODES.map(m =>
        `<option value="${m}">${m}</option>`).join('');
}
// ════════════════════════════════════════════════════════════════
//  ADD THIS to your image-editor.js  — Template URL param loader
//  Place inside DOMContentLoaded or at bottom of your init code
// ════════════════════════════════════════════════════════════════

(function loadTemplateFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (!p.has('prompt')) return;   // not launched from a template

    // ── Helper: safely get element and set value ──
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null && val !== '') el.value = val;
    };

    // ── Apply all template params ──────────────────
    setVal('promptInput', p.get('prompt'));     // your main prompt textarea id
    setVal('negativePrompt', p.get('neg'));         // negative prompt field id
    setVal('modelSelect', p.get('model'));       // flux model dropdown id
    setVal('widthInput', p.get('width'));       // width input id
    setVal('heightInput', p.get('height'));      // height input id
    setVal('stepsInput', p.get('steps'));       // steps/quality input id
    setVal('cfgScale', p.get('cfg'));         // guidance scale id
    if (p.get('seed')) setVal('seedInput', p.get('seed'));

    // ── Visual feedback ────────────────────────────
    const badge = document.createElement('div');
    badge.innerHTML = '🧩 Template loaded — ready to generate!';
    badge.style.cssText = `
        background:#d1fae5;color:#065f46;padding:.5rem 1rem;
        border-radius:.6rem;font-size:.85rem;font-weight:600;
        margin-bottom:.8rem;border:1.5px solid #6ee7b7;
    `;

    // Insert before your generate button or at top of controls
    const promptEl = document.getElementById('promptInput');
    if (promptEl) promptEl.closest('.form-group, .input-group, div')
        ?.parentElement
        ?.insertBefore(badge, promptEl.closest('div'));

    // Auto-scroll to generate area
    if (promptEl) promptEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Clean URL without reload (keeps browser history clean)
    window.history.replaceState({}, '', window.location.pathname);
})();

// ═══════════════════════════════════════════════════════════════════
//  ADD THIS ENTIRE BLOCK to your image-editor.js (at the bottom)
//  OR inside @section Scripts { <script>...</script> } in ImageEditor.cshtml
//
//  ⚠️ IMPORTANT: Replace the getElementById IDs below with your
//  actual element IDs from ImageEditor.cshtml
//  (Check your HTML and match them)
// ═══════════════════════════════════════════════════════════════════

(function applyTemplateFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (!p.has('prompt') || !p.get('prompt')) return;

    console.log('[Template] Applying params:', Object.fromEntries(p));

    // ── Helper ────────────────────────────────────────────────────
    function applyVal(id, val) {
        const el = document.getElementById(id);
        if (!el || val === null || val === undefined || val === '') return false;
        el.value = val;
        // trigger change event so any listeners update
        el.dispatchEvent(new Event('change'));
        el.dispatchEvent(new Event('input'));
        return true;
    }

    // ── REPLACE THESE IDs WITH YOUR ACTUAL ELEMENT IDs ────────────
    // Check your ImageEditor.cshtml for the correct ids
    const ID_PROMPT = 'promptInput';       // main prompt textarea
    const ID_NEG = 'negativePrompt';    // negative prompt input
    const ID_MODEL = 'modelSelect';       // flux model dropdown
    const ID_WIDTH = 'widthInput';        // width number input
    const ID_HEIGHT = 'heightInput';       // height number input
    const ID_STEPS = 'stepsInput';        // steps/quality input or range
    const ID_CFG = 'cfgScale';          // guidance scale input or range
    const ID_SEED = 'seedInput';         // seed input

    applyVal(ID_PROMPT, p.get('prompt'));
    applyVal(ID_NEG, p.get('neg'));
    applyVal(ID_MODEL, p.get('model'));
    applyVal(ID_WIDTH, p.get('width'));
    applyVal(ID_HEIGHT, p.get('height'));
    applyVal(ID_STEPS, p.get('steps'));
    applyVal(ID_CFG, p.get('cfg'));
    if (p.get('seed')) applyVal(ID_SEED, p.get('seed'));

    // ── Show badge ────────────────────────────────────────────────
    const badge = document.createElement('div');
    badge.id = 'templateBadge';
    badge.innerHTML = `
        🧩 <strong>Template loaded!</strong>
        Model: <b>${p.get('model') || 'flux'}</b> · 
        Size: <b>${p.get('width') || 1024}×${p.get('height') || 1024}</b> · 
        Steps: <b>${p.get('steps') || 20}</b> · 
        CFG: <b>${p.get('cfg') || 7.5}</b>
        ${p.get('neg') ? `· Neg: <i>${p.get('neg').substring(0, 40)}…</i>` : ''}
        <button onclick="document.getElementById('templateBadge').remove()" 
                style="float:right;background:none;border:none;cursor:pointer;font-size:1rem">✕</button>
    `;
    badge.style.cssText = `
        background:#d1fae5;color:#065f46;padding:.6rem 1rem;
        border-radius:.6rem;font-size:.84rem;border:1.5px solid #6ee7b7;
        margin-bottom:1rem;position:relative;
    `;

    // Insert at top of page body or before prompt area
    const promptEl = document.getElementById(ID_PROMPT);
    const target = promptEl?.closest('form, .card, .panel, .col, div') ?? document.body;
    target.insertBefore(badge, target.firstChild);

    // Scroll to prompt
    promptEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Clean URL (remove query params without page reload)
    window.history.replaceState({}, '', window.location.pathname);
})();

/* ═══════════════════════════════════════════════════════════
   CANVAS INIT
   ═══════════════════════════════════════════════════════════ */
function initCanvas() {
    const container = document.getElementById('canvasWrap');
    const w = container ? Math.max(container.clientWidth - 40, 400) : 800;
    const h = container ? Math.max(container.clientHeight - 40, 300) : 600;

    canvas = new fabric.Canvas('editorCanvas', {
        width: w, height: h,
        backgroundColor: '#1a1a22',
        preserveObjectStacking: true,
        selection: true,
        selectionColor: 'rgba(93,124,248,0.2)',
        selectionBorderColor: '#5d7cf8',
        cornerColor: '#5d7cf8', cornerSize: 10,
        cornerStrokeColor: '#ffffff', cornerStyle: 'circle',
        transparentCorners: false, borderColor: '#5d7cf8',
        perPixelTargetFind: true, targetFindTolerance: 5,
    });

    /* Patch canvas.add to ensure all objects are interactive */
    const _origAdd = canvas.add.bind(canvas);
    canvas.add = function (...objects) {
        objects.forEach(obj => forceInteractive(obj));
        return _origAdd(...objects);
    };

    /* Event hooks */
    canvas.on('object:added', (e) => { forceInteractive(e.target); if (!histLocked && !_pathBeingCreated) pushHistory(); refreshLayersList(); syncStatus(); });
    canvas.on('object:modified', () => { if (!histLocked) pushHistory(); refreshLayersList(); syncPropsPanel(); });
    canvas.on('object:removed', () => { if (!histLocked) pushHistory(); refreshLayersList(); syncStatus(); });
    canvas.on('selection:created', (e) => { if (e.selected) e.selected.forEach(forceInteractive); syncPropsPanel(); refreshLayersList(); syncStatus(); });
    canvas.on('selection:updated', (e) => { if (e.selected) e.selected.forEach(forceInteractive); syncPropsPanel(); refreshLayersList(); syncStatus(); });
    canvas.on('selection:cleared', () => { onDeselect(); refreshLayersList(); syncStatus(); });
    canvas.on('object:moving', () => { syncPropsPanel(); syncStatus(); });
    canvas.on('object:scaling', () => { syncPropsPanel(); syncStatus(); });
    canvas.on('object:rotating', () => { syncPropsPanel(); syncStatus(); });
    canvas.on('mouse:down', () => { if (activeTool === 'draw' || activeTool === 'eraser') _pathBeingCreated = true; });
    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('path:created', (e) => { forceInteractive(e.path); _pathBeingCreated = false; pushHistory(); refreshLayersList(); });

    /* ✅ Top Property Bar sync on every selection event */
    canvas.on('selection:created', () => syncTopPropBar());
    canvas.on('selection:updated', () => syncTopPropBar());
    canvas.on('selection:cleared', () => syncTopPropBar());
    canvas.on('object:modified', () => syncTopPropBar());
    canvas.on('object:moving', () => syncTopPropBar());
    canvas.on('object:scaling', () => syncTopPropBar());
    canvas.on('object:rotating', () => syncTopPropBar());

    /* Responsive resize */
    new ResizeObserver(() => {
        if (!canvas || !canvas.wrapperEl) return;
        const cont = canvas.wrapperEl.parentElement;
        if (!cont) return;
        canvas.setWidth(Math.max(cont.clientWidth - 40, 300));
        canvas.setHeight(Math.max(cont.clientHeight - 40, 200));
        canvas.calcOffset();
        canvas.renderAll();
        syncStatus();
    }).observe(container || document.body);

    pushHistory();
    setTool('select');
    syncStatus();
    console.log('Canvas ready ✅ v7.0');
}

/* ═══════════════════════════════════════════════════════════
   COIN BALANCE
   ═══════════════════════════════════════════════════════════ */
async function loadCoinBalance() {
    try {
        const r = await fetch('/Coin/Balance');
        const d = await r.json();
        const n = d.balance ?? d.Balance ?? 0;
        const el = document.getElementById('balanceDisplay') || document.getElementById('coinBadge');
        if (el) el.innerText = `⬡ ${n}`;
    } catch {
        const el = document.getElementById('balanceDisplay') || document.getElementById('coinBadge');
        if (el) el.innerText = '⬡ ?';
    }
}

/* ═══════════════════════════════════════════════════════════
   AI IMAGE GENERATION
   ═══════════════════════════════════════════════════════════ */
async function generateAIImage() {
    const prompt = document.getElementById('genPrompt')?.value.trim();
    if (!prompt) { showToast('Please enter a prompt', 'warning'); return; }

    const sizeStr = document.getElementById('genSize')?.value || '1024x1024';
    const [width, height] = sizeStr.split('x').map(Number);
    const style = document.getElementById('genStyle')?.value || '';
    const negative = document.getElementById('genNeg')?.value?.trim() || '';
    const finalPrompt = style ? `${style} style, ${prompt}` : prompt;
    const seedRaw = document.getElementById('genSeed')?.value;
    const seed = seedRaw ? parseInt(seedRaw) : Math.floor(Math.random() * 9999999);
    const model = document.getElementById('genModel')?.value || 'flux';

    const btn = document.getElementById('genBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span style="animation:spin .7s linear infinite;display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;vertical-align:middle;margin-right:6px"></span>Generating…'; }
    const overlay = document.getElementById('genOverlay');
    if (overlay) overlay.style.display = 'flex';

    try {
        const response = await fetch('/ImageGenerator/Generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': CSRF() },
            body: JSON.stringify({ Prompt: finalPrompt, Model: model, Width: width, Height: height, Seed: seed, NegativePrompt: negative || null }),
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`HTTP ${response.status}: ${txt.substring(0, 200)}`);
        }

        const data = await response.json();
        if (data.success && data.url) {
            insertImageUrl(data.url);
            addRecentImage(data.url, finalPrompt);
            showToast('Image generated! 🎉', 'success');
            const bal = data.balance ?? data.newBalance;
            if (bal !== undefined) {
                const badge = document.getElementById('balanceDisplay') || document.getElementById('coinBadge');
                if (badge) badge.innerText = `⬡ ${bal}`;
            }
        } else {
            showToast(data.error || 'Generation failed', 'error');
        }
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa fa-wand-magic-sparkles"></i> Generate'; }
        if (overlay) overlay.style.display = 'none';
    }
}

/* ═══════════════════════════════════════════════════════════
   IMAGE PLACEMENT & INSERT
   ═══════════════════════════════════════════════════════════ */
function placeImageUrl(url) {
    fabric.Image.fromURL(url, (img) => {
        const scale = Math.min((canvas.width * 0.9) / img.width, (canvas.height * 0.9) / img.height, 1);
        img.set({ scaleX: scale, scaleY: scale, left: canvas.width / 2, top: canvas.height / 2, originX: 'center', originY: 'center' });
        canvas.clear();
        canvas.setBackgroundColor('#1a1a22', () => { });
        forceInteractive(img);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        pushHistory();
        refreshLayersList();
    }, { crossOrigin: 'anonymous' });
}

function insertImageUrl(url) {
    fabric.Image.fromURL(url, (img) => {
        const scale = Math.min((canvas.width * 0.65) / img.width, (canvas.height * 0.65) / img.height, 1);
        const jitter = (Math.random() - 0.5) * 60;
        img.set({ scaleX: scale, scaleY: scale, left: canvas.width / 2 + jitter, top: canvas.height / 2 + jitter, originX: 'center', originY: 'center' });
        forceInteractive(img);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        pushHistory();
        refreshLayersList();
    }, { crossOrigin: 'anonymous' });
}

function triggerUpload(insertMode) {
    const inp = document.getElementById('uploadInput');
    if (!inp) return;
    inp.dataset.mode = insertMode ? 'insert' : 'place';
    inp.click();
}

function loadImageFromFile(input) {
    if (!input?.files?.[0]) return;
    const insertMode = input.dataset.mode === 'insert';
    const fr = new FileReader();
    fr.onload = (e) => insertMode ? insertImageUrl(e.target.result) : placeImageUrl(e.target.result);
    fr.readAsDataURL(input.files[0]);
    input.value = '';
}

async function pasteFromClipboard() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                const blob = await item.getType(item.types.find(t => t.startsWith('image/')));
                const url = URL.createObjectURL(blob);
                insertImageUrl(url);
                showToast('Image pasted from clipboard!', 'success');
                return;
            }
        }
        showToast('No image in clipboard', 'warning');
    } catch {
        showToast('Clipboard access denied — use browser paste or upload', 'warning');
    }
}

/* ── Recent images ─────────────────────────────────────────── */
function addRecentImage(url, prompt) {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem('akku_recent') || '[]'); } catch { }
    arr = arr.filter(r => r.url !== url);
    arr.unshift({ url, prompt });
    if (arr.length > 24) arr.length = 24;
    localStorage.setItem('akku_recent', JSON.stringify(arr));
    loadRecentImages();
}

function loadRecentImages() {
    const grid = document.getElementById('recentGrid');
    if (!grid) return;
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem('akku_recent') || '[]'); } catch { }
    if (!arr.length) { grid.innerHTML = '<div class="no-recent">Generate an image to see it here</div>'; return; }
    grid.innerHTML = arr.slice(0, 8).map(r =>
        `<img class="r-thumb" src="${escapeHtml(r.url)}" title="${escapeHtmlAttr(r.prompt)}"
              onclick="insertImageUrl('${escapeHtmlAttr(r.url)}')"
              onerror="this.style.display='none'">`
    ).join('');
}

function openRecentModal() {
    const grid = document.getElementById('recentPickGrid');
    if (grid) {
        let arr = [];
        try { arr = JSON.parse(localStorage.getItem('akku_recent') || '[]'); } catch { }
        if (!arr.length) { grid.innerHTML = '<div class="no-art">No recent images yet — generate some first!</div>'; }
        else grid.innerHTML = arr.map(r =>
            `<img class="rpick-img" src="${escapeHtml(r.url)}" title="${escapeHtmlAttr(r.prompt)}"
                  onclick="insertImageUrl('${escapeHtmlAttr(r.url)}');closeModal('recentModal')"
                  onerror="this.style.display='none'">`
        ).join('');
    }
    openModal('recentModal');
}

function clearAllRecent() {
    localStorage.removeItem('akku_recent');
    loadRecentImages();
    showToast('Recent images cleared', 'info');
}

/* ═══════════════════════════════════════════════════════════
   TOOL MANAGEMENT
   ═══════════════════════════════════════════════════════════ */
function setTool(tool, shapeType) {
    activeTool = tool;
    if (shapeType) activeShapeType = shapeType;

    /* ✅ FIX 5: Eraser tool + draw tool */
    if (tool === 'draw') {
        canvas.isDrawingMode = true;
        if (!canvas.freeDrawingBrush) canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = brush.color;
        canvas.freeDrawingBrush.width = brush.width;
        canvas.selection = false;
    } else if (tool === 'eraser') {
        canvas.isDrawingMode = true;
        if (!canvas.freeDrawingBrush) canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        /* Eraser uses canvas background colour — draws over objects */
        _eraserBgColor = (typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor : '#1a1a22');
        canvas.freeDrawingBrush.color = _eraserBgColor;
        canvas.freeDrawingBrush.width = Math.max(brush.width * 2, 20);
        canvas.selection = false;
    } else {
        canvas.isDrawingMode = false;
        canvas.selection = (tool === 'select');
    }

    canvas.defaultCursor = (tool === 'draw' || tool === 'shape' || tool === 'eraser') ? 'crosshair' : 'default';

    /* Highlight active tool buttons */
    document.querySelectorAll('[data-tool]').forEach(b =>
        b.classList.toggle('active', b.dataset.tool === tool)
    );

    /* Show/hide brush controls */
    const bc = document.getElementById('brushControls');
    if (bc) bc.style.display = (tool === 'draw' || tool === 'eraser') ? 'block' : 'none';

    /* Update eraser indicator label */
    const eraserLabel = document.getElementById('eraserLabel');
    if (eraserLabel) eraserLabel.style.display = (tool === 'eraser') ? 'inline' : 'none';

    syncStatus();
}

function updateBrush() {
    brush.color = document.getElementById('brushColor')?.value || '#ff5555';
    brush.width = parseInt(document.getElementById('brushSize')?.value) || 5;
    if (canvas.freeDrawingBrush && activeTool === 'draw') {
        canvas.freeDrawingBrush.color = brush.color;
        canvas.freeDrawingBrush.width = brush.width;
    } else if (canvas.freeDrawingBrush && activeTool === 'eraser') {
        canvas.freeDrawingBrush.width = Math.max(brush.width * 2, 20);
    }
    const bsz = document.getElementById('bsz');
    if (bsz) bsz.innerText = brush.width + 'px';
}

/* ═══════════════════════════════════════════════════════════
   SHAPE DRAWING
   ═══════════════════════════════════════════════════════════ */
function onMouseDown(opt) {
    if (activeTool !== 'shape') return;
    isDrawingShape = true;
    shapeOrigin = canvas.getPointer(opt.e);
    const fill = document.getElementById('shapeFill')?.value || '#5d7cf8';
    const stroke = document.getElementById('shapeStroke')?.value || 'transparent';
    const sw = parseInt(document.getElementById('shapeStrokeW')?.value || '0');
    const base = { left: shapeOrigin.x, top: shapeOrigin.y, fill, stroke, strokeWidth: sw, selectable: false, evented: false };

    switch (activeShapeType) {
        case 'rect': shapeCurrent = new fabric.Rect({ ...base, rx: 0, ry: 0 }); break;
        case 'rounded': shapeCurrent = new fabric.Rect({ ...base, rx: 12, ry: 12 }); break;
        case 'circle': shapeCurrent = new fabric.Ellipse({ ...base, rx: 0, ry: 0 }); break;
        case 'triangle': shapeCurrent = new fabric.Triangle({ ...base }); break;
        case 'line': shapeCurrent = new fabric.Line(
            [shapeOrigin.x, shapeOrigin.y, shapeOrigin.x, shapeOrigin.y],
            { stroke: fill, strokeWidth: sw || 3, selectable: false, evented: false }); break;
        case 'star': shapeCurrent = new fabric.Polygon(
            _starPts(shapeOrigin.x, shapeOrigin.y, 5, 1, 0.45),
            { ...base }); break;
    }
    if (shapeCurrent) canvas.add(shapeCurrent);
}

function onMouseMove(opt) {
    if (!isDrawingShape || !shapeCurrent) return;
    const ptr = canvas.getPointer(opt.e);
    const w = Math.abs(ptr.x - shapeOrigin.x);
    const h = Math.abs(ptr.y - shapeOrigin.y);
    const l = Math.min(ptr.x, shapeOrigin.x);
    const t = Math.min(ptr.y, shapeOrigin.y);

    if (activeShapeType === 'circle') shapeCurrent.set({ rx: w / 2, ry: h / 2, left: l, top: t });
    else if (activeShapeType === 'line') shapeCurrent.set({ x2: ptr.x, y2: ptr.y });
    else if (activeShapeType === 'star') shapeCurrent.set({ points: _starPts(shapeOrigin.x, shapeOrigin.y, 5, Math.max(w, h) / 2, Math.max(w, h) / 2 * 0.45), left: l, top: t });
    else shapeCurrent.set({ left: l, top: t, width: w, height: h });
    canvas.renderAll();
}

function onMouseUp() {
    if (!isDrawingShape) return;
    isDrawingShape = false;
    if (shapeCurrent) {
        forceInteractive(shapeCurrent);
        canvas.setActiveObject(shapeCurrent);
        canvas.renderAll();
        shapeCurrent = shapeOrigin = null;
        setTool('select');
        pushHistory();
        refreshLayersList();
    }
}

function _starPts(cx, cy, n, outerR, innerR) {
    const pts = []; let a = -Math.PI / 2;
    const step = Math.PI / n;
    for (let i = 0; i < n * 2; i++, a += step) {
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return pts;
}

/* ═══════════════════════════════════════════════════════════
   TEXT & EMOJI
   ═══════════════════════════════════════════════════════════ */
function addText() {
    const t = new fabric.IText('Edit me', {
        left: canvas.width / 2, top: canvas.height / 2,
        originX: 'center', originY: 'center',
        fontSize: 52, fill: '#ffffff', fontFamily: 'Arial',
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 6, offsetX: 2, offsetY: 2 }),
    });
    forceInteractive(t);
    canvas.add(t);
    canvas.setActiveObject(t);
    t.enterEditing();
    canvas.renderAll();
}

function openEmojiPicker() {
    const grid = document.getElementById('emojiGrid');
    if (grid) grid.innerHTML = EMOJIS.map(e =>
        `<span class="emoji-item" onclick="insertEmoji('${e}')">${e}</span>`
    ).join('');
    openModal('emojiModal');
}

function insertEmoji(emoji) {
    const t = new fabric.IText(emoji, {
        left: canvas.width / 2 + (Math.random() - 0.5) * 100,
        top: canvas.height / 2 + (Math.random() - 0.5) * 100,
        originX: 'center', originY: 'center',
        fontSize: 72,
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Twemoji Mozilla, sans-serif',
    });
    forceInteractive(t);
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.renderAll();
    closeModal('emojiModal');
    pushHistory();
    refreshLayersList();
}

/* ═══════════════════════════════════════════════════════════
   FILTERS
   ═══════════════════════════════════════════════════════════ */
const FILTER_MAP = {
    grayscale: () => new fabric.Image.filters.Grayscale(),
    sepia: () => new fabric.Image.filters.Sepia(),
    blur: () => new fabric.Image.filters.Blur({ blur: 0.35 }),
    sharpen: () => new fabric.Image.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }),
    brightness: () => new fabric.Image.filters.Brightness({ brightness: 0.15 }),
    contrast: () => new fabric.Image.filters.Contrast({ contrast: 0.25 }),
    saturate: () => new fabric.Image.filters.Saturation({ saturation: 0.5 }),
    invert: () => new fabric.Image.filters.Invert(),
    noise: () => new fabric.Image.filters.Noise({ noise: 80 }),
    pixelate: () => new fabric.Image.filters.Pixelate({ blocksize: 8 }),
    emboss: () => new fabric.Image.filters.Convolute({ matrix: [-2, -1, 0, -1, 1, 1, 0, 1, 2] }),
};

function applyFilter(type) {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') { showToast('Select an image layer first', 'warning'); return; }
    const fFactory = FILTER_MAP[type];
    if (!fFactory) return;
    obj.filters.push(fFactory());
    obj.applyFilters();
    canvas.renderAll();
    pushHistory();
    showToast(`Filter: ${type}`, 'success');
}

function clearFilters() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') { showToast('Select an image layer', 'warning'); return; }
    obj.filters = [];
    obj.applyFilters();
    canvas.renderAll();
    pushHistory();
    showToast('Filters cleared', 'info');
}

/* ═══════════════════════════════════════════════════════════
   OBJECT OPERATIONS
   ═══════════════════════════════════════════════════════════ */
function deleteSelected() {
    const objs = canvas.getActiveObjects();
    if (!objs.length) { showToast('Nothing selected', 'warning'); return; }
    objs.forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistory();
    refreshLayersList();
}

function duplicateSelected() {
    const obj = canvas.getActiveObject();
    if (!obj) { showToast('Nothing selected', 'warning'); return; }
    obj.clone((cl) => {
        cl.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
        forceInteractive(cl);
        canvas.add(cl);
        canvas.setActiveObject(cl);
        canvas.renderAll();
        pushHistory();
        refreshLayersList();
    });
}

/* ✅ FIX 7: Copy/Paste using internal clipboard */
function copySelected() {
    const obj = canvas.getActiveObject();
    if (!obj) { showToast('Nothing selected to copy', 'warning'); return; }
    obj.clone((cloned) => {
        _clipboard = cloned;
        showToast('Copied! ✅', 'success');
    });
}

function pasteClipboardLocal() {
    if (!_clipboard) { showToast('Nothing to paste — copy first (Ctrl+C)', 'warning'); return; }
    _clipboard.clone((cloned) => {
        cloned.set({ left: (_clipboard.left || 0) + 20, top: (_clipboard.top || 0) + 20 });
        forceInteractive(cloned);
        canvas.discardActiveObject();
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        pushHistory();
        refreshLayersList();
        showToast('Pasted! ✅', 'success');
        /* Offset clipboard so repeated pastes cascade */
        _clipboard.set({ left: (_clipboard.left || 0) + 20, top: (_clipboard.top || 0) + 20 });
    });
}

function clearCanvas() {
    if (!confirm('Clear the entire canvas?')) return;
    canvas.clear();
    canvas.setBackgroundColor('#1a1a22', () => { });
    canvas.renderAll();
    pushHistory();
    refreshLayersList();
    currentArtworkId = null;
    showToast('Canvas cleared', 'info');
}

function bringForward() { const o = canvas.getActiveObject(); if (o) { canvas.bringForward(o); canvas.renderAll(); refreshLayersList(); } }
function sendBackward() { const o = canvas.getActiveObject(); if (o) { canvas.sendBackwards(o); canvas.renderAll(); refreshLayersList(); } }
function bringToFront() { const o = canvas.getActiveObject(); if (o) { canvas.bringToFront(o); canvas.renderAll(); refreshLayersList(); } }
function sendToBack() { const o = canvas.getActiveObject(); if (o) { canvas.sendToBack(o); canvas.renderAll(); refreshLayersList(); } }

function lockSelected() {
    const o = canvas.getActiveObject(); if (!o) return;
    const locked = !o.lockMovementX;
    o.set({ lockMovementX: locked, lockMovementY: locked, lockScalingX: locked, lockScalingY: locked, lockRotation: locked });
    canvas.renderAll();
    refreshLayersList();
    showToast(locked ? 'Layer locked 🔒' : 'Layer unlocked 🔓', 'info');
}

function groupSelected() {
    const objs = canvas.getActiveObjects();
    if (objs.length < 2) { showToast('Select 2 or more objects to group', 'warning'); return; }
    canvas.discardActiveObject();
    const grp = new fabric.Group(objs, { canvas });
    objs.forEach(o => canvas.remove(o));
    forceInteractive(grp);
    canvas.add(grp);
    canvas.setActiveObject(grp);
    canvas.renderAll();
    pushHistory();
    refreshLayersList();
    showToast(`Grouped ${objs.length} objects`, 'success');
}

function ungroupSelected() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'group') { showToast('Select a group first', 'warning'); return; }
    const items = obj.getObjects();
    obj.destroy();
    canvas.remove(obj);
    items.forEach(o => { o.setCoords(); forceInteractive(o); canvas.add(o); });
    canvas.setActiveObject(new fabric.ActiveSelection(items, { canvas }));
    canvas.renderAll();
    pushHistory();
    refreshLayersList();
    showToast('Ungrouped', 'info');
}

function flipHorizontal() { const o = canvas.getActiveObject(); if (o) { o.set('flipX', !o.flipX); canvas.renderAll(); pushHistory(); } }
function flipVertical() { const o = canvas.getActiveObject(); if (o) { o.set('flipY', !o.flipY); canvas.renderAll(); pushHistory(); } }

function addBorder() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.type !== 'image') { showToast('Select an image first', 'warning'); return; }
    const thick = +(prompt('Border thickness (px):', '8') || '8');
    const color = prompt('Border color (#hex):', '#5d7cf8') || '#5d7cf8';
    const rect = new fabric.Rect({
        left: obj.left, top: obj.top,
        originX: obj.originX || 'center', originY: obj.originY || 'center',
        width: obj.getScaledWidth() + thick * 2,
        height: obj.getScaledHeight() + thick * 2,
        fill: 'transparent', stroke: color, strokeWidth: thick,
    });
    forceInteractive(rect);
    canvas.add(rect);
    canvas.sendToBack(rect);
    canvas.renderAll();
    pushHistory();
}

function addOverlay() {
    const color = prompt('Overlay color (rgba):', 'rgba(93,124,248,0.25)') || 'rgba(93,124,248,0.25)';
    const ov = new fabric.Rect({ left: 0, top: 0, width: canvas.width, height: canvas.height, fill: color, selectable: false, evented: false });
    canvas.add(ov);
    canvas.renderAll();
    pushHistory();
    refreshLayersList();
}

/* ═══════════════════════════════════════════════════════════
   LAYER PANEL
   ═══════════════════════════════════════════════════════════ */
function refreshLayersList() {
    if (activeRightTab !== 'layers') return;
    const list = document.getElementById('layersList');
    if (!list) return;
    const objs = canvas.getObjects();
    const active = canvas.getActiveObject();
    if (!objs.length) { list.innerHTML = '<div class="no-layers">Canvas is empty</div>'; return; }

    list.innerHTML = [...objs].reverse().map((obj, ri) => {
        const idx = objs.length - 1 - ri;
        const icon = LAYER_ICONS[obj.type] || 'fa-shapes';
        const lbl = obj.type === 'i-text' ? (obj.text?.substring(0, 18) || 'Text')
            : obj.type === 'group' ? `Group (${obj.getObjects().length})`
                : obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
        const vis = obj.visible !== false;
        const lock = !!obj.lockMovementX;
        return `<div class="layer-item${obj === active ? ' sel' : ''}" onclick="selectLayerObject(${idx})"
                  draggable="true" ondragstart="dragSrcIdx=${idx}"
                  ondragover="event.preventDefault()" ondrop="layerDrop(${idx})">
                  <i class="fa ${icon} layer-ic"></i>
                  <span class="layer-name" title="${escapeHtml(lbl)}">${escapeHtml(lbl)}</span>
                  ${lock ? '<i class="fa fa-lock" style="font-size:8px;color:var(--warn);flex-shrink:0"></i>' : ''}
                  <button class="layer-eye" onclick="event.stopPropagation();toggleLayerVis(${idx})" title="${vis ? 'Hide' : 'Show'}">
                    <i class="fa ${vis ? 'fa-eye' : 'fa-eye-slash'}"></i>
                  </button>
                </div>`;
    }).join('');
}

function layerDrop(targetIdx) {
    if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
    canvas.moveTo(canvas.getObjects()[dragSrcIdx], targetIdx);
    canvas.renderAll();
    dragSrcIdx = null;
    refreshLayersList();
    pushHistory();
}

function selectLayerObject(idx) {
    const obj = canvas.getObjects()[idx];
    if (!obj) return;
    forceInteractive(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    syncPropsPanel();
    syncTopPropBar();
}

function toggleLayerVis(idx) {
    const obj = canvas.getObjects()[idx];
    if (!obj) return;
    obj.visible = !obj.visible;
    canvas.renderAll();
    refreshLayersList();
}

/* ═══════════════════════════════════════════════════════════
   PROPERTIES PANEL
   ═══════════════════════════════════════════════════════════ */
function syncPropsPanel() {
    if (activeRightTab !== 'props') return;
    const obj = canvas.getActiveObject();
    const noSel = document.getElementById('noSelMsg');
    const form = document.getElementById('propsForm');
    if (!obj) { if (noSel) noSel.style.display = 'block'; if (form) form.style.display = 'none'; return; }
    if (noSel) noSel.style.display = 'none';
    if (form) form.style.display = 'block';

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const txt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };

    set('pX', Math.round(obj.left));
    set('pY', Math.round(obj.top));
    set('pW', Math.round(obj.getScaledWidth()));
    set('pH', Math.round(obj.getScaledHeight()));
    set('pRot', Math.round(obj.angle || 0));
    set('pOp', obj.opacity ?? 1);
    txt('pOpV', Math.round((obj.opacity ?? 1) * 100) + '%');
    set('pBlend', obj.globalCompositeOperation || 'source-over');

    const isText = obj.type === 'i-text' || obj.type === 'text';
    const tp = document.getElementById('textProps');
    if (tp) tp.style.display = isText ? 'block' : 'none';
    if (isText) {
        set('pFont', obj.fontFamily || 'Arial');
        set('pFSize', obj.fontSize || 48);
        const fc = document.getElementById('pFColor');
        if (fc) fc.value = (typeof obj.fill === 'string' && obj.fill.startsWith('#')) ? obj.fill : '#ffffff';
        set('pAlign', obj.textAlign || 'left');
    }
}

function onDeselect() {
    const noSel = document.getElementById('noSelMsg');
    const form = document.getElementById('propsForm');
    if (noSel) noSel.style.display = 'block';
    if (form) form.style.display = 'none';
}

function setProp(prop, val) { const obj = canvas.getActiveObject(); if (!obj) return; obj.set(prop, val); canvas.renderAll(); pushHistory(); }
function setTxtProp(prop, val) { setProp(prop, val); }
function toggleTxtProp(prop, on, off) {
    const obj = canvas.getActiveObject(); if (!obj) return;
    obj.set(prop, obj[prop] === on ? off : on);
    canvas.renderAll(); pushHistory();
}
function toggleTxtBool(prop) {
    const obj = canvas.getActiveObject(); if (!obj) return;
    obj.set(prop, !obj[prop]);
    canvas.renderAll(); pushHistory();
}
function setBlend(val) { setProp('globalCompositeOperation', val); }

/* ═══════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ═══════════════════════════════════════════════════════════ */
function exportCanvas(format) {
    if (!canvas) return;
    if (format === 'svg') { exportAsSVG(); return; }
    const url = canvas.toDataURL({ format: format === 'jpeg' ? 'jpeg' : 'png', quality: 0.95, multiplier: 2 });
    downloadURL(url, `akku-artwork.${format}`);
    showToast(`Exported as ${format.toUpperCase()}`, 'success');
}

// Modern Save As dialog (works in Chrome/Edge 86+, fallback for others)
async function saveFileWithDialog(dataBlob, suggestedName, mimeType = 'image/png') {
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [{ description: 'Image', accept: { [mimeType]: ['.png', '.jpg', '.jpeg', '.svg', '.json'] } }]
            });
            const writable = await handle.createWritable();
            await writable.write(dataBlob);
            await writable.close();
            showToast(`Saved as ${handle.name}`, 'success');
        } catch (err) {
            if (err.name !== 'AbortError') showToast('Save cancelled or failed', 'warning');
        }
    } else {
        // Fallback: use anchor download
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Downloaded as ${suggestedName}`, 'success');
    }
}

// Updated export functions
async function exportCanvas(format) {
    if (!canvas) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dataURL = canvas.toDataURL({ format: format === 'jpeg' ? 'jpeg' : 'png', quality: 0.95, multiplier: 2 });
    const blob = await (await fetch(dataURL)).blob();
    saveFileWithDialog(blob, `akku-artwork.${ext}`, mime);
}

async function exportAsSVG() {
    const svgString = canvas.toSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    saveFileWithDialog(blob, 'akku-artwork.svg', 'image/svg+xml');
}

async function exportProject() {
    const projectData = { version: '7.0', canvas: canvas.toJSON(), ts: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    saveFileWithDialog(blob, 'akku-project.json', 'application/json');
}

function exportAsSVG() {
    const svg = canvas.toSVG();
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'akku-artwork.svg');
    showToast('Exported as SVG', 'success');
}

function exportProject() {
    const data = { version: '7.0', canvas: canvas.toJSON(), ts: new Date().toISOString() };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'akku-project.json');
    showToast('Project exported', 'success');
}

function importProject() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.akku';
    inp.onchange = (e) => {
        const fr = new FileReader();
        fr.onload = (ev) => {
            try {
                const raw = JSON.parse(ev.target.result);
                histLocked = true;
                canvas.loadFromJSON(raw.canvas || raw, () => {
                    canvas.getObjects().forEach(forceInteractive);
                    canvas.renderAll(); histLocked = false;
                    pushHistory(); refreshLayersList();
                    showToast('Project imported!', 'success');
                });
            } catch { showToast('Invalid project file', 'error'); }
        };
        fr.readAsText(e.target.files[0]);
    };
    inp.click();
}

/* ═══════════════════════════════════════════════════════════
   SAVE / LOAD ARTWORK
   ═══════════════════════════════════════════════════════════ */
function openSaveModal() {
    if (!canvas.getObjects().length) { showToast('Canvas is empty', 'warning'); return; }
    const el = document.getElementById('saveTitle');
    if (el) el.value = 'Untitled Artwork';
    const msg = document.getElementById('saveMsg');
    if (msg) msg.innerText = '';
    openModal('saveModal');
}

async function saveArtwork() {
    const title = document.getElementById('saveTitle')?.value?.trim() || 'Untitled';
    const msg = document.getElementById('saveMsg');
    if (msg) msg.innerText = 'Saving…';
    try {
        const thumb = canvas.toDataURL({ format: 'png', quality: 0.5, multiplier: 0.25 });
        const body = { ArtworkId: currentArtworkId || null, Title: title, CanvasJson: JSON.stringify(canvas.toJSON()), ThumbnailBase64: thumb };
        const res = await fetch('/Artwork/Save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'RequestVerificationToken': CSRF() },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) {
            currentArtworkId = data.id;
            closeModal('saveModal');
            showToast('Artwork saved! 💾', 'success');
        } else {
            if (msg) msg.innerText = data.error || 'Save failed';
            showToast(data.error || 'Save failed', 'error');
        }
    } catch (err) {
        if (msg) msg.innerText = 'Error: ' + err.message;
        showToast('Save error: ' + err.message, 'error');
    }
}

async function openLoadModal() {
    const grid = document.getElementById('artGrid');
    if (grid) grid.innerHTML = '<div class="no-art">Loading…</div>';
    openModal('loadModal');
    try {
        const list = await (await fetch('/Artwork/List')).json();
        if (!list.length) { if (grid) grid.innerHTML = '<div class="no-art">No saved artworks yet</div>'; return; }
        if (grid) grid.innerHTML = list.map(a => {
            const dt = new Date(a.updatedAt).toLocaleDateString();
            return `<div class="art-card">
                      <div class="art-thumb-wrap">
                        <img class="art-thumb" src="${escapeHtml(a.thumbnailPath || '')}" loading="lazy"
                             onclick="loadArtwork(${a.id},'${escapeHtmlAttr(a.title)}')"
                             onerror="this.src='/img/no-thumb.png'">
                        <button class="art-del" onclick="delArtwork(${a.id},this)"><i class="fa fa-trash"></i></button>
                      </div>
                      <div class="art-info">
                        <div class="art-n" title="${escapeHtmlAttr(a.title)}">${escapeHtml(a.title)}</div>
                        <div class="art-d">${dt}</div>
                      </div>
                    </div>`;
        }).join('');
    } catch { if (grid) grid.innerHTML = '<div class="no-art">Failed to load</div>'; }
}

async function loadArtwork(id, title) {
    try {
        const data = await (await fetch(`/Artwork/Load/${id}`)).json();
        histLocked = true;
        canvas.loadFromJSON(JSON.parse(data.canvasJson), () => {
            canvas.getObjects().forEach(forceInteractive);
            canvas.renderAll(); histLocked = false;
            currentArtworkId = id;
            pushHistory(); refreshLayersList();
            showToast(`Loaded: ${title}`, 'success');
            closeModal('loadModal');
        });
    } catch { showToast('Failed to load artwork', 'error'); }
}

async function delArtwork(id, btn) {
    if (!confirm('Delete this artwork?')) return;
    const card = btn.closest?.('.art-card');
    if (card) card.style.opacity = '0.4';
    try {
        await fetch(`/Artwork/Delete/${id}`, { method: 'DELETE', headers: { 'RequestVerificationToken': CSRF() } });
        if (card) card.remove();
        if (currentArtworkId === id) currentArtworkId = null;
        showToast('Deleted', 'info');
    } catch { if (card) card.style.opacity = '1'; showToast('Delete failed', 'error'); }
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATES
   ═══════════════════════════════════════════════════════════ */
// ai.js-ல் openTemplatesModal() function replace:
async function openTemplatesModal() {
    // Switch to AI tab and show inline template picker
    const grid = document.getElementById('recentGenGrid');
    grid.innerHTML = '<div style="font-size:10px;color:var(--txt3);padding:4px">Loading templates…</div>';

    const res = await fetch('/api/PromptTemplate/public?pageSize=9&sort=popular');
    const data = await res.json();
    const items = data.items ?? [];

    grid.innerHTML = items.map(t => `
        <div class="rg-item" title="${t.title}"
             onclick="applyTemplate(${JSON.stringify(t).replace(/"/g, '&quot;')})"
             style="position:relative;display:flex;align-items:center;justify-content:center;font-size:9px;text-align:center;padding:2px;">
            ${t.thumbnailUrl
            ? `<img src="${t.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:4px">`
            : `<span style="font-size:18px">${getCategoryEmoji(t.category)}</span>`}
        </div>`).join('');
}

function applyTemplate(t) {
    document.getElementById('genPrompt').value = t.prompt || '';
    document.getElementById('genNeg').value = t.negativePrompt || '';
    document.getElementById('genModel').value = t.fluxModel || 'flux';
    document.getElementById('genSeed').value = t.seed || '';
    if (document.getElementById('genSteps'))
        document.getElementById('genSteps').value = t.steps || 20;
    if (document.getElementById('genCfg'))
        document.getElementById('genCfg').value = t.guidanceScale || 7.5;
    showToast(`🧩 Template: ${t.title}`, 'info');
}

function useTemplate(prompt) {
    const el = document.getElementById('genPrompt');
    if (el) el.value = prompt;
    closeModal('tplModal');
    showToast('Template applied — replace [subject] and generate!', 'info');
}

/* ═══════════════════════════════════════════════════════════
   RIGHT-PANEL TAB TOGGLE
   ═══════════════════════════════════════════════════════════ */
function switchRTab(tab) {
    activeRightTab = tab;
    ['tools', 'layers', 'props'].forEach(t => {
        const key = t.charAt(0).toUpperCase() + t.slice(1);
        const btn = document.getElementById('tab' + key);
        const pane = document.getElementById(t + 'Pane');
        if (btn) btn.classList.toggle('active', t === tab);
        if (pane) pane.style.display = t === tab ? 'flex' : 'none';
    });
    if (tab === 'layers') refreshLayersList();
    if (tab === 'props') syncPropsPanel();
}

function toggleRightPanel() {
    const panel = document.getElementById('rightPanel');
    if (panel) panel.classList.toggle('collapsed');
}

/* ═══════════════════════════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════════════════════════ */
function pushHistory() {
    if (histLocked) return;
    const snap = JSON.stringify(canvas.toJSON());
    if (histStack.length && histStack[histCursor] === snap) return;
    histStack.splice(histCursor + 1);
    histStack.push(snap);
    if (histStack.length > MAX_HIST) histStack.shift();
    histCursor = histStack.length - 1;
    syncHistButtons();
}

function histUndo() { if (histCursor > 0) { histCursor--; restoreHist(); showToast('Undo', 'info'); } }
function histRedo() { if (histCursor < histStack.length - 1) { histCursor++; restoreHist(); showToast('Redo', 'info'); } }

function restoreHist() {
    histLocked = true;
    canvas.loadFromJSON(JSON.parse(histStack[histCursor]), () => {
        canvas.getObjects().forEach(forceInteractive);
        canvas.renderAll(); histLocked = false;
        syncHistButtons(); refreshLayersList(); syncStatus();
    });
}

function syncHistButtons() {
    const u = document.getElementById('undoBtn'); if (u) u.disabled = histCursor <= 0;
    const r = document.getElementById('redoBtn'); if (r) r.disabled = histCursor >= histStack.length - 1;
    const s = document.getElementById('stHist'); if (s) s.innerText = `H ${histCursor + 1}/${histStack.length}`;
}

/* ═══════════════════════════════════════════════════════════
   ZOOM & STATUS
   ═══════════════════════════════════════════════════════════ */
function zoomCanvas(delta) {
    const z = Math.max(0.1, Math.min(8, canvas.getZoom() + delta));
    canvas.setZoom(z); canvas.renderAll(); syncStatus();
}
function resetZoom() {
    canvas.setZoom(1); canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll(); syncStatus();
}
function syncStatus() {
    const st = id => document.getElementById(id);
    const obj = canvas.getActiveObject();
    if (st('stCanvas')) st('stCanvas').innerText = `${canvas.width}×${canvas.height} ${Math.round(canvas.getZoom() * 100)}%`;
    if (st('stTool')) st('stTool').innerText = activeTool;
    if (st('stObjs')) st('stObjs').innerText = `${canvas.getObjects().length} objects`;
    if (st('stObj')) st('stObj').innerText = obj ? `${obj.type} ${Math.round(obj.getScaledWidth())}×${Math.round(obj.getScaledHeight())}` : 'No selection';
    syncTopPropBar();
}

/* ═══════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════ */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icons = document.querySelectorAll('#themeBtn i, #themeIcR');
    icons.forEach(i => i.className = theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon');
    if (canvas) {
        const bg = theme === 'dark' ? '#1a1a22' : '#f0f0f8';
        _eraserBgColor = bg;
        canvas.setBackgroundColor(bg, () => canvas.renderAll());
    }
}
function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next); localStorage.setItem('akku_theme', next);
}

/* ═══════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ✅ FIX 7: Added Ctrl+C (copy) and Ctrl+V (paste)
   ═══════════════════════════════════════════════════════════ */
function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z': e.preventDefault(); e.shiftKey ? histRedo() : histUndo(); break;
                case 'y': e.preventDefault(); histRedo(); break;
                case 'd': e.preventDefault(); duplicateSelected(); break;
                case 'g': e.preventDefault(); groupSelected(); break;
                case 's': e.preventDefault(); openSaveModal(); break;
                case 'c': e.preventDefault(); copySelected(); break;          /* ✅ NEW */
                case 'v': e.preventDefault(); pasteClipboardLocal(); break;   /* ✅ NEW */
                case 'a': e.preventDefault(); canvas.setActiveObject(new fabric.ActiveSelection(canvas.getObjects(), { canvas })); canvas.renderAll(); break;
            }
        } else {
            switch (e.key) {
                case 'Delete': case 'Backspace': deleteSelected(); break;
                case 'v': setTool('select'); break;
                case 'p': setTool('draw'); break;
                case 'e': setTool('eraser'); break;          /* ✅ NEW */
                case 'r': setTool('shape', 'rect'); break;
                case 'c': setTool('shape', 'circle'); break;
                case 't': addText(); break;
                case 'Escape': canvas.discardActiveObject(); canvas.renderAll(); setTool('select'); break;
            }
        }
    });
}

/* ═══════════════════════════════════════════════════════════
   MOBILE TOUCH  (pinch-zoom)
   ═══════════════════════════════════════════════════════════ */
function bindMobileTouch() {
    const wrap = document.getElementById('canvasWrap'); if (!wrap) return;
    let lastDist = 0;
    const getDist = (e) => {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };
    wrap.addEventListener('touchstart', (e) => { if (e.touches.length === 2) lastDist = getDist(e); }, { passive: true });
    wrap.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const dist = getDist(e);
            const z = Math.max(0.2, Math.min(5, canvas.getZoom() * (dist / lastDist)));
            canvas.setZoom(z); lastDist = dist; e.preventDefault();
        }
    }, { passive: false });
}

/* ═══════════════════════════════════════════════════════════
   MODALS & TOASTS
   ═══════════════════════════════════════════════════════════ */
function openModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }

function showToast(message, type = 'info') {
    const dock = document.getElementById('toastDock'); if (!dock) return;
    const typeClass = { success: 't-ok', ok: 't-ok', error: 't-err', err: 't-err', warning: 't-warn', warn: 't-warn', info: 't-info' }[type] || 't-info';
    const el = document.createElement('div');
    el.className = `toast-item ${typeClass}`;
    el.innerText = message;
    dock.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
}

/* ═══════════════════════════════════════════════════════════
   CANVAS SIZE PRESETS
   ✅ FIX 3: All presets mapped to correct pixel dimensions
   ═══════════════════════════════════════════════════════════ */
function applyCanvasSize() {
    const sel = document.getElementById('artCanvasSize');
    const unit = document.getElementById('canvasUnit')?.value || 'px';
    const value = sel?.value;
    if (!value || value === 'current') return;

    /* ✅ All named presets resolve directly to pixels (300 DPI for print) */
    const PRESET_PX = {
        '1920x1080': [1920, 1080],
        '3840x2160': [3840, 2160],
        '2480x3508': [2480, 3508],   // A4  @ 300 DPI
        '2550x3300': [2550, 3300],   // Letter @ 300 DPI
        '1280x720': [1280, 720],
        '800x600': [800, 600],
        'a4mm': [2480, 3508],   // A4  210×297 mm → 300 DPI
        'a5mm': [1748, 2480],   // A5  148×210 mm → 300 DPI
        'letterin': [2550, 3300],   // Letter 8.5×11 in → 300 DPI
        'a4-portrait': [2480, 3508],
        'square1080': [1080, 1080],
        'instagram': [1080, 1350],
        'story': [1080, 1920],
        'banner': [1200, 628],
    };

    let newW, newH;

    if (PRESET_PX[value]) {
        [newW, newH] = PRESET_PX[value];
    } else {
        /* Custom / raw WxH — apply unit conversion */
        const parts = value.split('x');
        if (parts.length !== 2) { showToast('Invalid canvas size', 'error'); return; }
        newW = parseFloat(parts[0]);
        newH = parseFloat(parts[1]);
        if (isNaN(newW) || isNaN(newH)) { showToast('Invalid dimensions', 'error'); return; }

        const DPI = 300;
        if (unit === 'mm') {
            newW = Math.round(newW * DPI / 25.4);
            newH = Math.round(newH * DPI / 25.4);
        } else if (unit === 'in') {
            newW = Math.round(newW * DPI);
            newH = Math.round(newH * DPI);
        } else {
            newW = Math.round(newW);
            newH = Math.round(newH);
        }
    }

    if (newW < 10 || newH < 10 || newW > 10000 || newH > 10000) {
        showToast('Canvas size out of range (10–10000 px)', 'warning'); return;
    }

    /* Scale all objects proportionally */
    const scaleX = newW / canvas.width;
    const scaleY = newH / canvas.height;
    canvas.getObjects().forEach(obj => {
        if (obj === canvas.backgroundImage) return;
        obj.set({
            left: (obj.left || 0) * scaleX,
            top: (obj.top || 0) * scaleY,
            scaleX: (obj.scaleX || 1) * scaleX,
            scaleY: (obj.scaleY || 1) * scaleY,
        });
        obj.setCoords();
    });

    canvas.setWidth(newW);
    canvas.setHeight(newH);
    canvas.calcOffset();
    canvas.renderAll();
    pushHistory();
    syncStatus();
    showToast(`Canvas resized to ${newW}×${newH} px`, 'success');
}

/* ═══════════════════════════════════════════════════════════
   COLOR PALETTE – CorelDraw Style
   ✅ FIX 2 & 4: applyColor works on ALL object types (no type whitelist)
   ✅ FIX 6: Expanded palette with CorelDraw-style swatch strip
   ═══════════════════════════════════════════════════════════ */
function buildColorPalette() {
    /* Right-panel compact swatch grid */
    const swatchDiv = document.getElementById('colorSwatches');
    if (swatchDiv) {
        const BASE = [
            '#000000', '#1a1a1a', '#333333', '#555555', '#808080', '#aaaaaa', '#cccccc', '#ffffff',
            '#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#0099ff', '#6600cc', '#cc00cc', '#ff0066',
            '#cc0000', '#cc4400', '#cc9900', '#009900', '#0066cc', '#4400cc', '#990099', '#cc0044',
            '#ff6666', '#ff9966', '#ffdd88', '#88dd88', '#88bbff', '#aa88ff', '#ff88ff', '#ff88aa',
            '#ffd700', '#c0c0c0', '#b8860b', '#8b4513', '#006400', '#191970', '#800000', '#800080',
        ];
        swatchDiv.innerHTML = BASE.map(c => `
            <div class="cp-swatch" style="background:${c}" title="${c}"
                 onclick="applyPaletteColor('${c}','fill')"
                 oncontextmenu="event.preventDefault();applyPaletteColor('${c}','stroke')"></div>`
        ).join('');
    }
    renderRecentColors();
}

function buildColorPaletteStrip() {
    /* Bottom horizontal CorelDraw-style strip */
    const strip = document.getElementById('colorPaletteStrip');
    if (!strip) return;

    /* Transparent/None swatch first */
    let html = `<div class="cp-strip-swatch none-swatch" title="No fill / Transparent"
                     onclick="applyPaletteColor('transparent','fill')"
                     oncontextmenu="event.preventDefault();applyPaletteColor('transparent','stroke')">
                  <div style="width:100%;height:100%;position:relative;overflow:hidden">
                    <div style="position:absolute;inset:0;background:linear-gradient(to bottom right,transparent 48%,#e33 48%,#e33 52%,transparent 52%)"></div>
                  </div>
                </div>`;

    html += COREL_PALETTE.filter(c => c !== 'transparent').map(c => {
        const isLight = isLightColor(c);
        return `<div class="cp-strip-swatch" style="background:${c}" title="${c}"
                     onclick="applyPaletteColor('${c}','fill')"
                     oncontextmenu="event.preventDefault();applyPaletteColor('${c}','stroke')">
                </div>`;
    }).join('');

    strip.innerHTML = html;
}

function isLightColor(hex) {
    if (!hex || hex === 'transparent') return true;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 128;
}

/* ✅ FIX 2 & 4: No type whitelist – works on rect, ellipse, circle, triangle, path, i-text, text, image, group, etc. */
function applyPaletteColor(hex, target) {
    /* target = 'fill' | 'stroke' */
    addRecentColor(hex);
    const obj = canvas.getActiveObject();
    if (!obj) {
        /* If no object selected and target is brush – still apply */
        if (target === 'fill' || target === 'stroke') {
            showToast(`Select an object first to apply ${target}`, 'warning');
            return;
        }
    }
    if (target === 'fill') {
        obj.set('fill', hex === 'transparent' ? null : hex);
        canvas.renderAll();
        pushHistory();
        /* Sync top bar fill preview */
        syncTopPropBar();
        showToast(`Fill → ${hex}`, 'success');
    } else if (target === 'stroke') {
        obj.set('stroke', hex === 'transparent' ? null : hex);
        if (!obj.strokeWidth || obj.strokeWidth === 0) obj.set('strokeWidth', 1);
        canvas.renderAll();
        pushHistory();
        syncTopPropBar();
        showToast(`Stroke → ${hex}`, 'success');
    }
}

function applyColor(hex) {
    const target = document.getElementById('colorTarget')?.value || 'fill';
    addRecentColor(hex);
    const obj = canvas.getActiveObject();

    if (target === 'fill') {
        if (!obj) { showToast('Select an object to apply fill', 'warning'); return; }
        /* ✅ FIX 2: Removed type whitelist — works on ALL objects */
        obj.set('fill', hex === 'transparent' ? null : hex);
        canvas.renderAll();
        pushHistory();
        syncTopPropBar();
        showToast(`Fill → ${hex}`, 'success');
    } else if (target === 'stroke') {
        if (!obj) { showToast('Select an object to apply stroke', 'warning'); return; }
        obj.set('stroke', hex === 'transparent' ? null : hex);
        if (!obj.strokeWidth || obj.strokeWidth === 0) obj.set('strokeWidth', 1);
        canvas.renderAll();
        pushHistory();
        syncTopPropBar();
        showToast(`Stroke → ${hex}`, 'success');
    } else if (target === 'brush') {
        brush.color = hex;
        if (canvas.freeDrawingBrush && activeTool === 'draw') {
            canvas.freeDrawingBrush.color = hex;
        }
        const bc = document.getElementById('brushColor');
        if (bc) bc.value = hex;
        showToast('Brush color updated', 'success');
    }
}

/* Recent colors */
function getRecentColors() { try { return JSON.parse(localStorage.getItem('akku_recent_colors') || '[]'); } catch { return []; } }
function saveRecentColors(a) { localStorage.setItem('akku_recent_colors', JSON.stringify(a.slice(0, 16))); }
function addRecentColor(hex) {
    let rec = getRecentColors().filter(c => c !== hex);
    rec.unshift(hex);
    saveRecentColors(rec);
    renderRecentColors();
}
function renderRecentColors() {
    const div = document.getElementById('recentColors');
    if (!div) return;
    div.innerHTML = getRecentColors().map(c => `
        <div class="cp-swatch" style="background:${c};width:20px;height:20px" title="${c}"
             onclick="applyColor('${c}')"></div>`
    ).join('');
}
function clearRecentColors() {
    localStorage.removeItem('akku_recent_colors');
    renderRecentColors();
    showToast('Recent colors cleared', 'info');
}

/* ═══════════════════════════════════════════════════════════
   PRINT PREVIEW
   ═══════════════════════════════════════════════════════════ */
function printCanvasPreview() {
    const origWidth = canvas.width;
    const origHeight = canvas.height;
    const scale = Math.max(origWidth / 1200, 1);
    const pc = document.createElement('canvas');
    pc.width = origWidth / scale;
    pc.height = origHeight / scale;
    const ctx = pc.getContext('2d');
    ctx.drawImage(canvas.getElement(), 0, 0, pc.width, pc.height);
    const imgData = pc.toDataURL('image/png');

    const pw = window.open('', '_blank');
    pw.document.write(`<html><head><title>Print Preview – Artwork</title>
    <style>body{margin:0;padding:20px;text-align:center;background:#eee}img{max-width:100%;height:auto;box-shadow:0 4px 12px rgba(0,0,0,.2)}
    @media print{body{margin:0;padding:0;background:white}img{box-shadow:none;max-width:100%;page-break-inside:avoid}}</style></head>
    <body><img src="${imgData}" alt="Artwork Preview">
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)};<\/script></body></html>`);
    pw.document.close();
}

/* ═══════════════════════════════════════════════════════════
   TOP PROPERTY BAR  (CorelDraw style)
   ✅ FIX 1: Bar now positioned ABOVE canvas via CSHTML layout
   ✅ FIX 4: Fill & Stroke color shown and editable in the bar
   ═══════════════════════════════════════════════════════════ */
function syncTopPropBar() {
    const bar = document.getElementById('topPropBar');
    const obj = canvas?.getActiveObject();
    if (bar) {
        bar.style.display = (obj && canvas.getActiveObjects().length === 1) ? 'flex' : 'none';
    }
    if (!bar) return;

    if (!obj || canvas.getActiveObjects().length > 1) {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

    setVal('topX', Math.round(obj.left));
    setVal('topY', Math.round(obj.top));
    setVal('topW', Math.round(obj.getScaledWidth()));
    setVal('topH', Math.round(obj.getScaledHeight()));
    setVal('topRot', Math.round(obj.angle || 0));
    setVal('topOp', obj.opacity ?? 1);
    setTxt('topOpVal', Math.round((obj.opacity ?? 1) * 100) + '%');

    /* ✅ FIX 4: Sync fill and stroke color swatches */
    const fillColor = (typeof obj.fill === 'string') ? obj.fill : (obj.fill ? '#5d7cf8' : 'transparent');
    const strokeColor = (typeof obj.stroke === 'string') ? obj.stroke : (obj.stroke ? '#000000' : 'transparent');
    setStyle('topFillSwatch', 'background', fillColor || 'transparent');
    setStyle('topStrokeSwatch', 'background', strokeColor || 'transparent');

    const topFillInp = document.getElementById('topFillColor');
    const topStrokeInp = document.getElementById('topStrokeColor');
    if (topFillInp && fillColor && fillColor !== 'transparent') topFillInp.value = fillColor;
    if (topStrokeInp && strokeColor && strokeColor !== 'transparent') topStrokeInp.value = strokeColor;

    /* Stroke width */
    setVal('topStrokeW', obj.strokeWidth || 0);

    /* Lock button state */
    const lockBtn = document.getElementById('topLock');
    if (lockBtn) lockBtn.innerHTML = obj.lockMovementX
        ? '<i class="fa fa-lock"></i>' : '<i class="fa fa-lock-open"></i>';

    /* Object type badge */
    const typeBadge = document.getElementById('topObjType');
    if (typeBadge) {
        const typeNames = {
            rect: 'Rectangle', rounded: 'Rounded Rect', ellipse: 'Ellipse', circle: 'Circle',
            triangle: 'Triangle', 'i-text': 'Text', text: 'Text', image: 'Image',
            path: 'Path/Brush', line: 'Line', polygon: 'Polygon', group: 'Group'
        };
        typeBadge.innerText = typeNames[obj.type] || obj.type;
    }
}

function bindTopBarEvents() {
    /* Position & size */
    [['topX', 'left'], ['topY', 'top'], ['topRot', 'angle']].forEach(([id, prop]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => {
            const obj = canvas.getActiveObject(); if (!obj) return;
            obj.set(prop, parseFloat(el.value)); obj.setCoords(); canvas.renderAll(); syncTopPropBar(); pushHistory();
        });
    });

    /* Width */
    const topW = document.getElementById('topW');
    if (topW) topW.addEventListener('change', () => {
        const obj = canvas.getActiveObject(); if (!obj) return;
        const s = parseFloat(topW.value) / obj.getScaledWidth();
        obj.set('scaleX', (obj.scaleX || 1) * s); obj.setCoords(); canvas.renderAll(); syncTopPropBar(); pushHistory();
    });
    /* Height */
    const topH = document.getElementById('topH');
    if (topH) topH.addEventListener('change', () => {
        const obj = canvas.getActiveObject(); if (!obj) return;
        const s = parseFloat(topH.value) / obj.getScaledHeight();
        obj.set('scaleY', (obj.scaleY || 1) * s); obj.setCoords(); canvas.renderAll(); syncTopPropBar(); pushHistory();
    });

    /* Opacity slider */
    const opSlider = document.getElementById('topOp');
    if (opSlider) opSlider.addEventListener('input', () => {
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.set('opacity', parseFloat(opSlider.value)); canvas.renderAll(); syncTopPropBar();
    });

    /* ✅ FIX 4: Fill color picker in top bar */
    const topFill = document.getElementById('topFillColor');
    if (topFill) topFill.addEventListener('input', () => {
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.set('fill', topFill.value);
        document.getElementById('topFillSwatch').style.background = topFill.value;
        canvas.renderAll(); pushHistory();
    });

    /* ✅ FIX 4: Stroke color picker in top bar */
    const topStroke = document.getElementById('topStrokeColor');
    if (topStroke) topStroke.addEventListener('input', () => {
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.set('stroke', topStroke.value);
        document.getElementById('topStrokeSwatch').style.background = topStroke.value;
        canvas.renderAll(); pushHistory();
    });

    /* Stroke width */
    const topStrokeW = document.getElementById('topStrokeW');
    if (topStrokeW) topStrokeW.addEventListener('change', () => {
        const obj = canvas.getActiveObject(); if (!obj) return;
        obj.set('strokeWidth', parseInt(topStrokeW.value) || 0); canvas.renderAll(); pushHistory();
    });

    /* Action buttons */
    const delBtn = document.getElementById('topDelete');
    if (delBtn) delBtn.onclick = () => deleteSelected();
    const dupBtn = document.getElementById('topDuplicate');
    if (dupBtn) dupBtn.onclick = () => duplicateSelected();
    const lockBtn = document.getElementById('topLock');
    if (lockBtn) lockBtn.onclick = () => { lockSelected(); syncTopPropBar(); };
    const copyBtn = document.getElementById('topCopy');
    if (copyBtn) copyBtn.onclick = () => copySelected();
    const topFlipH = document.getElementById('topFlipH');
    if (topFlipH) topFlipH.onclick = () => flipHorizontal();
    const topFlipV = document.getElementById('topFlipV');
    if (topFlipV) topFlipV.onclick = () => flipVertical();
}

/* ═══════════════════════════════════════════════════════════
   INTEGRATION INIT
   ═══════════════════════════════════════════════════════════ */
function initNewFeatures() {
    buildColorPalette();
    buildColorPaletteStrip();
    bindTopBarEvents();

    const applyBtn = document.getElementById('applyArtCanvasSizeBtn');
    if (applyBtn) applyBtn.addEventListener('click', applyCanvasSize);

    /* Ensure syncStatus also calls syncTopPropBar */
    setTimeout(() => syncTopPropBar(), 150);
}

/* ═══════════════════════════════════════════════════════════
   DOM / UTIL HELPERS
   ═══════════════════════════════════════════════════════════ */
function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function escapeHtmlAttr(str) { return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"'); }
function downloadURL(url, fn) { const a = document.createElement('a'); a.href = url; a.download = fn; a.click(); }
function downloadBlob(blob, fn) { const u = URL.createObjectURL(blob); downloadURL(u, fn); setTimeout(() => URL.revokeObjectURL(u), 200); }

/* ── Global exports (for CSHTML onclick handlers) ────────── */
window.generateAIImage = generateAIImage;
window.setTool = setTool;
window.updateBrush = updateBrush;
window.toggleTheme = toggleTheme;
window.zoomCanvas = zoomCanvas;
window.resetZoom = resetZoom;
window.exportCanvas = exportCanvas;
window.exportAsSVG = exportAsSVG;
window.exportProject = exportProject;
window.importProject = importProject;
window.openSaveModal = openSaveModal;
window.saveArtwork = saveArtwork;
window.openLoadModal = openLoadModal;
window.loadArtwork = loadArtwork;
window.delArtwork = delArtwork;
window.openRecentModal = openRecentModal;
window.clearAllRecent = clearAllRecent;
window.triggerUpload = triggerUpload;
window.loadImageFromFile = loadImageFromFile;
window.placeImageUrl = placeImageUrl;
window.insertImageUrl = insertImageUrl;
window.pasteFromClipboard = pasteFromClipboard;
window.addText = addText;
window.openEmojiPicker = openEmojiPicker;
window.insertEmoji = insertEmoji;
window.applyFilter = applyFilter;
window.clearFilters = clearFilters;
window.deleteSelected = deleteSelected;
window.duplicateSelected = duplicateSelected;
window.copySelected = copySelected;       /* ✅ NEW */
window.pasteClipboardLocal = pasteClipboardLocal;/* ✅ NEW */
window.clearCanvas = clearCanvas;
window.bringForward = bringForward;
window.sendBackward = sendBackward;
window.bringToFront = bringToFront;
window.sendToBack = sendToBack;
window.lockSelected = lockSelected;
window.groupSelected = groupSelected;
window.ungroupSelected = ungroupSelected;
window.flipHorizontal = flipHorizontal;
window.flipVertical = flipVertical;
window.addBorder = addBorder;
window.addOverlay = addOverlay;
window.switchRTab = switchRTab;
window.toggleRightPanel = toggleRightPanel;
window.histUndo = histUndo;
window.histRedo = histRedo;
window.openTemplatesModal = openTemplatesModal;
window.useTemplate = useTemplate;
window.selectLayerObject = selectLayerObject;
window.toggleLayerVis = toggleLayerVis;
window.layerDrop = layerDrop;
window.setProp = setProp;
window.setTxtProp = setTxtProp;
window.toggleTxtProp = toggleTxtProp;
window.toggleTxtBool = toggleTxtBool;
window.setBlend = setBlend;
window.openModal = openModal;
window.closeModal = closeModal;
window.newArtwork = clearCanvas;
window.applyCanvasSize = applyCanvasSize;
window.applyColor = applyColor;
window.applyPaletteColor = applyPaletteColor;
window.clearRecentColors = clearRecentColors;
window.printCanvasPreview = printCanvasPreview;
window.syncTopPropBar = syncTopPropBar;