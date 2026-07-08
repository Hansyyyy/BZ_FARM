import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function applyMobileTableLabels(root) {
    if (!root) return;

    root.querySelectorAll('table.mockup-table').forEach((table) => {
        if (table.closest('.expand-detail-section, .modal, .modal-body, .modal-content')) return;

        const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());

        table.querySelectorAll('tbody tr').forEach((tr) => {
            if (tr.classList.contains('expand-detail-row')) return;

            [...tr.children].forEach((cell, index) => {
                if (cell.tagName !== 'TD') return;

                const colSpan = Number(cell.colSpan) || 1;
                if (colSpan > 1) {
                    cell.classList.add('mobile-table-full');
                    cell.removeAttribute('data-label');
                    return;
                }

                cell.classList.remove('mobile-table-full');
                const label = headers[index] || '';
                if (label) {
                    cell.setAttribute('data-label', label);
                    cell.classList.remove('mobile-table-skip');
                } else {
                    cell.removeAttribute('data-label');
                    cell.classList.add('mobile-table-skip');
                }
            });
        });
    });
}

export default function useMobileTableLabels() {
    const location = useLocation();

    useEffect(() => {
        const root = document.querySelector('.page-content');
        if (!root) return undefined;

        let timer;
        const run = () => applyMobileTableLabels(root);

        run();

        const observer = new MutationObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(run, 60);
        });

        observer.observe(root, { childList: true, subtree: true });

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [location.pathname, location.search]);
}
