export interface PrintPdfOptions {
  title: string;
  subtitle: string;
  date: string;
  content: string; // raw HTML string for the body
}

// Edufied brand blue — matches the app's primary HSL(217 91% 48%)
const BRAND = '#E11D48';
const BRAND_LIGHT = '#fce7f0';

/**
 * Opens a new browser window with print-ready HTML and triggers the print
 * dialog (which includes "Save as PDF" on all platforms).
 * No external dependencies required.
 */
export function printPdf({ title, subtitle, date, content }: PrintPdfOptions): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to export PDFs.');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    @page { margin: 0; }
    @page :first { margin: 0; }
    * { box-sizing: border-box; }

    body {
      font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #1a1a2e;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    /* ── Brand header band ── */
    .doc-header {
      background: ${BRAND};
      color: #fff;
      padding: 36px 48px 28px;
      margin-bottom: 36px;
    }
    .doc-header-eyebrow {
      font-size: 9pt;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.75;
      margin: 0 0 10px;
    }
    .doc-header h1 {
      font-size: 22pt;
      font-weight: 700;
      margin: 0 0 6px;
      line-height: 1.2;
      color: #fff;
    }
    .doc-header .subtitle {
      font-size: 11pt;
      opacity: 0.88;
      margin: 0 0 16px;
    }
    .doc-header .meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 9pt;
      opacity: 0.7;
      margin: 0;
      padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.25);
    }

    /* ── Body content area ── */
    .doc-body {
      padding: 0 48px 48px;
    }

    /* ── Section headings ── */
    h2 {
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${BRAND};
      margin: 28px 0 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${BRAND_LIGHT};
    }

    p { margin: 0 0 12px; }

    ul {
      padding-left: 0;
      margin: 0 0 14px;
      list-style: none;
    }
    li {
      padding: 5px 0 5px 18px;
      position: relative;
      border-bottom: 1px solid #f0f0f5;
      font-size: 10.5pt;
    }
    li::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: ${BRAND};
      font-size: 9pt;
      top: 6px;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 10pt;
    }
    thead tr {
      background: ${BRAND};
      color: #fff;
    }
    th {
      text-align: left;
      padding: 9px 12px;
      font-weight: 600;
      font-size: 9.5pt;
      letter-spacing: 0.03em;
    }
    tbody tr:nth-child(even) { background: ${BRAND_LIGHT}; }
    tbody tr:nth-child(odd)  { background: #fff; }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5eaf3;
      vertical-align: top;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 40px;
      padding: 12px 48px;
      background: #f7f8fc;
      border-top: 1px solid #e0e4ef;
      font-size: 8.5pt;
      color: #888;
      display: flex;
      justify-content: space-between;
    }
    .doc-footer .brand {
      font-weight: 600;
      color: ${BRAND};
    }
  </style>
</head>
<body>

  <div class="doc-header">
    <p class="doc-header-eyebrow">Pulse · Edufied</p>
    <h1>${esc(title)}</h1>
    <p class="subtitle">${esc(subtitle)}</p>
    <p class="meta">
      <span>📅 Generated ${esc(date)}</span>
    </p>
  </div>

  <div class="doc-body">
    ${content}
  </div>

  <div class="doc-footer">
    <span><span class="brand">Pulse</span> by Edufied — Teacher Intelligence Platform</span>
    <span>${esc(date)}</span>
  </div>

</body>
</html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  // Small delay lets the window finish rendering before print dialog opens
  setTimeout(() => win.print(), 300);
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
