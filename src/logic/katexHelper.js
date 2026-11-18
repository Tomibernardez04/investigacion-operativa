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
            return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch (e) {
            return `$$${math}$$`;
        }
    });

    // Replace inline math $...$
    str = str.replace(/\$([^\$\n\r]+?)\$/g, (_, math) => {
        try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch (e) {
            return `$${math}$`;
        }
    });

    return str;
}
