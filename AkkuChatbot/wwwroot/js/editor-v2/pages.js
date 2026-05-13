// wwwroot/js/editor-v2/pages.js
// ═══════════════════════════════════════════════════════════
//  MULTI-PAGE MANAGEMENT (max 200 pages)
// ═══════════════════════════════════════════════════════════

'use strict';

function initPages() {
    if (!AE.pages || AE.pages.length === 0) {
        AE.pages = [{
            id: Date.now(),
            name: 'Page 1',
            canvasJson: '',
            width: AE.canvas.getWidth() / AE.zoom || 1024,
            height: AE.canvas.getHeight() / AE.zoom || 1024,
            bg: AE.canvas.backgroundColor || '#ffffff'
        }];
    }
    AE.currentPage = 0;
    renderPageList();
}

function renderPageList() {
    const list = document.getElementById('pageList');
    if (!list) return;

    list.innerHTML = AE.pages.map((page, i) => `
        <div class="page-thumb ${i === AE.currentPage ? 'active' : ''}"
             onclick="switchPage(${i})" id="pthumb_${i}">
            <canvas id="pcanvas_${i}" width="160" height="${Math.round(160 * (page.height / page.width))}"></canvas>
            <div class="page-thumb-label">
                <span>${page.name}</span>
                <button class="page-menu-btn" onclick="event.stopPropagation();pageMenu(event,${i})">
                    <i class="fa fa-ellipsis"></i>
                </button>
            </div>
        </div>`).join('');

    // Draw thumbnails
    AE.pages.forEach((_, i) => drawPageThumb(i));

    // Update info
    document.getElementById('pageInfo').textContent =
        `${AE.currentPage + 1} / ${AE.pages.length}`;
}

function drawPageThumb(idx) {
    const page = AE.pages[idx];
    const el = document.getElementById(`pcanvas_${idx}`);
    if (!el || !page.canvasJson) return;

    try {
        const tmpCanvas = new fabric.StaticCanvas(null, {
            width: 160,
            height: Math.round(160 * (page.height / page.width)),
            enableRetinaScaling: false
        });
        tmpCanvas.loadFromJSON(page.canvasJson, () => {
            tmpCanvas.setZoom(160 / page.width);
            tmpCanvas.renderAll();
            const ctx = el.getContext('2d');
            ctx.clearRect(0, 0, el.width, el.height);
            ctx.drawImage(tmpCanvas.getElement(), 0, 0, el.width, el.height);
            tmpCanvas.dispose();
        });
    } catch (e) {
        // Empty page
        const ctx = el.getContext('2d');
        ctx.fillStyle = page.bg || '#fff';
        ctx.fillRect(0, 0, el.width, el.height);
    }
}

function switchPage(idx) {
    if (idx === AE.currentPage) return;

    // Save current page
    AE.pages[AE.currentPage].canvasJson = JSON.stringify(
        AE.canvas.toJSON(['id', 'name', 'locked', 'layerType'])
    );
    AE.pages[AE.currentPage].width = AE.canvas.getWidth() / AE.zoom;
    AE.pages[AE.currentPage].height = AE.canvas.getHeight() / AE.zoom;
    AE.pages[AE.currentPage].bg = AE.canvas.backgroundColor;

    // Draw thumb for saved page
    drawPageThumb(AE.currentPage);

    // Load new page
    AE.currentPage = idx;
    loadPage(idx);

    // Update UI active state
    document.querySelectorAll('.page-thumb').forEach((el, i) =>
        el.classList.toggle('active', i === idx));

    document.getElementById('pageInfo').textContent =
        `${idx + 1} / ${AE.pages.length}`;
}

function loadPage(idx) {
    const page = AE.pages[idx];
    if (!page) return;

    // Resize canvas
    AE.canvas.setWidth(page.width || 1024);
    AE.canvas.setHeight(page.height || 1024);

    // Load JSON
    if (page.canvasJson) {
        AE.historyPaused = true;
        AE.canvas.loadFromJSON(page.canvasJson, () => {
            AE.canvas.setBackgroundColor(page.bg || '#ffffff',
                AE.canvas.renderAll.bind(AE.canvas));
            AE.historyPaused = false;
            updateLayersList();
            updateStatusBar();
            drawRulers();
        });
    } else {
        AE.canvas.clear();
        AE.canvas.setBackgroundColor(page.bg || '#ffffff',
            AE.canvas.renderAll.bind(AE.canvas));
        updateLayersList();
    }

    // Update canvas size display
    setVal('canvasW', page.width || 1024);
    setVal('canvasH', page.height || 1024);

    zoomFit();
}

function addPage() {
    if (AE.pages.length >= 200) {
        toast('Max 200 pages reached', 'err'); return;
    }

    // Save current
    AE.pages[AE.currentPage].canvasJson = JSON.stringify(AE.canvas.toJSON());
    AE.pages[AE.currentPage].width = AE.canvas.getWidth() / AE.zoom;
    AE.pages[AE.currentPage].height = AE.canvas.getHeight() / AE.zoom;

    const newPage = {
        id: Date.now(),
        name: `Page ${AE.pages.length + 1}`,
        canvasJson: '',
        width: AE.pages[AE.currentPage].width,
        height: AE.pages[AE.currentPage].height,
        bg: '#ffffff'
    };

    AE.pages.push(newPage);
    renderPageList();
    switchPage(AE.pages.length - 1);
    toast(`Page ${AE.pages.length} added`, 'ok');
}

function duplicatePage() {
    if (AE.pages.length >= 200) {
        toast('Max 200 pages reached', 'err'); return;
    }

    // Save current
    AE.pages[AE.currentPage].canvasJson = JSON.stringify(AE.canvas.toJSON());

    const src = AE.pages[AE.currentPage];
    const dup = {
        id: Date.now(),
        name: src.name + ' (copy)',
        canvasJson: src.canvasJson,
        width: src.width,
        height: src.height,
        bg: src.bg
    };

    AE.pages.splice(AE.currentPage + 1, 0, dup);
    renderPageList();
    switchPage(AE.currentPage + 1);
    toast('Page duplicated', 'ok');
}

function deletePage() {
    if (AE.pages.length <= 1) {
        toast('Cannot delete the only page', 'warn'); return;
    }
    if (!confirm(`Delete "${AE.pages[AE.currentPage].name}"?`)) return;

    AE.pages.splice(AE.currentPage, 1);
    const newIdx = Math.max(0, AE.currentPage - 1);
    AE.currentPage = newIdx;
    renderPageList();
    loadPage(newIdx);
    toast('Page deleted', 'info');
}

function pageMenu(e, idx) {
    // Simple actions via prompt
    const action = prompt(`Page ${idx + 1} actions:\n1. Rename\n2. Move Up\n3. Move Down\n4. Delete\n\nEnter number:`, '');
    if (!action) return;
    switch (action.trim()) {
        case '1':
            const name = prompt('New name:', AE.pages[idx].name);
            if (name) { AE.pages[idx].name = name; renderPageList(); }
            break;
        case '2':
            if (idx > 0) {
                [AE.pages[idx], AE.pages[idx - 1]] = [AE.pages[idx - 1], AE.pages[idx]];
                if (AE.currentPage === idx) AE.currentPage--;
                else if (AE.currentPage === idx - 1) AE.currentPage++;
                renderPageList();
            }
            break;
        case '3':
            if (idx < AE.pages.length - 1) {
                [AE.pages[idx], AE.pages[idx + 1]] = [AE.pages[idx + 1], AE.pages[idx]];
                if (AE.currentPage === idx) AE.currentPage++;
                else if (AE.currentPage === idx + 1) AE.currentPage--;
                renderPageList();
            }
            break;
        case '4':
            AE.currentPage = idx;
            deletePage();
            break;
    }
}

function reorderPagesModal() {
    toast('Drag page thumbnails to reorder', 'info', 2000);
}