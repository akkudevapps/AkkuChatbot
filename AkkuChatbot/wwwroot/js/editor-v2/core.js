// wwwroot/js/editor-v2/core.js
// ═══════════════════════════════════════════════════════════
//  AKKU EDITOR V2 — CORE ENGINE
//  Fabric.js canvas, zoom, history (undo/redo), keyboard, state
// ═══════════════════════════════════════════════════════════

'use strict';

/* ── GLOBAL STATE ─────────────────────────────────────────── */
window.AE = window.AE || {};   // namespace
const AE = window.AE;

AE.canvas = null;   // Fabric.Canvas instance
AE.zoom = 1;
AE.fgColor = '#5d7cf8';
AE.bgColor = '#000000';
AE.currentTool = 'select';
AE.clipboard = null;
AE.gridVisible = false;
AE.gridObjs = [];
AE.rulersOn = true;
AE.antiForgery = '';

// History
AE.history = [];
AE.historyPos = -1;
AE.HIST_MAX = 80;
AE.historyPaused = false;

// ── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Anti-forgery token
    const tok = document.querySelector('input[name="__RequestVerificationToken"]');
    if (tok) AE.antiForgery = tok.value;

    // Init Fabric canvas
    AE.canvas = new fabric.Canvas('editorCanvas', {
        width: 1024,
        height: 1024,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        enableRetinaScaling: false,
        selection: true,
    });

    // Wire up events
    AE.canvas.on('object:added', () => { pushHistory('add'); updateLayersList(); updateStatusBar(); });
    AE.canvas.on('object:removed', () => { pushHistory('remove'); updateLayersList(); updateStatusBar(); });
    AE.canvas.on('object:modified', () => { pushHistory('modify'); updateLayersList(); updateStatusBar(); });
    AE.canvas.on('selection:created', onSelectionChange);
    AE.canvas.on('selection:updated', onSelectionChange);
    AE.canvas.on('selection:cleared', onSelectionCleared);
    AE.canvas.on('mouse:move', onCanvasMouseMove);
    AE.canvas.on('mouse:wheel', onCanvasWheel);
    AE.canvas.on('mouse:down', onCanvasMouseDown);
    AE.canvas.on('mouse:up', onCanvasMouseUp);

    // Push initial state
    pushHistory('init');

    // Build palette
    buildPaletteStrip();

    // Build sticker quick grid
    buildStickerGrid('quickStickers', 10);
    buildStickerGrid('stickerGrid', 40);

    // Build frame grid
    buildFrameGrid();

    // Build export formats
    buildExportFormats();

    // Build collage layouts
    buildCollageLayouts();

    // Build text FX grid
    buildTextFxGrid();

    // Init pages
    initPages();

    // Load coin balance
    fetchBalance();

    // Keyboard shortcuts
    document.addEventListener('keydown', onKeyDown);

    // Window paste (Ctrl+V image)
    document.addEventListener('paste', onPaste);

    // Drag & drop onto canvas area
    const wrap = document.getElementById('canvasScrollWrap');
    wrap.addEventListener('dragover', e => e.preventDefault());
    wrap.addEventListener('drop', onCanvasDrop);

    // Zoom to fit on start
    setTimeout(zoomFit, 100);

    // Rulers
    drawRulers();
    AE.canvas.on('after:render', drawRulers);

    toast('Editor V2 Ready', 'ok', 1800);
});

/* ── FETCH BALANCE ────────────────────────────────────────── */
async function fetchBalance() {
    try {
        const r = await fetch('/api/editor-v2/balance');
        if (r.ok) {
            const d = await r.json();
            document.getElementById('coinBadge').textContent = `⬡ ${d.balance}`;
        }
    } catch { }
}

/* ── HISTORY ──────────────────────────────────────────────── */
function pushHistory(label) {
    if (AE.historyPaused) return;
    const json = JSON.stringify(AE.canvas.toJSON(['id', 'name', 'locked', 'layerType']));
    // Trim future if branching
    if (AE.historyPos < AE.history.length - 1)
        AE.history = AE.history.slice(0, AE.historyPos + 1);

    AE.history.push({ label, json });
    if (AE.history.length > AE.HIST_MAX) AE.history.shift();
    AE.historyPos = AE.history.length - 1;

    updateHistoryUI();
    updateStatusBar();
}

function histUndo() {
    if (AE.historyPos <= 0) { toast('Nothing to undo', 'warn'); return; }
    AE.historyPos--;
    restoreHistory(AE.history[AE.historyPos].json);
    updateHistoryUI();
    toast('Undo', 'info', 900);
}

function histRedo() {
    if (AE.historyPos >= AE.history.length - 1) { toast('Nothing to redo', 'warn'); return; }
    AE.historyPos++;
    restoreHistory(AE.history[AE.historyPos].json);
    updateHistoryUI();
    toast('Redo', 'info', 900);
}

function histClear() {
    AE.history = [];
    AE.historyPos = -1;
    pushHistory('clear');
    updateHistoryUI();
}

function restoreHistory(json) {
    AE.historyPaused = true;
    AE.canvas.loadFromJSON(json, () => {
        AE.canvas.renderAll();
        updateLayersList();
        updateStatusBar();
        AE.historyPaused = false;
    });
}

function updateHistoryUI() {
    // History list pane
    const el = document.getElementById('historyList');
    if (!el) return;
    if (AE.history.length === 0) {
        el.innerHTML = '<div style="padding:14px;text-align:center;font-size:11px;color:var(--txt3)">No history</div>';
        return;
    }
    el.innerHTML = AE.history.map((h, i) => `
        <div class="layer-item ${i === AE.historyPos ? 'sel' : ''}"
             onclick="jumpHistory(${i})" style="cursor:pointer">
            <i class="fa fa-clock-rotate-left layer-ic" style="font-size:10px"></i>
            <span class="layer-name">${i + 1}. ${h.label}</span>
            ${i === AE.historyPos ? '<i class="fa fa-caret-left" style="color:var(--acc);font-size:10px"></i>' : ''}
        </div>`).reverse().join('');

    document.getElementById('stHist').textContent =
        `H:${AE.historyPos + 1}/${AE.history.length}`;
}

function jumpHistory(idx) {
    AE.historyPos = idx;
    restoreHistory(AE.history[idx].json);
    updateHistoryUI();
}

/* ── SELECTION EVENTS ─────────────────────────────────────── */
function onSelectionChange(e) {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    updateOptionsBar(obj);
    updatePropsPane(obj);
    updateLayersList();
}

function onSelectionCleared() {
    document.getElementById('stSel').textContent = 'No selection';
    document.getElementById('noSelMsg2').style.display = 'block';
    document.getElementById('propsForm2').style.display = 'none';
    updateLayersList();
}

/* ── OPTIONS BAR UPDATE ───────────────────────────────────── */
function updateOptionsBar(obj) {
    if (!obj) return;
    const b = obj.getBoundingRect();
    setVal('obW', Math.round(obj.getScaledWidth()));
    setVal('obH', Math.round(obj.getScaledHeight()));
    setVal('obX', Math.round(obj.left));
    setVal('obY', Math.round(obj.top));
    setVal('obRot', Math.round(obj.angle || 0));
    setVal('obStrokeW', obj.strokeWidth || 0);

    if (obj.fill && typeof obj.fill === 'string') {
        const fi = document.getElementById('obFill');
        const ii = document.getElementById('obFillInner');
        if (fi) fi.value = rgbToHex(obj.fill);
        if (ii) ii.style.background = obj.fill;
    }

    document.getElementById('stSel').textContent =
        `${obj.type} ${Math.round(b.width)}×${Math.round(b.height)}`;
    document.getElementById('stObjs').textContent =
        `${AE.canvas.getObjects().length} obj`;
}

/* ── PROPERTIES PANE ──────────────────────────────────────── */
function updatePropsPane(obj) {
    if (!obj) return;
    const ns = document.getElementById('noSelMsg2');
    const pf = document.getElementById('propsForm2');
    const ts = document.getElementById('textPropsSection');
    if (ns) ns.style.display = 'none';
    if (pf) pf.style.display = 'block';

    setVal('pX2', Math.round(obj.left));
    setVal('pY2', Math.round(obj.top));
    setVal('pW2', Math.round(obj.getScaledWidth()));
    setVal('pH2', Math.round(obj.getScaledHeight()));
    setVal('pRot2', Math.round(obj.angle || 0));

    const op2 = document.getElementById('pOp2');
    if (op2) op2.value = obj.opacity ?? 1;
    const opv = document.getElementById('pOpV2');
    if (opv) opv.textContent = Math.round((obj.opacity ?? 1) * 100) + '%';

    if (obj.fill && typeof obj.fill === 'string') {
        const pf2 = document.getElementById('pFill2');
        if (pf2) pf2.value = rgbToHex(obj.fill);
    }
    if (obj.stroke) {
        const ps = document.getElementById('pStroke2');
        if (ps) ps.value = rgbToHex(obj.stroke);
    }
    setVal('pStrokeW2', obj.strokeWidth || 0);

    const pb = document.getElementById('pBlend2');
    if (pb) pb.value = obj.globalCompositeOperation || 'source-over';

    // Text props
    const isText = obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text';
    if (ts) ts.style.display = isText ? 'block' : 'none';
    if (isText) {
        setVal('pFont2', obj.fontFamily || 'Arial');
        setVal('pFSize2', obj.fontSize || 40);
    }
}

function setProp(prop, val) {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    obj.set(prop, val);
    AE.canvas.renderAll();
}

function setPropFromBar(prop, val) {
    setProp(prop, val);
}

function setTxtProp(prop, val) {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    obj.set(prop, val);
    AE.canvas.renderAll();
}

function toggleTxtProp(prop, onVal, offVal) {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    obj.set(prop, obj[prop] === onVal ? offVal : onVal);
    AE.canvas.renderAll();
}

function toggleTxtBool(prop) {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    obj.set(prop, !obj[prop]);
    AE.canvas.renderAll();
}

/* ── MOUSE EVENTS ─────────────────────────────────────────── */
function onCanvasMouseMove(e) {
    const pt = AE.canvas.getPointer(e.e);
    document.getElementById('stPos').textContent =
        `x:${Math.round(pt.x)} y:${Math.round(pt.y)}`;
}

function onCanvasWheel(opt) {
    const e = opt.e;
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoomCanvas(delta);
    }
}

function onCanvasMouseDown(opt) {
    const tool = AE.currentTool;
    if (tool === 'zoom') {
        const pt = AE.canvas.getPointer(opt.e);
        const delta = opt.e.altKey ? -0.25 : 0.25;
        zoomCanvas(delta);
    }
    if (tool === 'hand') {
        AE._panStart = { x: opt.e.clientX, y: opt.e.clientY };
        AE._panActive = true;
    }
    if (tool === 'eyedrop') {
        pickColor(opt);
    }
}

function onCanvasMouseUp() {
    AE._panActive = false;
}

/* ── ZOOM ─────────────────────────────────────────────────── */
function zoomCanvas(delta) {
    let z = AE.zoom + delta;
    z = Math.min(Math.max(z, 0.05), 32);
    AE.zoom = z;
    AE.canvas.setZoom(z);
    AE.canvas.setWidth(AE.canvas.getWidth());
    AE.canvas.setHeight(AE.canvas.getHeight());
    AE.canvas.renderAll();
    updateZoomUI();
    drawRulers();
}

function zoomTo(pct) {
    AE.zoom = pct / 100;
    AE.canvas.setZoom(AE.zoom);
    AE.canvas.renderAll();
    updateZoomUI();
    drawRulers();
}

function zoomFit() {
    const wrap = document.getElementById('canvasScrollWrap');
    const cw = wrap.clientWidth - 40;
    const ch = wrap.clientHeight - 40;
    const zx = cw / AE.canvas.getWidth() * AE.zoom;
    const zy = ch / AE.canvas.getHeight() * AE.zoom;
    AE.zoom = Math.min(zx, zy, 1);
    AE.canvas.setZoom(AE.zoom);
    AE.canvas.renderAll();
    updateZoomUI();
    drawRulers();
}

function zoomActual() {
    zoomTo(100);
}

function updateZoomUI() {
    const pct = Math.round(AE.zoom * 100);
    const inp = document.getElementById('zoomInput');
    if (inp) inp.value = pct;
    document.getElementById('stCanvas').textContent =
        `${AE.canvas.getWidth() / AE.zoom | 0} × ${AE.canvas.getHeight() / AE.zoom | 0}`;
}

/* ── GRID ─────────────────────────────────────────────────── */
function toggleGrid() {
    AE.gridVisible = !AE.gridVisible;
    AE.gridObjs.forEach(o => AE.canvas.remove(o));
    AE.gridObjs = [];

    if (AE.gridVisible) {
        const step = 50;
        const w = AE.canvas.getWidth() / AE.zoom;
        const h = AE.canvas.getHeight() / AE.zoom;
        const opts = {
            stroke: 'rgba(255,255,255,.12)', strokeWidth: 1,
            selectable: false, evented: false, excludeFromExport: true
        };

        for (let x = 0; x <= w; x += step) {
            const l = new fabric.Line([x, 0, x, h], opts);
            AE.canvas.add(l); AE.gridObjs.push(l);
        }
        for (let y = 0; y <= h; y += step) {
            const l = new fabric.Line([0, y, w, y], opts);
            AE.canvas.add(l); AE.gridObjs.push(l);
        }
        AE.gridObjs.forEach(o => AE.canvas.sendToBack(o));
    }
    AE.canvas.renderAll();
    toast(AE.gridVisible ? 'Grid On' : 'Grid Off', 'info', 900);
}

/* ── RULERS ───────────────────────────────────────────────── */
function toggleRulers() {
    AE.rulersOn = !AE.rulersOn;
    const rh = document.getElementById('rulerHWrap');
    const rv = document.getElementById('rulerVWrap');
    const rc = document.querySelector('.canvas-ruler-corner');
    const rr = document.querySelector('.canvas-ruler-row');
    if (rh) rh.style.display = AE.rulersOn ? '' : 'none';
    if (rv) rv.style.display = AE.rulersOn ? '' : 'none';
    if (rc) rc.style.display = AE.rulersOn ? '' : 'none';
    if (rr) rr.style.display = AE.rulersOn ? '' : 'none';
    drawRulers();
    toast(AE.rulersOn ? 'Rulers On' : 'Rulers Off', 'info', 900);
}

function drawRulers() {
    if (!AE.rulersOn) return;

    // Horizontal ruler
    const hw = document.getElementById('rulerHWrap');
    const hc = document.getElementById('rulerH');
    if (!hw || !hc) return;

    const W = hw.clientWidth;
    hc.width = W; hc.height = 16;
    const hx = hc.getContext('2d');
    hx.clearRect(0, 0, W, 16);
    hx.fillStyle = '#2d2d2d';
    hx.fillRect(0, 0, W, 16);

    const step = getSmartStep(AE.zoom);
    const canvasW = AE.canvas.getWidth() / AE.zoom;
    hx.strokeStyle = '#555'; hx.fillStyle = '#666'; hx.font = '8px JetBrains Mono,monospace';

    for (let x = 0; x <= canvasW + step; x += step) {
        const px = x * AE.zoom;
        if (px > W) break;
        hx.beginPath(); hx.moveTo(px, 8); hx.lineTo(px, 16); hx.stroke();
        if (x % (step * 5) === 0) hx.fillText(x, px + 2, 10);
    }

    // Vertical ruler
    const vw = document.getElementById('rulerVWrap');
    const vc = document.getElementById('rulerV');
    if (!vw || !vc) return;
    const H = vw.clientHeight;
    vc.width = 16; vc.height = H;
    const vx = vc.getContext('2d');
    vx.clearRect(0, 0, 16, H);
    vx.fillStyle = '#2d2d2d'; vx.fillRect(0, 0, 16, H);

    const canvasH = AE.canvas.getHeight() / AE.zoom;
    vx.strokeStyle = '#555'; vx.fillStyle = '#666'; vx.font = '8px JetBrains Mono,monospace';
    vx.save(); vx.translate(12, 0); vx.rotate(Math.PI / 2);

    for (let y = 0; y <= canvasH + step; y += step) {
        const py = y * AE.zoom;
        if (py > H) break;
        vx.beginPath(); vx.moveTo(py, 0); vx.lineTo(py, -8); vx.stroke();
        if (y % (step * 5) === 0) vx.fillText(y, py + 2, -4);
    }
    vx.restore();
}

function getSmartStep(zoom) {
    if (zoom > 4) return 10;
    if (zoom > 1.5) return 25;
    if (zoom > 0.5) return 50;
    if (zoom > 0.2) return 100;
    return 250;
}

/* ── KEYBOARD SHORTCUTS ───────────────────────────────────── */
function onKeyDown(e) {
    const active = document.activeElement;
    const isInput = active && (active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' ||
        active.isContentEditable);
    if (isInput) return;

    const ctrl = e.ctrlKey || e.metaKey;

    // Tool shortcuts (no Ctrl needed)
    if (!ctrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
            case 'v': setTool('select'); break;
            case 'b': setTool('draw'); break;
            case 'e': setTool('eraser'); break;
            case 't': setTool('text'); break;
            case 'c': if (!ctrl) setTool('crop'); break;
            case 'u': setTool('shape'); break;
            case 'h': setTool('hand'); break;
            case 'z': setTool('zoom'); break;
            case 'i': setTool('eyedrop'); break;
            case 'j': setTool('inpaint'); break;
            case 'g': setTool('gradient'); break;
            case 'p': setTool('pen'); break;
        }
    }

    if (ctrl) {
        switch (e.key.toLowerCase()) {
            case 'z': e.preventDefault(); histUndo(); break;
            case 'y': e.preventDefault(); histRedo(); break;
            case 's': e.preventDefault(); saveArtwork(); break;
            case 'n': e.preventDefault(); newDocument(); break;
            case 'o': e.preventDefault(); openFileDialog(); break;
            case 'e': e.preventDefault(); openExportModal(); break;
            case 'c': e.preventDefault(); copySelected(); break;
            case 'x': e.preventDefault(); cutSelected(); break;
            case 'v': e.preventDefault(); pasteLocal(); break;
            case 'd': e.preventDefault(); duplicateSelected(); break;
            case 'a': e.preventDefault(); selectAll(); break;
            case 'g': e.preventDefault(); groupSelected(); break;
            case '=':
            case '+': e.preventDefault(); zoomCanvas(.25); break;
            case '-': e.preventDefault(); zoomCanvas(-.25); break;
            case '0': e.preventDefault(); zoomFit(); break;
            case 'r': e.preventDefault(); toggleRulers(); break;
            case "'": e.preventDefault(); toggleGrid(); break;
            case 'p': e.preventDefault(); printCanvasPreview(); break;
        }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInput) { e.preventDefault(); deleteSelected(); }
    }
    if (e.key === 'Escape') {
        AE.canvas.discardActiveObject(); AE.canvas.renderAll();
    }
}

/* ── PASTE IMAGE ──────────────────────────────────────────── */
function onPaste(e) {
    const items = (e.clipboardData || window.clipboardData).items;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            const url = URL.createObjectURL(blob);
            fabric.Image.fromURL(url, img => {
                fitImageToCanvas(img);
                AE.canvas.add(img).setActiveObject(img);
                AE.canvas.renderAll();
                toast('Image pasted', 'ok');
            });
        }
    }
}

/* ── DRAG & DROP ──────────────────────────────────────────── */
function onCanvasDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const url = URL.createObjectURL(file);
        fabric.Image.fromURL(url, img => {
            fitImageToCanvas(img);
            AE.canvas.add(img).setActiveObject(img);
            AE.canvas.renderAll();
            toast(`${file.name} added`, 'ok');
        });
    }
}

/* ── FILE OPEN ────────────────────────────────────────────── */
function openFileDialog() {
    document.getElementById('fileInput').click();
}

function openFileFromInput(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.name.endsWith('.akku')) {
        loadAkkuProject(file); return;
    }
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, img => {
        AE.canvas.setWidth(img.width);
        AE.canvas.setHeight(img.height);
        AE.canvas.setBackgroundColor('#ffffff', AE.canvas.renderAll.bind(AE.canvas));
        fitImageToCanvas(img);
        AE.canvas.add(img).setActiveObject(img);
        AE.canvas.renderAll();
        pushHistory('open');
        updateLayersList();
        toast(`Opened: ${file.name}`, 'ok');
    });
    input.value = '';
}

function fitImageToCanvas(img) {
    const cw = AE.canvas.getWidth() / AE.zoom;
    const ch = AE.canvas.getHeight() / AE.zoom;
    const scale = Math.min(cw / img.width, ch / img.height, 1);
    img.set({
        scaleX: scale,
        scaleY: scale,
        left: (cw - img.width * scale) / 2,
        top: (ch - img.height * scale) / 2
    });
}

/* ── NEW DOCUMENT ─────────────────────────────────────────── */
function newDocument() {
    openModal('newDocModal');
    document.getElementById('saveTitle') && (document.getElementById('saveTitle').value = '');
}

function createNewDocument() {
    const w = +document.getElementById('newDocW').value || 1024;
    const h = +document.getElementById('newDocH').value || 1024;
    const bg = document.getElementById('newDocBg').value || '#ffffff';
    closeModal('newDocModal');

    AE.canvas.clear();
    AE.canvas.setWidth(w);
    AE.canvas.setHeight(h);
    if (bg === 'transparent') {
        AE.canvas.setBackgroundColor(null, AE.canvas.renderAll.bind(AE.canvas));
    } else {
        AE.canvas.setBackgroundColor(bg, AE.canvas.renderAll.bind(AE.canvas));
    }

    AE.pages = [{ id: Date.now(), name: 'Page 1', canvasJson: '', width: w, height: h, bg }];
    AE.currentPage = 0;
    initPages();
    zoomFit();
    pushHistory('new');
    toast('New document created', 'ok');
}

function applyNewDocPreset(val) {
    if (!val) return;
    const [w, h] = val.split('x').map(Number);
    setVal('newDocW', w); setVal('newDocH', h);
}

/* ── CANVAS SIZE ──────────────────────────────────────────── */
function applyCanvasSizePreset(val) {
    if (!val) return;
    const [w, h] = val.split('x').map(Number);
    setVal('canvasW', w); setVal('canvasH', h);
    applyCustomCanvasSize();
}

function applyCustomCanvasSize() {
    const w = +document.getElementById('canvasW').value || 1024;
    const h = +document.getElementById('canvasH').value || 1024;
    AE.canvas.setWidth(w);
    AE.canvas.setHeight(h);
    AE.canvas.renderAll();
    zoomFit();
    pushHistory('resize');
    toast(`Canvas: ${w}×${h}`, 'ok', 1200);
}

/* ── EDIT OPERATIONS ──────────────────────────────────────── */
function deleteSelected() {
    const obj = AE.canvas.getActiveObjects();
    if (!obj.length) return;
    obj.forEach(o => AE.canvas.remove(o));
    AE.canvas.discardActiveObject();
    AE.canvas.renderAll();
    pushHistory('delete');
    toast('Deleted', 'info', 800);
}

function clearCanvas() {
    if (!confirm('Clear all objects?')) return;
    AE.canvas.getObjects().slice().forEach(o => AE.canvas.remove(o));
    AE.canvas.renderAll();
    pushHistory('clear');
    toast('Canvas cleared', 'info');
}

function selectAll() {
    AE.canvas.discardActiveObject();
    const sel = new fabric.ActiveSelection(AE.canvas.getObjects(), { canvas: AE.canvas });
    AE.canvas.setActiveObject(sel);
    AE.canvas.renderAll();
}

function copySelected() {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    obj.clone(clone => { AE.clipboard = clone; toast('Copied', 'info', 700); });
}

function cutSelected() {
    copySelected();
    deleteSelected();
}

function pasteLocal() {
    if (!AE.clipboard) return;
    AE.clipboard.clone(clone => {
        AE.canvas.discardActiveObject();
        clone.set({ left: (clone.left || 0) + 15, top: (clone.top || 0) + 15 });
        if (clone.type === 'activeSelection') {
            clone.canvas = AE.canvas;
            clone.forEachObject(o => AE.canvas.add(o));
            clone.setCoords();
        } else {
            AE.canvas.add(clone);
        }
        AE.clipboard.top += 15;
        AE.clipboard.left += 15;
        AE.canvas.setActiveObject(clone);
        AE.canvas.requestRenderAll();
        toast('Pasted', 'info', 700);
    });
}

function duplicateSelected() {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    obj.clone(clone => {
        clone.set({ left: obj.left + 15, top: obj.top + 15 });
        AE.canvas.add(clone).setActiveObject(clone);
        AE.canvas.renderAll();
        toast('Duplicated', 'info', 700);
    });
}

function bringToFront() {
    const obj = AE.canvas.getActiveObject();
    if (obj) { AE.canvas.bringToFront(obj); AE.canvas.renderAll(); pushHistory('front'); }
}

function sendToBack() {
    const obj = AE.canvas.getActiveObject();
    if (obj) { AE.canvas.sendToBack(obj); AE.canvas.renderAll(); pushHistory('back'); }
}

function flipHorizontal() {
    const obj = AE.canvas.getActiveObject();
    if (obj) { obj.set('flipX', !obj.flipX); AE.canvas.renderAll(); }
}

function flipVertical() {
    const obj = AE.canvas.getActiveObject();
    if (obj) { obj.set('flipY', !obj.flipY); AE.canvas.renderAll(); }
}

function lockSelected() {
    const obj = AE.canvas.getActiveObject();
    if (!obj) return;
    const lock = !obj.lockMovementX;
    obj.set({
        lockMovementX: lock, lockMovementY: lock,
        lockRotation: lock, lockScalingX: lock, lockScalingY: lock,
        hasControls: !lock
    });
    document.getElementById('obLockIc').className = lock ? 'fa fa-lock' : 'fa fa-lock-open';
    AE.canvas.renderAll();
    toast(lock ? 'Locked' : 'Unlocked', 'info', 700);
}

function groupSelected() {
    const sel = AE.canvas.getActiveObject();
    if (!sel || sel.type !== 'activeSelection') {
        toast('Select multiple objects first', 'warn'); return;
    }
    const group = sel.toGroup();
    AE.canvas.setActiveObject(group);
    AE.canvas.renderAll();
    pushHistory('group');
    toast('Grouped', 'ok');
}

function ungroupSelected() {
    const obj = AE.canvas.getActiveObject();
    if (!obj || obj.type !== 'group') { toast('Select a group', 'warn'); return; }
    obj.toActiveSelection();
    AE.canvas.renderAll();
    pushHistory('ungroup');
    toast('Ungrouped', 'ok');
}

function duplicateLayer() {
    duplicateSelected();
}

function mergeDown() {
    toast('Flatten to merge layers', 'info');
    mergeAllLayers();
}

function mergeAllLayers() {
    if (!confirm('Flatten all layers into one image?')) return;
    const dataUrl = AE.canvas.toDataURL({ format: 'png', multiplier: 1 });
    AE.canvas.clear();
    fabric.Image.fromURL(dataUrl, img => {
        img.set({ left: 0, top: 0, selectable: true });
        AE.canvas.add(img).setActiveObject(img);
        AE.canvas.renderAll();
        pushHistory('flatten');
        toast('Flattened', 'ok');
    });
}

/* ── ROTATE / FLIP MODAL ──────────────────────────────────── */
function openRotateModal() {
    const angle = prompt('Rotate canvas by degrees (e.g. 90, -90, 180):', '90');
    if (!angle) return;
    const deg = parseFloat(angle);
    if (isNaN(deg)) return;
    const objs = AE.canvas.getObjects();
    const cx = AE.canvas.getWidth() / 2 / AE.zoom;
    const cy = AE.canvas.getHeight() / 2 / AE.zoom;
    objs.forEach(o => {
        const rad = (deg * Math.PI) / 180;
        const dx = o.left - cx, dy = o.top - cy;
        o.set({
            left: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
            top: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
            angle: (o.angle || 0) + deg
        });
        o.setCoords();
    });
    AE.canvas.renderAll();
    pushHistory('rotate');
    toast(`Rotated ${deg}°`, 'ok');
}

function openResizeModal() {
    openCanvasSizeModal();
}

function openCanvasSizeModal() {
    openModal('newDocModal');
    setVal('newDocW', Math.round(AE.canvas.getWidth() / AE.zoom));
    setVal('newDocH', Math.round(AE.canvas.getHeight() / AE.zoom));
}

/* ── PRINT ────────────────────────────────────────────────── */
function printCanvasPreview() {
    const dataUrl = AE.canvas.toDataURL({ format: 'png' });
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Print</title>
        <style>body{margin:0}img{max-width:100vw}</style></head>
        <body onload="window.print()"><img src="${dataUrl}"></body></html>`);
    win.document.close();
}

/* ── THEME ────────────────────────────────────────────────── */
function toggleTheme() {
    const html = document.documentElement;
    const cur = html.getAttribute('data-theme');
    html.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    toast(`${cur === 'dark' ? 'Light' : 'Dark'} theme`, 'info', 900);
}

/* ── COLOR UTILS ──────────────────────────────────────────── */
function rgbToHex(color) {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color.length === 7 ? color : color + '000000'.slice(color.length - 1);
    const m = color.match(/rgb[a]?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('');
}

function pickColor(opt) {
    const pt = AE.canvas.getPointer(opt.e);
    const ctx = AE.canvas.getContext();
    const px = ctx.getImageData(pt.x * AE.zoom, pt.y * AE.zoom, 1, 1).data;
    const hex = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    setFgColor(hex);
    toast(`Picked: ${hex}`, 'info', 1200);
}

function setFgColor(hex) {
    AE.fgColor = hex;
    const sw = document.getElementById('fgSwatch');
    if (sw) sw.style.background = hex;
    const fp = document.getElementById('fgColorPick');
    if (fp) fp.value = hex;
}

function setBgColor(hex) {
    AE.bgColor = hex;
    const sw = document.getElementById('bgSwatch');
    if (sw) sw.style.background = hex;
    const bp = document.getElementById('bgColorPick');
    if (bp) bp.value = hex;
}

function resetFgBg() {
    setFgColor('#000000');
    setBgColor('#ffffff');
}

function openFgBgPicker() {
    openModal('fgBgModal');
}

function setLayerBlend(val) {
    const obj = AE.canvas.getActiveObject();
    if (obj) { obj.set('globalCompositeOperation', val); AE.canvas.renderAll(); }
}

function setLayerOpacity(val) {
    const obj = AE.canvas.getActiveObject();
    if (obj) { obj.set('opacity', val); AE.canvas.renderAll(); }
}

/* ── COLOR PALETTE STRIP ──────────────────────────────────── */
const PALETTE_COLORS = [
    '#000000', '#2d2d2d', '#555555', '#888', '#bbbbbb', '#ffffff',
    '#cf222e', '#e85d04', '#f4a261', '#ffd166', '#06d6a0', '#2ec4b6',
    '#0096ff', '#7209b7', '#f72585', '#4cc9f0', '#b5838d', '#6d6875',
    '#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#d62828',
    '#023e8a', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#e9f5db',
];

function buildPaletteStrip() {
    const strip = document.getElementById('paletteStrip');
    if (!strip) return;
    strip.innerHTML = PALETTE_COLORS.map(c =>
        `<div class="pal-swatch" style="background:${c}"
              title="${c}"
              onclick="applyPaletteColor(event,'${c}')"></div>`
    ).join('');
}

function applyPaletteColor(e, hex) {
    if (e.shiftKey) {
        setBgColor(hex); return;
    }
    setFgColor(hex);
    const obj = AE.canvas.getActiveObject();
    if (obj) {
        if (obj.type === 'i-text' || obj.type === 'textbox') obj.set('fill', hex);
        else obj.set('fill', hex);
        AE.canvas.renderAll();
        toast(`Fill: ${hex}`, 'info', 800);
    }
}

/* ── STATUS BAR ───────────────────────────────────────────── */
function updateStatusBar() {
    const n = AE.canvas.getObjects().length;
    document.getElementById('stObjs').textContent = `${n} obj`;
    const cw = Math.round(AE.canvas.getWidth() / AE.zoom);
    const ch = Math.round(AE.canvas.getHeight() / AE.zoom);
    document.getElementById('stCanvas').textContent = `${cw} × ${ch}`;
}

/* ── LEFT / RIGHT PANEL TABS ──────────────────────────────── */
function switchLTab(tab) {
    const tabs = { ai: 'lpAI', props: 'lpProps', filters: 'lpFilters', text: 'lpText' };
    const tbtns = { ai: 'ltAI', props: 'ltProps', filters: 'ltFilters', text: 'ltText' };
    Object.values(tabs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    Object.values(tbtns).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const pane = document.getElementById(tabs[tab]);
    const btn = document.getElementById(tbtns[tab]);
    if (pane) pane.style.display = 'flex';
    if (btn) btn.classList.add('active');
}

function switchRTab(tab) {
    const panes = { layers: 'rpLayers', shapes: 'rpShapes', history: 'rpHistory' };
    const btns = { layers: 'rtLayers', shapes: 'rtShapes', history: 'rtHistory' };
    Object.values(panes).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    Object.values(btns).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const pane = document.getElementById(panes[tab]);
    const btn = document.getElementById(btns[tab]);
    if (pane) pane.style.display = 'flex';
    if (btn) btn.classList.add('active');
}

/* ── MODAL HELPERS ────────────────────────────────────────── */
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

/* ── TOAST ────────────────────────────────────────────────── */
function toast(msg, type = 'info', ms = 2500) {
    const dock = document.getElementById('toastDock');
    if (!dock) return;
    const el = document.createElement('div');
    el.className = `toast-item t-${type}`;
    el.textContent = msg;
    dock.appendChild(el);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('show'));
    });
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
    }, ms);
}

/* ── UTILITY ──────────────────────────────────────────────── */
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function showOverlay(msg = 'Processing…') {
    document.getElementById('canvasOverlay').style.display = 'flex';
    document.getElementById('overlayMsg').textContent = msg;
}

function hideOverlay() {
    document.getElementById('canvasOverlay').style.display = 'none';
}

function antiForgeryHeaders() {
    return {
        'Content-Type': 'application/json',
        'RequestVerificationToken': AE.antiForgery
    };
}

function formDataWithToken() {
    const fd = new FormData();
    fd.append('__RequestVerificationToken', AE.antiForgery);
    return fd;
}

/* ── SAVE / LOAD ARTWORK (cloud) ──────────────────────────── */
function saveArtwork() {
    openModal('saveModal');
}

function saveArtworkAs() {
    openModal('saveModal');
}

async function doSaveArtwork() {
    const title = document.getElementById('saveTitle').value.trim();
    if (!title) { toast('Enter a title', 'warn'); return; }

    const msg = document.getElementById('saveMsg');
    if (msg) msg.textContent = 'Saving…';

    const thumb = AE.canvas.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.25 });
    const pages = AE.pages || [];
    // Save current page state
    if (pages.length > 0) pages[AE.currentPage].canvasJson = JSON.stringify(AE.canvas.toJSON());

    const payload = {
        title,
        canvasJson: JSON.stringify({ pages }),
        thumbnailBase64: thumb
    };

    try {
        const r = await fetch('/api/editor-v2/save-artwork', {
            method: 'POST',
            headers: antiForgeryHeaders(),
            body: JSON.stringify(payload)
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Save failed');
        closeModal('saveModal');
        toast(`Saved: ${title}`, 'ok');
        if (msg) msg.textContent = '';
    } catch (err) {
        toast(err.message, 'err');
        if (msg) msg.textContent = err.message;
    }
}

function openLoadModal() {
    openModal('loadModal');
    loadArtworkList();
}

async function loadArtworkList() {
    const grid = document.getElementById('artGrid');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;font-size:11px;color:var(--txt3)">Loading…</div>';
    try {
        const r = await fetch('/api/editor-v2/artworks');
        const arts = await r.json();
        if (!arts.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;font-size:11px;color:var(--txt3)">No saved artworks</div>';
            return;
        }
        grid.innerHTML = arts.map(a => `
            <div style="border:1px solid var(--bdr);border-radius:5px;overflow:hidden;cursor:pointer;transition:all .12s"
                 onclick="loadArtwork(${a.id})" onmouseover="this.style.borderColor='var(--acc)'" onmouseout="this.style.borderColor='var(--bdr)'">
                <div style="width:100%;aspect-ratio:1;background:var(--bg3);overflow:hidden">
                    ${a.thumbnailPath ? `<img src="${a.thumbnailPath}" style="width:100%;height:100%;object-fit:cover">` :
                '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px">🖼️</div>'}
                </div>
                <div style="padding:4px 6px;font-size:10px;color:var(--txt2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.title}</div>
                <div style="padding:0 6px 4px;font-size:9px;color:var(--txt3)">${a.pageCount} page${a.pageCount > 1 ? 's' : ''}</div>
            </div>`).join('');
    } catch {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--err)">Failed to load artworks</div>';
    }
}

async function loadArtwork(id) {
    showOverlay('Loading artwork…');
    try {
        const r = await fetch(`/api/editor-v2/artworks/${id}`);
        const art = await r.json();
        if (!r.ok) throw new Error(art.error);

        const data = JSON.parse(art.canvasJson);
        if (data.pages) {
            AE.pages = data.pages;
            AE.currentPage = 0;
            renderPageList();
            loadPage(0);
        } else {
            AE.canvas.loadFromJSON(art.canvasJson, () => {
                AE.canvas.renderAll();
                pushHistory('load');
            });
        }
        closeModal('loadModal');
        toast(`Loaded: ${art.title}`, 'ok');
        if (document.getElementById('saveTitle'))
            document.getElementById('saveTitle').value = art.title;
    } catch (err) {
        toast(err.message, 'err');
    } finally {
        hideOverlay();
    }
}

/* ── PROJECT EXPORT (.akku zip) ───────────────────────────── */
function exportProject() {
    toast('Preparing .akku project…', 'info');
    const pages = AE.pages || [];
    if (pages.length > 0) pages[AE.currentPage].canvasJson = JSON.stringify(AE.canvas.toJSON());

    const blob = new Blob(
        [JSON.stringify({ version: '2', pages }, null, 2)],
        { type: 'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'artwork.akku';
    a.click();
    toast('Project exported as .akku', 'ok');
}

function loadAkkuProject(file) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            AE.pages = data.pages || [];
            AE.currentPage = 0;
            renderPageList();
            if (AE.pages.length > 0) loadPage(0);
            toast('Project loaded', 'ok');
        } catch {
            toast('Invalid .akku file', 'err');
        }
    };
    reader.readAsText(file);
}

/* ── TEMPLATES MODAL (stub — opens prompt templates page) ─── */
function openTemplatesModal() {
    window.open('/Tools/PromptTemplates', '_blank');
}