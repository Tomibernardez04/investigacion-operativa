import katex from 'katex';

export function renderLatex(tex, displayMode = false) {
    if (tex === null || tex === undefined || tex === '') return '';
    try {
        let clean = String(tex).trim();
        if (clean.startsWith('$$') && clean.endsWith('$$')) {
            clean = clean.slice(2, -2).trim();
            displayMode = true;
        } else if (clean.startsWith('$') && clean.endsWith('$')) {
            clean = clean.slice(1, -1).trim();
        }

        // Auto-fix Greek variables so lambda2 or \lambda2 or lambda_2 becomes \lambda_{2}, or bare lambda becomes \lambda
        clean = clean.replace(/\\?lambda_?\{?([a-zA-Z0-9]+)\}?/gi, '\\lambda_{$1}');
        clean = clean.replace(/\\?lambda(?![a-zA-Z])/gi, '\\lambda');
        clean = clean.replace(/\\?mu_?\{?([a-zA-Z0-9]+)\}?/gi, '\\mu_{$1}');
        clean = clean.replace(/\\?mu(?![a-zA-Z])/gi, '\\mu');
        clean = clean.replace(/^([xy])_?\{?([a-zA-Z0-9]+)\}?$/i, '$1_{$2}');

        return katex.renderToString(clean, {
            displayMode,
            throwOnError: false
        });
    } catch (e) {
        return String(tex);
    }
}

export function renderLatexInHtml(html) {
    if (!html) return '';
    let str = String(html);

    // Replace markdown bold **text** with <b>text</b>
    str = str.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

    // Replace display math $$...$$
    str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        try {
            let m = math.trim();
            m = m.replace(/\\?lambda_?\{?([a-zA-Z0-9]+)\}?/gi, '\\lambda_{$1}');
            m = m.replace(/\\?lambda(?![a-zA-Z])/gi, '\\lambda');
            m = m.replace(/\\?mu_?\{?([a-zA-Z0-9]+)\}?/gi, '\\mu_{$1}');
            m = m.replace(/\\?mu(?![a-zA-Z])/gi, '\\mu');
            return katex.renderToString(m, { displayMode: true, throwOnError: false });
        } catch (e) {
            return `$$${math}$$`;
        }
    });

    // Replace inline math $...$
    str = str.replace(/\$([^\$\n\r]+?)\$/g, (_, math) => {
        try {
            let m = math.trim();
            m = m.replace(/\\?lambda_?\{?([a-zA-Z0-9]+)\}?/gi, '\\lambda_{$1}');
            m = m.replace(/\\?lambda(?![a-zA-Z])/gi, '\\lambda');
            m = m.replace(/\\?mu_?\{?([a-zA-Z0-9]+)\}?/gi, '\\mu_{$1}');
            m = m.replace(/\\?mu(?![a-zA-Z])/gi, '\\mu');
            return katex.renderToString(m, { displayMode: false, throwOnError: false });
        } catch (e) {
            return `$${math}$`;
        }
    });

    // Replace any remaining bare \lambda_n or lambda_n or \mu_n outside math delimiters in HTML
    str = str.replace(/\\?(lambda|mu)_?\{?([0-9]+)\}?/gi, (_, greek, num) => {
        try {
            return katex.renderToString(`\\${greek.toLowerCase()}_{${num}}`, { displayMode: false, throwOnError: false });
        } catch (e) {
            return `&${greek};<sub>${num}</sub>`;
        }
    });

    str = str.replace(/\\?(lambda|mu)(?![a-zA-Z0-9_])/gi, (_, greek) => {
        try {
            return katex.renderToString(`\\${greek.toLowerCase()}`, { displayMode: false, throwOnError: false });
        } catch (e) {
            return `&${greek};`;
        }
    });

    return str;
}
