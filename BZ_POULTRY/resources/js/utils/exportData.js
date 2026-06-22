function slugify(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'export';
}

function escapeCsv(value) {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
}

function getCellValue(column, row) {
    if (column.render) {
        return column.render(row);
    }
    return row[column.key] ?? '';
}

function resolvePreparedBy(preparedBy) {
    if (preparedBy && String(preparedBy).trim()) {
        return String(preparedBy).trim();
    }
    return 'Jonel Carpio';
}

function getFooterMeta(preparedBy) {
    const now = new Date();
    return {
        preparedBy: resolvePreparedBy(preparedBy),
        dateDisplay: now.toLocaleDateString(),
    };
}

function buildFooterHtml(preparedBy) {
    const meta = getFooterMeta(preparedBy);

    return `
        <div style="margin-top: 30px; font-size: 12px; color: #1a1a2e; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
            <div style="flex: 1; text-align: left;">
                <p style="margin: 0;"><strong>Prepared by:</strong> ${meta.preparedBy}</p>
            </div>
            <div style="text-align: right; min-width: 260px;">
                <p style="margin: 0 0 12px 0;"><strong>Received by:</strong> ____________________</p>
                <p style="margin: 0 0 12px 0;">Signature over printed name</p>
                <p style="margin: 0;"><strong>Date:</strong> ${meta.dateDisplay}</p>
            </div>
        </div>
    `;
}

function buildFooterCsv(preparedBy) {
    const meta = getFooterMeta(preparedBy);
    return [
        '',
        `${escapeCsv('Prepared by')},${escapeCsv(meta.preparedBy)}`,
        `${escapeCsv('Received by')},${escapeCsv('____________________')}`,
        `${escapeCsv('Signature')},${escapeCsv('over printed name')}`,
        `${escapeCsv('Date')},${escapeCsv(meta.dateDisplay)}`,
    ].join('\n');
}

function downloadCsv(filename, columns, rows, preparedBy) {
    const headers = columns.map((column) => escapeCsv(column.label)).join(',');
    const body = rows.map((row) => columns.map((column) => escapeCsv(getCellValue(column, row))).join(',')).join('\n');
    const footer = buildFooterCsv(preparedBy);
    const blob = new Blob([`${headers}\n${body}\n${footer}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(filename)}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function buildPrintHtml(title, columns, rows, preparedBy) {
    const headerCells = columns.map((column) => `<th>${column.label}</th>`).join('');
    const bodyRows = rows.map((row) => {
        const cells = columns.map((column) => `<td>${getCellValue(column, row)}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a2e; }
        h1 { font-size: 20px; margin-bottom: 6px; }
        p { color: #6c757d; font-size: 12px; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #dfe5e1; padding: 8px 10px; font-size: 12px; text-align: left; }
        th { background: #f4f7f6; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
    </table>
    ${buildFooterHtml(preparedBy)}
</body>
</html>`;
}

function openPrintView(title, columns, rows, preparedBy, { printImmediately = false } = {}) {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups to export or print.');
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(title, columns, rows, preparedBy));
    printWindow.document.close();
    printWindow.focus();

    if (printImmediately) {
        printWindow.onload = () => {
            printWindow.print();
        };
    }

    return printWindow;
}

function downloadPdf(filename, columns, rows, preparedBy) {
    if (typeof html2pdf === 'undefined') {
        // Fallback to print dialog if html2pdf is not available
        throw new Error('PDF library not loaded. Please try again.');
    }

    const headerCells = columns.map((column) => `<th>${column.label}</th>`).join('');
    const bodyRows = rows.map((row) => {
        const cells = columns.map((column) => `<td>${getCellValue(column, row)}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const element = document.createElement('div');
    element.innerHTML = `
        <div style="padding: 24px; font-family: Arial, sans-serif;">
            <h1>${filename}</h1>
            <p style="color: #6c757d; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead><tr>${headerCells}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
            ${buildFooterHtml(preparedBy)}
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `${slugify(filename)}-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    html2pdf().set(opt).from(element).save();
}

export function exportTableData({ title, columns, rows, format, preparedBy }) {
    if (!rows.length) {
        throw new Error('No data available to export.');
    }

    if (format === 'csv') {
        downloadCsv(title, columns, rows, preparedBy);
        return;
    }

    if (format === 'pdf') {
        downloadPdf(title, columns, rows, preparedBy);
        return;
    }

    if (format === 'print') {
        const printWindow = openPrintView(title, columns, rows, preparedBy);
        printWindow.onload = () => printWindow.print();
        return;
    }

    throw new Error('Unsupported export format.');
}
