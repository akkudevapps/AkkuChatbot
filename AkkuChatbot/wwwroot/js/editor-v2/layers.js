// wwwroot/js/editor-v2/layers.js
// ═══════════════════════════════════════════════════════════

'use strict';

function updateLayersList() {
    const list = document.getElementById('layersList');
    if (!list) return;

    const objs = AE.canvas.getObjects().slice().reverse();
    if (!objs.length) {
        list.innerHTML = '<div style="padding:14px 10px;text-align:center;font-size:11px;color:var(--txt3)">Canvas is empty</div>';
        return;
    }

    const active = AE.canvas.getActiveObjects();
    list.innerHTML = objs.map((obj, i) => {
        const isSel = active.includes(obj);
        const name = obj.name || getLayerName(obj);
        const ico = getLayerIcon(obj);
        const vis = obj.visible !== false;
        const idx = AE.canvas.getObjects().indexOf(obj);

        return `
        <div class="layer-item ${isSel ? 'sel' : ''}" onclick="selectLayerObj(${idx})"
             draggable="true" ondragstart="layerDragStart(event,${idx})"
             ondragover="event.preventDefault()" ondrop="layerDrop(event,${idx})">
            <span class="layer-ic">${ico}</span>
            <span class="layer-name" ondblclick="renameLayer(this,${idx})">${name}</span>
            <button class="layer-vis" onclick="event.stopPropagation();toggleLayerVis(${idx})"
                title="${vis ? 'Hide' : 'Show'}">
                <i class="fa fa-eye${vis ? '' : '-slash'}"></i>
            </button>
            <button class="layer-lock-btn" onclick="event.stopPropagation();lockLayerIdx(${idx})"
                title="Lock">
                <i class="fa fa-${obj.lockMovementX ? 'lock' : 'lock-open'}"></i>
            </button>
        </div>`;
    }).join('');
}

function getLayerName(obj) {
    switch (obj.type) {
        case 'image': return '📷 Image';
        case 'i-text':
        case 'textbox': return `T "${(obj.text || '').slice(0, 12)}${obj.text?.length > 12 ? '…' : ''}"`;
        case 'rect': return '▭ Rectangle';
        case 'circle': return '● Circle';
        case 'ellipse': return '⬭ Ellipse';
        case 'triangle': return '▲ Triangle';
        case 'polygon': return '⬡ Polygon';
        case 'line': return '— Line';
        case 'path': return '✏ Path';
        case 'group': return `⊞ Group (${obj._objects?.length || 0})`;
        default: return obj.type || 'Object';
    }
}

function getLayerIcon(obj) {
    switch (obj.type) {
        case 'image': return '<i class="fa fa-image"></i>';
        case 'i-text':
        case 'textbox': return '<i class="fa fa-font"></i>';
        case 'group': return '<i class="fa fa-object-group"></i>';
        case 'path': return '<i class="fa fa-pen-nib"></i>';
        default: return '<i class="fa fa-shapes"></i>';
    }
}

function selectLayerObj(idx) {
    const obj = AE.canvas.item(idx);
    if (!obj) return;
    AE.canvas.setActiveObject(obj);
    AE.canvas.renderAll();
    updatePropsPane(obj);
    updateOptionsBar(obj);

    // Sync blend / opacity sliders
    const lb = document.getElementById('layerBlend');
    const lo = document.getElementById('layerOpacity');
    const lv = document.getElementById('layerOpVal');
    if (lb) lb.value = obj.globalCompositeOperation || 'source-over';
    if (lo) lo.value = obj.opacity ?? 1;
    if (lv) lv.textContent = Math.round((obj.opacity ?? 1) * 100) + '%';
}

function toggleLayerVis(idx) {
    const obj = AE.canvas.item(idx);
    if (!obj) return;
    obj.set('visible', obj.visible === false ? true : false);
    AE.canvas.renderAll();
    updateLayersList();
}

function lockLayerIdx(idx) {
    const obj = AE.canvas.item(idx);
    if (!obj) return;
    const lock = !obj.lockMovementX;
    obj.set({
        lockMovementX: lock, lockMovementY: lock,
        lockRotation: lock, lockScalingX: lock, lockScalingY: lock,
        hasControls: !lock
    });
    AE.canvas.renderAll();
    updateLayersList();
}

function renameLayer(el, idx) {
    const obj = AE.canvas.item(idx);
    if (!obj) return;
    const name = prompt('Layer name:', obj.name || '');
    if (name !== null) { obj.name = name; updateLayersList(); }
}

// Drag-to-reorder
function layerDragStart(e, idx) {
    e.dataTransfer.setData('text/plain', idx);
}

function layerDrop(e, targetIdx) {
    const srcIdx = +e.dataTransfer.getData('text/plain');
    if (srcIdx === targetIdx) return;
    const objs = AE.canvas.getObjects();
    const obj = objs[srcIdx];
    AE.canvas.remove(obj);
    // Insert at targetIdx
    AE.canvas.insertAt(obj, targetIdx);
    AE.canvas.renderAll();
    updateLayersList();
    pushHistory('reorder');
}

function addLayer() {
    const rect = new fabric.Rect({
        width: 200, height: 200, fill: 'transparent',
        stroke: '#aaa', strokeWidth: 1, strokeDashArray: [4, 4],
        name: 'New Layer'
    });
    centerObject(rect);
    AE.canvas.add(rect).setActiveObject(rect);
    AE.canvas.renderAll();
    toast('New layer added', 'ok', 800);
}