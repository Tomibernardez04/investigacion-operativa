import React from 'react';
import { renderLatex } from '../logic/katexHelper.js';

export default function MathView({ math, block = false, style = {}, className = '' }) {
    if (math === null || math === undefined || math === '') return null;
    const html = renderLatex(math, block);
    return (
        <span
            className={className}
            style={style}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
