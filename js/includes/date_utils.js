(function () {
    if (window.GSS_DATE && typeof window.GSS_DATE.formatDbDateTime === 'function') {
        return;
    }

    function formatDbDateTime(value) {
        if (value === null || typeof value === 'undefined') return '';
        var s = String(value).trim();
        if (!s) return '';

        // Accept: YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, YYYY-MM-DDTHH:MM:SS
        var m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/);
        if (!m) return s;

        var out = m[3] + '-' + m[2] + '-' + m[1];
        if (m[4]) {
            out += ' ' + m[4] + ':' + m[5] + ':' + m[6];
        }
        return out;
    }

    function formatRowDates(row) {
        if (!row || typeof row !== 'object') return row;
        var out = Array.isArray(row) ? row.slice() : Object.assign({}, row);
        Object.keys(out).forEach(function (k) {
            var v = out[k];
            if (v === null || typeof v === 'undefined') return;
            var key = String(k || '');
            if (key === 'dob' || key.endsWith('_at') || key.endsWith('_date') || key.indexOf('date') !== -1) {
                out[k] = formatDbDateTime(v);
            }
        });
        return out;
    }

    window.GSS_DATE = {
        formatDbDateTime: formatDbDateTime,
        formatRowDates: formatRowDates
    };
})();
