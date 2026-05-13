/**
 * chat-format.js  —  AkkuChatbot message rendering helpers
 * Place in: wwwroot/js/chat-format.js
 * Razor compiler does NOT process .js files, so regex backslashes are safe here.
 */
/**
 * AkkuChatbot — Enhanced chat-format.js
 * Drop-in replacement for ~/wwwroot/js/chat-format.js
 *
 * Handles:
 *  - Markdown → HTML (bold, italic, code, lists, tables, headings, hr)
 *  - <think> blocks → collapsible details (Reasoning profile)
 *  - Coder profile: copy button on every code block
 *  - Analyst profile: styled table rendering
 *  - Vision profile: structured description layout
 *  - Creative profile: enhanced paragraph typography
 *  - Filler stripper (client-side safety net)
 */

// ══════════════════════════════════════════════════════════════
//  MAIN EXPORT — called from _ChatLayout formatMsg()
// ══════════════════════════════════════════════════════════════
window.chatFormatMsg = function (html, profile) {
    profile = profile || window.activeProfile || 'default';

    // html has already been HTML-escaped by _ChatLayout,
    // but placeholders (__MERMAID_N__, __IMG_N__, __LNK_N__) are intact.
    // We operate on it as raw text with placeholders.

    let out = html;

    // ── 1. <think> blocks (reasoning models) ────────────────────
    out = renderThinkBlocks(out, profile);

    // ── 2. Headings (###, ##, #) ─────────────────────────────────
    out = renderHeadings(out);

    // ── 3. Horizontal rules ───────────────────────────────────────
    out = out.replace(/^(-{3,}|\*{3,})$/gm,
        '<hr style="border:none;border-top:1px solid var(--bdr);margin:12px 0">');

    // ── 4. Tables ─────────────────────────────────────────────────
    out = renderTables(out, profile);

    // ── 5. Fenced code blocks (``` … ```) ────────────────────────
    out = renderCodeBlocks(out, profile);

    // ── 6. Inline code (`…`) ─────────────────────────────────────
    out = out.replace(/`([^`\n]+)`/g,
        '<code style="background:var(--bg3);border:1px solid var(--bdr);border-radius:4px;padding:1px 5px;font-size:.82em;font-family:Consolas,monospace">$1</code>');

    // ── 7. Bold / italic ──────────────────────────────────────────
    out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
    out = out.replace(/__(.+?)__/g, '<strong>$1</strong>');
    out = out.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // ── 8. Lists ──────────────────────────────────────────────────
    out = renderLists(out);

    // ── 9. Paragraphs ────────────────────────────────────────────
    out = renderParagraphs(out, profile);

    return out;
};

// ══════════════════════════════════════════════════════════════
//  <think> BLOCK RENDERER
// ══════════════════════════════════════════════════════════════
function renderThinkBlocks(html, profile) {
    // Match both escaped (&lt;think&gt;) and literal <think> forms
    // The layout escapes HTML so we get the &lt; form
    const pattern = /&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/gi;

    if (profile === 'reasoning') {
        return html.replace(pattern, (_, inner) => `
      <details class="think-block" style="
        margin:8px 0;border:1px solid var(--bdr);border-radius:8px;
        background:var(--bg3);overflow:hidden">
        <summary style="
          cursor:pointer;padding:8px 12px;font-size:.76rem;
          color:var(--txt2);display:flex;align-items:center;gap:6px;
          user-select:none;list-style:none">
          <span style="
            display:inline-block;width:16px;height:16px;border-radius:50%;
            background:var(--acc);color:#fff;font-size:.6rem;
            line-height:16px;text-align:center;flex-shrink:0">▶</span>
          🧠 <strong>Thinking</strong>
          <span style="margin-left:auto;font-size:.68rem;opacity:.6">
            click to expand
          </span>
        </summary>
        <div style="
          padding:10px 14px;border-top:1px solid var(--bdr);
          font-size:.8rem;color:var(--txt2);line-height:1.7;
          font-family:inherit;white-space:pre-wrap">${inner.trim()}</div>
      </details>`);
    }

    // Non-reasoning profiles: strip think blocks entirely
    return html.replace(pattern, '');
}

// ══════════════════════════════════════════════════════════════
//  HEADINGS
// ══════════════════════════════════════════════════════════════
function renderHeadings(html) {
    // Must run line-by-line to avoid matching inside code blocks
    return html
        .replace(/^### (.+)$/gm, '<h5 style="font-size:.92rem;font-weight:700;margin:14px 0 6px;color:var(--txt)">$1</h5>')
        .replace(/^## (.+)$/gm, '<h4 style="font-size:1rem;font-weight:700;margin:16px 0 8px;color:var(--txt)">$1</h4>')
        .replace(/^# (.+)$/gm, '<h3 style="font-size:1.1rem;font-weight:700;margin:18px 0 10px;color:var(--txt)">$1</h3>');
}

// ══════════════════════════════════════════════════════════════
//  CODE BLOCK RENDERER
// ══════════════════════════════════════════════════════════════
function renderCodeBlocks(html, profile) {
    // Match ```lang\n code \n```
    return html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
        const langLabel = lang || 'code';
        const langColor = getLangColor(lang);
        const id = 'cb-' + Math.random().toString(36).substr(2, 8);

        const copyBtn = `
      <button onclick="copyCode('${id}')"
        style="
          position:absolute;top:8px;right:8px;
          background:var(--bg3);border:1px solid var(--bdr);
          color:var(--txt2);border-radius:5px;padding:2px 9px;
          font-size:.68rem;cursor:pointer;transition:all .15s;
          display:flex;align-items:center;gap:4px"
        onmouseover="this.style.borderColor='var(--acc)';this.style.color='var(--acc)'"
        onmouseout="this.style.borderColor='var(--bdr)';this.style.color='var(--txt2)'"
        id="copybtn-${id}">
        <i class="fa fa-copy"></i> Copy
      </button>`;

        const lineNums = profile === 'coder' && code.trim().split('\n').length > 4
            ? addLineNumbers(code.trim())
            : `<code id="${id}" style="display:block;white-space:pre;overflow-x:auto;font-family:Consolas,'Courier New',monospace;font-size:.8rem;line-height:1.6">${code.trim()}</code>`;

        return `
      <div style="
        margin:10px 0;background:#0d1117;
        border:1px solid var(--bdr);border-radius:8px;overflow:hidden;
        position:relative">
        <div style="
          display:flex;align-items:center;justify-content:space-between;
          padding:5px 12px;background:#161b22;border-bottom:1px solid var(--bdr)">
          <span style="
            font-size:.68rem;font-weight:600;
            color:${langColor};font-family:monospace">${langLabel.toUpperCase()}</span>
          ${copyBtn}
        </div>
        <div style="padding:12px 14px;overflow-x:auto" ${profile !== 'coder' ? `id="${id}"` : ''}>
          ${lineNums}
        </div>
      </div>`;
    });
}

function addLineNumbers(code) {
    const lines = code.split('\n');
    const nums = lines.map((ln, i) =>
        `<span style="
      display:inline-block;min-width:28px;color:#484f58;
      user-select:none;margin-right:12px;text-align:right;
      font-size:.75rem">${i + 1}</span>${ln}`
    ).join('\n');
    return `<code style="display:block;white-space:pre;font-family:Consolas,'Courier New',monospace;font-size:.8rem;line-height:1.6">${nums}</code>`;
}

function getLangColor(lang) {
    const map = {
        js: '#f0c040', javascript: '#f0c040', ts: '#3b82f6', typescript: '#3b82f6',
        py: '#3fb950', python: '#3fb950', cs: '#bc8cff', csharp: '#bc8cff',
        html: '#f85149', css: '#58a6ff', json: '#f0c040', sql: '#58a6ff',
        bash: '#3fb950', sh: '#3fb950', mermaid: '#a371f7',
    };
    return map[(lang || '').toLowerCase()] || '#8b949e';
}

// ══════════════════════════════════════════════════════════════
//  TABLE RENDERER
// ══════════════════════════════════════════════════════════════
function renderTables(html, profile) {
    // Match markdown table blocks: header | separator | rows
    return html.replace(
        /((?:\|.+\|\n?)+)/g,
        (block) => {
            const lines = block.trim().split('\n').filter(Boolean);
            if (lines.length < 2) return block;
            const isSep = (l) => /^\|[-| :]+\|$/.test(l.trim());
            const sepIdx = lines.findIndex(isSep);
            if (sepIdx < 1) return block;

            const headerCols = parseRow(lines[0]);
            const alignments = lines[sepIdx].split('|').slice(1, -1).map(c => {
                c = c.trim();
                if (c.startsWith(':') && c.endsWith(':')) return 'center';
                if (c.endsWith(':')) return 'right';
                return 'left';
            });
            const bodyLines = lines.slice(sepIdx + 1);

            const thStyle = profile === 'analyst'
                ? 'background:#1f2d45;color:#58a6ff;font-weight:700'
                : 'background:var(--bg3);color:var(--txt2);font-weight:600';

            const headers = headerCols.map((h, i) =>
                `<th style="${thStyle};padding:8px 12px;text-align:${alignments[i] || 'left'};
           font-size:.78rem;border-bottom:2px solid var(--bdr);white-space:nowrap">${h}</th>`
            ).join('');

            const rows = bodyLines.map((line, rowIdx) => {
                const cols = parseRow(line);
                const bg = rowIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.02)';
                const tds = cols.map((c, i) =>
                    `<td style="padding:7px 12px;text-align:${alignments[i] || 'left'};
             font-size:.8rem;border-bottom:1px solid var(--bdr);color:var(--txt)">${c}</td>`
                ).join('');
                return `<tr style="background:${bg}">${tds}</tr>`;
            }).join('');

            return `
        <div style="overflow-x:auto;margin:10px 0;border-radius:8px;border:1px solid var(--bdr)">
          <table style="width:100%;border-collapse:collapse;font-size:.82rem">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
        }
    );
}

function parseRow(line) {
    return line.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
}

// ══════════════════════════════════════════════════════════════
//  LIST RENDERER
// ══════════════════════════════════════════════════════════════
function renderLists(html) {
    // Numbered lists
    html = html.replace(/((?:^\d+\..+\n?)+)/gm, (block) => {
        const items = block.trim().split('\n')
            .map(l => `<li style="margin-bottom:4px">${l.replace(/^\d+\.\s*/, '')}</li>`).join('');
        return `<ol style="margin:6px 0;padding-left:20px;color:var(--txt)">${items}</ol>`;
    });

    // Bullet lists (-, *, +)
    html = html.replace(/((?:^[*\-+] .+\n?)+)/gm, (block) => {
        const items = block.trim().split('\n')
            .map(l => `<li style="margin-bottom:4px">${l.replace(/^[*\-+]\s*/, '')}</li>`).join('');
        return `<ul style="margin:6px 0;padding-left:18px;color:var(--txt)">${items}</ul>`;
    });

    return html;
}

// ══════════════════════════════════════════════════════════════
//  PARAGRAPH RENDERER
// ══════════════════════════════════════════════════════════════
function renderParagraphs(html, profile) {
    // Split on double newlines, wrap in <p> if not already a block element
    const blockTags = /^<(h[1-6]|ul|ol|details|div|table|hr|pre)/;
    const parts = html.split(/\n\n+/);

    return parts.map(part => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        if (blockTags.test(trimmed)) return trimmed;

        // Single newlines → <br> inside paragraphs
        const inner = trimmed.replace(/\n/g, '<br>');

        const lineHeight = profile === 'creative' ? '1.9' : '1.65';
        const marginBottom = profile === 'creative' ? '12px' : '8px';
        return `<p style="margin:0 0 ${marginBottom};line-height:${lineHeight};color:var(--txt)">${inner}</p>`;
    }).join('');
}

// ══════════════════════════════════════════════════════════════
//  COPY CODE BUTTON HANDLER (global)
// ══════════════════════════════════════════════════════════════
window.copyCode = function (id) {
    const el = document.getElementById(id);
    const btn = document.getElementById('copybtn-' + id);
    if (!el || !btn) return;

    const text = el.innerText || el.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="fa fa-check"></i> Copied!';
        btn.style.color = 'var(--ok)';
        btn.style.borderColor = 'var(--ok)';
        setTimeout(() => {
            btn.innerHTML = '<i class="fa fa-copy"></i> Copy';
            btn.style.color = 'var(--txt2)';
            btn.style.borderColor = 'var(--bdr)';
        }, 2000);
    }).catch(() => {
        // Fallback for non-https
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.innerHTML = '<i class="fa fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="fa fa-copy"></i> Copy'; }, 2000);
    });
};
/* ── HTML escape helpers ───────────────────────────────────────────────────── */
function escHtml(t) {
    if (!t) return '';
    return String(t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escAttr(t) {
    if (!t) return '';
    return String(t)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}

/* ── Copy individual code block ────────────────────────────────────────────── */
function copyCode(btn) {
    var pre = btn.closest('.code-block');
    var code = pre && pre.querySelector('code');
    if (!code) return;
    navigator.clipboard.writeText(code.innerText).then(function () {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-check"></i> Copied';
        btn.style.color = 'var(--ok)';
        setTimeout(function () { btn.innerHTML = orig; btn.style.color = ''; }, 1800);
    });
}

/* ── Copy full message bubble ──────────────────────────────────────────────── */
function copyMsgText(btn) {
    var bubble = btn.closest('.msg-group') && btn.closest('.msg-group').querySelector('.msg-bubble');
    if (!bubble) return;
    var text = (bubble.innerText || bubble.textContent).trim();
    navigator.clipboard.writeText(text).then(function () {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-check"></i> Copied!';
        btn.classList.add('ok');
        setTimeout(function () { btn.innerHTML = orig; btn.classList.remove('ok'); }, 2000);
    }).catch(function () {
        var orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-times"></i> Failed';
        btn.classList.add('err');
        setTimeout(function () { btn.innerHTML = orig; btn.classList.remove('err'); }, 2000);
    });
}

/* ── Message formatter ─────────────────────────────────────────────────────── */
function formatMsg(raw) {
    if (!raw) return '';

    /* Placeholder store: safe HTML blobs held out of escaping path */
    var holds = [];
    function hold(html) {
        var key = '[[HOLD' + holds.length + ']]';
        holds.push(html);
        return key;
    }

    var text = raw;

    /* ── 0. Extract code, images, links BEFORE escaping ── */

    /* Fenced code blocks  ```lang\ncode``` */
    text = text.replace(/```(\w*)[^\S\r\n]*\n?([\s\S]*?)```/g, function (_, lang, code) {
        return hold(
            '<pre class="code-block">' +
            '<code class="lang-' + escHtml(lang || 'text') + '">' + escHtml(code.trim()) + '</code>' +
            '<button class="code-copy-btn" onclick="copyCode(this)" title="Copy code">' +
            '<i class="fa fa-copy"></i>' +
            '</button>' +
            '</pre>'
        );
    });

    /* Inline code  `code` */
    text = text.replace(/`([^`\n]+)`/g, function (_, c) {
        return hold('<code class="inline-code">' + escHtml(c) + '</code>');
    });

    /* Markdown image  ![alt](url) */
    text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, function (_, alt, src) {
        return hold(
            '<img src="' + escAttr(src) + '" alt="' + escAttr(alt) + '"' +
            ' class="msg-img" loading="lazy" onerror="this.style.display=\'none\'">'
        );
    });

    /* Markdown link  [label](url) */
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, href) {
        return hold(
            '<a href="' + escAttr(href) + '" target="_blank" rel="noopener noreferrer" class="msg-link">' +
            escHtml(label) + '</a>'
        );
    });

    /* ── 1. Escape ALL remaining raw HTML so tags become literal text ── */
    text = escHtml(text);

    /* ── 2. Apply Markdown to now-safe escaped text ── */

    /* Headers  ### ## # */
    text = text.replace(/^### (.+)$/gm, '<h5 class="md-h5">$1</h5>');
    text = text.replace(/^## (.+)$/gm, '<h4 class="md-h4">$1</h4>');
    text = text.replace(/^# (.+)$/gm, '<h3 class="md-h3">$1</h3>');

    /* Horizontal rule  --- */
    text = text.replace(/^---+$/gm, '<hr class="md-hr">');

    /* Blockquote  &gt; (after escaping, > becomes &gt;) */
    text = text.replace(/^&gt; (.+)$/gm, '<blockquote class="md-bq">$1</blockquote>');

    /* Markdown tables  | col | col | */
    text = (function () {
        var lines = text.split('\n');
        var out = [];
        var tRows = [];

        function flushTable() {
            if (!tRows.length) return;
            var html = '<div class="md-table-wrap"><table class="md-table">';
            tRows.forEach(function (row, ri) {
                var cells = row.split('|');
                cells = cells.slice(1, cells.length - 1); // drop empty first/last
                /* Skip separator row (--- | ---) */
                if (cells.every(function (c) { return /^[\s\-:]+$/.test(c); })) return;
                var tag = (ri === 0) ? 'th' : 'td';
                html += '<tr>' + cells.map(function (c) {
                    return '<' + tag + '>' + c.trim() + '</' + tag + '>';
                }).join('') + '</tr>';
            });
            html += '</table></div>';
            out.push(hold(html));
            tRows = [];
        }

        lines.forEach(function (line) {
            if (line.trim().charAt(0) === '|' && line.trim().slice(-1) === '|') {
                tRows.push(line.trim());
            } else {
                if (tRows.length) flushTable();
                out.push(line);
            }
        });
        if (tRows.length) flushTable();
        return out.join('\n');
    }());

    /* List items  - item  or  * item  or  1. item */
    text = text.replace(/^[*\-] (.+)$/gm, '<li>$1</li>');
    text = text.replace(/^\d+\. (.+)$/gm, '<li class="md-ol">$1</li>');

    /* Wrap <li> runs */
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>');
    text = text.replace(/((?:<li class="md-ol">.*<\/li>\n?)+)/g, '<ol class="md-ol-wrap">$1</ol>');

    /* Bold  **text** */
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    /* Italic  *text*  (not doubled) */
    text = text.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    /* Strikethrough  ~~text~~ */
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

    /* Bare URLs → clickable */
    text = text.replace(/(^|[\s(])(https?:\/\/[^\s<>"']+)/g, function (_, pre, url) {
        return pre + hold(
            '<a href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer" class="msg-link">' +
            escHtml(url) + '</a>'
        );
    });

    /* Line breaks */
    text = text.replace(/\n/g, '<br>');

    /* ── 3. Restore held blocks ── */
    for (var hi = 0; hi < holds.length; hi++) {
        text = text.split('[[HOLD' + hi + ']]').join(holds[hi]);
    }

    return text;
}