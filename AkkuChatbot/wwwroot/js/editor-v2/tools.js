// wwwroot/js/editor-v2/tools.js
// ═══════════════════════════════════════════════════════════
//  TOOL SWITCHING + TOOL-SPECIFIC BEHAVIORS
// ═══════════════════════════════════════════════════════════

'use strict';

/* ── SET TOOL ─────────────────────────────────────────────── */
function setTool(tool) {
    AE.currentTool = tool;

    // Reset canvas modes
    AE.canvas.isDrawingMode = false;
    AE.canvas.selection = true;
    AE.canvas.defaultCursor = 'default';
    AE.canvas.hoverCursor = 'move';

    // Hide inpaint toolbar
    const it = document.getElementById('inpaintToolbar');
    if (it) it.style.display = 'none';

    // Hide crop overlay
    hideCropOverlay();

    switch (tool) {
        case 'select':
            AE.canvas.selection = true;
            AE.canvas.defaultCursor = 'default';
            document.getElementById('stTool').textContent = 'Select';
            break;

        case 'draw':
            AE.canvas.isDrawingMode = true;
            AE.canvas.freeDrawingBrush.color = AE.fgColor;
            AE.canvas.freeDrawingBrush.width = 4;
            AE.canvas.defaultCursor = 'crosshair';
            document.getElementById('stTool').textContent = 'Brush';
            updateOptionsBarForDraw();
            break;

        case 'eraser':
            AE.canvas.isDrawingMode = true;
            AE.canvas.freeDrawingBrush.color = AE.canvas.backgroundColor || '#ffffff';
            AE.canvas.freeDrawingBrush.width = 20;
            AE.canvas.defaultCursor = 'cell';
            document.getElementById('stTool').textContent = 'Eraser';
            break;

        case 'text':
            AE.canvas.selection = false;
            AE.canvas.defaultCursor = 'text';
            document.getElementById('stTool').textContent = 'Text';
            switchLTab('text');
            // Single click to add text
            AE.canvas.once('mouse:down', e => {
                if (AE.currentTool !== 'text') return;
                const pt = AE.canvas.getPointer(e.e);
                const font = document.getElementById('quickFont')?.value || 'Arial';
                const size = +(document.getElementById('quickFontSize')?.value || 40);
                const color = document.getElementById('quickFontColor')?.value || '#ffffff';
                const align = document.getElementById('quickFontAlign')?.value || 'left';
                const content = document.getElementById('quickTextContent')?.value || 'Text';
                const txt = new fabric.IText(content, {
                    left: pt.x, top: pt.y,
                    fontFamily: font, fontSize: size,
                    fill: color, textAlign: align,
                    editable: true
                });
                AE.canvas.add(txt).setActiveObject(txt);
                txt.enterEditing();
                AE.canvas.renderAll();
                setTool('select');
            });
            break;

        case 'shape':
            AE.canvas.selection = false;
            AE.canvas.defaultCursor = 'crosshair';
            document.getElementById('stTool').textContent = 'Shape';
            switchRTab('shapes');
            setTool('select'); // return to select after picking shape
            break;

        case 'crop':
            document.getElementById('stTool').textContent = 'Crop';
            openCropTool();
            break;

        case 'zoom':
            AE.canvas.selection = false;
            AE.canvas.defaultCursor = 'zoom-in';
            document.getElementById('stTool').textContent = 'Zoom';
            break;

        case 'hand':
            AE.canvas.selection = false;
            AE.canvas.defaultCursor = 'grab';
            document.getElementById('stTool').textContent = 'Hand';
            enableHandPan();
            break;

        case 'eyedrop':
            AE.canvas.selection = false;
            AE.canvas.defaultCursor = 'crosshair';
            document.getElementById('stTool').textContent = 'Eyedropper';
            break;

        case 'inpaint':
            openInpaintingTool();
            document.getElementById('stTool').textContent = 'AI Inpaint';
            break;

        case 'gradient':
            document.getElementById('stTool').textContent = 'Gradient';
            applyGradientToSelected();
            setTool('select');
            break;

        case 'pen':
            AE.canvas.isDrawingMode = false;
            document.getElementById('stTool').textContent = 'Pen';
            toast('Click to add path points', 'info', 1200);
            break;
    }

    // Update sidebar active state
    document.querySelectorAll('.ts-tool').forEach(b => {
        b.classList.toggle('active', b.dataset.tool === tool);
    });
}

/* ── DRAW BRUSH OPTIONS BAR UPDATE ───────────────────────── */
function updateOptionsBarForDraw() {
    const ob = document.getElementById('ob-select');
    if (!ob) return;
    // Reuse ob-select for brush settings hint
}

/* ── SHAPES ───────────────────────────────────────────────── */
function addShape(type) {
    const fill = AE.fgColor || '#5d7cf8';
    const stroke = '#000';
    const sw = 0;
    let obj;

    switch (type) {
        case 'rect':
            obj = new fabric.Rect({
                width: 150, height: 100, fill, stroke, strokeWidth: sw,
                rx: 0, ry: 0
            });
            break;
        case 'rounded':
            obj = new fabric.Rect({
                width: 150, height: 100, fill, stroke, strokeWidth: sw,
                rx: 15, ry: 15
            });
            break;
        case 'circle':
            obj = new fabric.Circle({ radius: 70, fill, stroke, strokeWidth: sw });
            break;
        case 'ellipse':
            obj = new fabric.Ellipse({ rx: 100, ry: 60, fill, stroke, strokeWidth: sw });
            break;
        case 'triangle':
            obj = new fabric.Triangle({ width: 120, height: 120, fill, stroke, strokeWidth: sw });
            break;
        case 'star':
            obj = makeStar(5, 70, 35, fill, stroke, sw);
            break;
        case 'line':
            obj = new fabric.Line([0, 0, 150, 0], {
                stroke: fill, strokeWidth: 4,
                selectable: true, evented: true
            });
            break;
        case 'arrow':
            obj = makeArrow(fill);
            break;
        case 'heart':
            obj = makeHeart(fill);
            break;
        case 'diamond':
            obj = makeDiamond(fill);
            break;
        case 'polygon':
            obj = makePolygon(6, 70, fill, stroke, sw);
            break;
        case 'speech':
            obj = makeSpeech(fill);
            break;
        default:
            obj = new fabric.Rect({ width: 100, height: 100, fill, stroke, strokeWidth: sw });
    }

    if (!obj) return;
    centerObject(obj);
    AE.canvas.add(obj).setActiveObject(obj);
    AE.canvas.renderAll();
    pushHistory(`add ${type}`);
    toast(`Added ${type}`, 'ok', 800);
}

function centerObject(obj) {
    const cw = AE.canvas.getWidth() / AE.zoom;
    const ch = AE.canvas.getHeight() / AE.zoom;
    obj.set({
        left: (cw - (obj.width || 100)) / 2,
        top: (ch - (obj.height || 100)) / 2
    });
}

/* ── SHAPE BUILDERS ───────────────────────────────────────── */
function makeStar(points, outerR, innerR, fill, stroke, sw) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const ang = (i * Math.PI) / points - Math.PI / 2;
        pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang) });
    }
    return new fabric.Polygon(pts, {
        fill, stroke, strokeWidth: sw,
        originX: 'center', originY: 'center'
    });
}

function makePolygon(sides, r, fill, stroke, sw) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
        const ang = (2 * Math.PI * i) / sides - Math.PI / 2;
        pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang) });
    }
    return new fabric.Polygon(pts, {
        fill, stroke, strokeWidth: sw,
        originX: 'center', originY: 'center'
    });
}

function makeArrow(fill) {
    return new fabric.Path('M 0 30 L 100 30 L 100 10 L 130 40 L 100 70 L 100 50 L 0 50 Z', {
        fill, stroke: 'none', strokeWidth: 0
    });
}

function makeHeart(fill) {
    return new fabric.Path(
        'M 75 20 A 25 25 0 0 1 125 20 Q 150 45 75 80 Q 0 45 25 20 A 25 25 0 0 1 75 20 Z',
        { fill, stroke: 'none' }
    );
}

function makeDiamond(fill) {
    return new fabric.Polygon(
        [{ x: 75, y: 0 }, { x: 150, y: 75 }, { x: 75, y: 150 }, { x: 0, y: 75 }],
        { fill, stroke: 'none', strokeWidth: 0 }
    );
}

function makeSpeech(fill) {
    return new fabric.Path(
        'M 10 10 Q 10 0 20 0 L 130 0 Q 140 0 140 10 L 140 70 Q 140 80 130 80 L 50 80 L 30 100 L 35 80 L 20 80 Q 10 80 10 70 Z',
        { fill, stroke: 'none', strokeWidth: 0 }
    );
}

/* ── TEXT ─────────────────────────────────────────────────── */
function addTextWithOptions() {
    const content = document.getElementById('quickTextContent')?.value.trim() || 'Your Text';
    const font = document.getElementById('quickFont')?.value || 'Arial';
    const size = +(document.getElementById('quickFontSize')?.value || 40);
    const color = document.getElementById('quickFontColor')?.value || '#ffffff';
    const align = document.getElementById('quickFontAlign')?.value || 'left';

    const txt = new fabric.IText(content, {
        fontFamily: font, fontSize: size, fill: color, textAlign: align,
        left: 50, top: 50, editable: true
    });

    AE.canvas.add(txt).setActiveObject(txt);
    AE.canvas.renderAll();
    pushHistory('add text');
    toast('Text added', 'ok', 800);
}

/* ── GRADIENT TOOL ────────────────────────────────────────── */
function applyGradientToSelected() {
    const obj = AE.canvas.getActiveObject();
    if (!obj) { toast('Select an object first', 'warn'); return; }

    const gradient = new fabric.Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
        colorStops: [
            { offset: 0, color: AE.fgColor },
            { offset: 1, color: AE.bgColor }
        ]
    });
    obj.set('fill', gradient);
    AE.canvas.renderAll();
    pushHistory('gradient');
    toast('Gradient applied', 'ok');
}

/* ── CROP TOOL ────────────────────────────────────────────── */
let _cropStart = null;
let _cropActive = false;

function openCropTool() {
    const obj = AE.canvas.getActiveObject();
    if (!obj) { toast('Select an image first', 'warn'); setTool('select'); return; }
    if (obj.type !== 'image') { toast('Select an image to crop', 'warn'); setTool('select'); return; }

    const overlay = document.getElementById('cropOverlay');
    if (overlay) overlay.style.display = 'block';
    toast('Draw crop region, then press Enter / click Apply', 'info', 3000);

    AE.canvas.selection = false;
    AE.canvas.discardActiveObject();

    // Use mouse events on the wrapper
    const wrap = document.getElementById('canvasScrollWrap');
    wrap._cropObj = obj;

    wrap.addEventListener('mousedown', cropMouseDown);
    wrap.addEventListener('mousemove', cropMouseMove);
    wrap.addEventListener('mouseup', cropMouseUp);

    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && _cropActive) applyCrop(wrap._cropObj);
        if (e.key === 'Escape') hideCropOverlay();
    }, { once: true });
}

function hideCropOverlay() {
    const overlay = document.getElementById('cropOverlay');
    const sel = document.getElementById('cropSelection');
    if (overlay) overlay.style.display = 'none';
    if (sel) sel.style.display = 'none';
    _cropActive = false;
    _cropStart = null;
    const wrap = document.getElementById('canvasScrollWrap');
    wrap.removeEventListener('mousedown', cropMouseDown);
    wrap.removeEventListener('mousemove', cropMouseMove);
    wrap.removeEventListener('mouseup', cropMouseUp);
}

function cropMouseDown(e) {
    const r = e.currentTarget.getBoundingClientRect();
    _cropStart = { x: e.clientX - r.left, y: e.clientY - r.top };
    _cropActive = true;
    const sel = document.getElementById('cropSelection');
    if (sel) {
        sel.style.left = _cropStart.x + 'px';
        sel.style.top = _cropStart.y + 'px';
        sel.style.width = '0px';
        sel.style.height = '0px';
        sel.style.display = 'block';
    }
}

function cropMouseMove(e) {
    if (!_cropActive || !_cropStart) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const sel = document.getElementById('cropSelection');
    if (!sel) return;

    const x = Math.min(_cropStart.x, cx);
    const y = Math.min(_cropStart.y, cy);
    const w = Math.abs(cx - _cropStart.x);
    const h = Math.abs(cy - _cropStart.y);

    sel.style.left = x + 'px';
    sel.style.top = y + 'px';
    sel.style.width = w + 'px';
    sel.style.height = h + 'px';
}

function cropMouseUp(e) {
    if (!_cropActive || !_cropStart) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ex = e.clientX - r.left;
    const ey = e.clientY - r.top;
    const w = Math.abs(ex - _cropStart.x);
    const h = Math.abs(ey - _cropStart.y);
    if (w < 5 || h < 5) { hideCropOverlay(); return; }

    applyCrop(e.currentTarget._cropObj, {
        x: Math.min(_cropStart.x, ex) / AE.zoom,
        y: Math.min(_cropStart.y, ey) / AE.zoom,
        w: w / AE.zoom,
        h: h / AE.zoom
    });
}

function applyCrop(imgObj, region) {
    if (!imgObj || imgObj.type !== 'image') {
        hideCropOverlay(); return;
    }
    hideCropOverlay();

    if (!region) {
        // Get from selection UI
        const sel = document.getElementById('cropSelection');
        if (!sel || sel.style.display === 'none') return;
        const x = parseFloat(sel.style.left) / AE.zoom;
        const y = parseFloat(sel.style.top) / AE.zoom;
        const w = parseFloat(sel.style.width) / AE.zoom;
        const h = parseFloat(sel.style.height) / AE.zoom;
        region = { x, y, w, h };
    }

    // Crop the image using canvas
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = region.w;
    tmpCanvas.height = region.h;
    const ctx = tmpCanvas.getContext('2d');
    const el = imgObj.getElement();
    const sx = (region.x - imgObj.left) / imgObj.scaleX;
    const sy = (region.y - imgObj.top) / imgObj.scaleY;
    const sw = region.w / imgObj.scaleX;
    const sh = region.h / imgObj.scaleY;
    ctx.drawImage(el, sx, sy, sw, sh, 0, 0, region.w, region.h);

    const dataUrl = tmpCanvas.toDataURL('image/png');
    fabric.Image.fromURL(dataUrl, newImg => {
        newImg.set({ left: region.x, top: region.y });
        AE.canvas.remove(imgObj);
        AE.canvas.add(newImg).setActiveObject(newImg);
        AE.canvas.renderAll();
        pushHistory('crop');
        toast('Cropped', 'ok');
    });
}

/* ── HAND PAN ─────────────────────────────────────────────── */
function enableHandPan() {
    let lastX, lastY;
    const wrap = document.getElementById('canvasScrollWrap');

    const md = e => { lastX = e.clientX; lastY = e.clientY; };
    const mm = e => {
        if (AE.currentTool !== 'hand') { cleanup(); return; }
        if (!e.buttons) return;
        wrap.scrollLeft -= e.clientX - lastX;
        wrap.scrollTop -= e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
    };
    const cleanup = () => {
        wrap.removeEventListener('mousedown', md);
        wrap.removeEventListener('mousemove', mm);
    };

    wrap.addEventListener('mousedown', md);
    wrap.addEventListener('mousemove', mm);
}

/* ── AI INPAINTING TOOL ───────────────────────────────────── */
let _inpaintCanvas = null;
let _inpaintCtx = null;
let _inpaintMode = 'brush';
let _inpaintDrawing = false;

function openInpaintingTool() {
    const obj = AE.canvas.getActiveObject();
    if (!obj || obj.type !== 'image') {
        toast('Select an image first', 'warn'); return;
    }

    AE.currentTool = 'inpaint';
    document.querySelectorAll('.ts-tool').forEach(b =>
        b.classList.toggle('active', b.dataset.tool === 'inpaint'));

    const toolbar = document.getElementById('inpaintToolbar');
    if (toolbar) toolbar.style.display = 'flex';
    document.getElementById('stTool').textContent = 'AI Inpaint';
    toast('Paint the area to replace, then click Apply', 'info', 3000);
}

function setInpaintMode(mode) {
    _inpaintMode = mode;
    document.getElementById('inpBrushBtn')?.classList.toggle('active', mode === 'brush');
    document.getElementById('inpEraseBtn')?.classList.toggle('active', mode === 'erase');
}

async function runInpainting() {
    const prompt = document.getElementById('inpPrompt')?.value.trim();
    if (!prompt) { toast('Enter a prompt', 'warn'); return; }

    const obj = AE.canvas.getActiveObject();
    if (!obj || obj.type !== 'image') { toast('Select image first', 'warn'); return; }

    // Export canvas as image + generate mask (simplified: use full image)
    showOverlay('AI Inpainting… ⬡5');

    try {
        const imgDataUrl = obj.toDataURL({ format: 'png' });
        const maskDataUrl = imgDataUrl; // In production: render painted mask

        // Convert to blobs
        const imgBlob = dataUrlToBlob(imgDataUrl);
        const maskBlob = dataUrlToBlob(maskDataUrl);

        const fd = formDataWithToken();
        fd.append('image', imgBlob, 'image.png');
        fd.append('mask', maskBlob, 'mask.png');
        fd.append('prompt', prompt);

        const r = await fetch('/api/editor-v2/inpaint', { method: 'POST', body: fd });
        const d = await r.json();

        if (!r.ok) throw new Error(d.error || 'Inpainting failed');

        // Replace image
        fabric.Image.fromURL(d.url, newImg => {
            newImg.set({
                left: obj.left, top: obj.top,
                scaleX: obj.scaleX, scaleY: obj.scaleY
            });
            AE.canvas.remove(obj);
            AE.canvas.add(newImg).setActiveObject(newImg);
            AE.canvas.renderAll();
            pushHistory('inpaint');
        });

        document.getElementById('coinBadge').textContent = `⬡ ${d.newBalance}`;
        toast(`Inpainting done! ⬡${d.coinsUsed} used`, 'ok');
        setTool('select');
    } catch (err) {
        toast(err.message, 'err');
    } finally {
        hideOverlay();
    }
}

/* ── DATA URL → BLOB ──────────────────────────────────────── */
function dataUrlToBlob(dataUrl) {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
}