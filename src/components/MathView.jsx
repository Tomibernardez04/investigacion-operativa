import React, { useEffect, useRef } from 'react';

export default function MathView({ math, block = false, style = {} }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        if (window.renderMathInElement) {
            window.renderMathInElement(containerRef.current, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
    }, [math]);

    const content = block ? `$$${math}$$` : `$${math}$`;

    return (
        <span ref={containerRef} style={style}>
            {content}
        </span>
    );
}
