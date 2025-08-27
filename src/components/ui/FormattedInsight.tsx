import React, { useMemo, FC } from 'react';
import { cn } from './utils';

export const FormattedInsight: FC<{ text: string, className?: string }> = ({ text, className }) => {
    const html = useMemo(() => {
        if (!text) return '';

        // Pre-process the entire text for inline elements first
        let processedText = text
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/==(.*?)(==|\n|$)/g, '<mark>$1</mark>');

        const lines = processedText.split('\n');
        let html = '';
        let inList = false;
        let listType = ''; // 'ul' or 'ol'

        lines.forEach(line => {
            // Headers
            if (line.startsWith('### ')) {
                if (inList) { html += `</${listType}>`; inList = false; }
                html += `<h3>${line.substring(4)}</h3>`;
                return;
            }
            if (line.startsWith('## ')) {
                if (inList) { html += `</${listType}>`; inList = false; }
                html += `<h2>${line.substring(3)}</h2>`;
                return;
            }
            if (line.startsWith('# ')) {
                if (inList) { html += `</${listType}>`; inList = false; }
                html += `<h1>${line.substring(2)}</h1>`;
                return;
            }

            // Lists
            const isOl = /^\s*\d+\.\s+/.test(line);
            const isUl = /^\s*[-*]\s+/.test(line);
            
            if (isUl || isOl) {
                const currentListType = isOl ? 'ol' : 'ul';
                if (!inList || currentListType !== listType) {
                    if (inList) html += `</${listType}>`;
                    html += `<${currentListType}>`;
                    inList = true;
                    listType = currentListType;
                }
                const content = line.replace(/^\s*(\d+\.|[-*])\s+/, '');
                html += `<li>${content}</li>`;
                return;
            }

            // Paragraphs
            if (inList) {
                html += `</${listType}>`;
                inList = false;
            }
            if (line.trim() !== '') {
                html += `<p>${line}</p>`;
            }
        });

        if (inList) {
            html += `</${listType}>`;
        }

        return html;
    }, [text]);
    
    // Note: Tailwind's arbitrary variants like prose-li:before:content-[...] require JIT mode, which is standard in modern Tailwind setups.
    const proseClasses = `
        prose-base prose-neutral dark:prose-invert 
        max-w-none
        prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground
        prose-h1:text-4xl prose-h1:mb-4
        prose-h2:text-3xl prose-h2:mb-3
        prose-h3:text-2xl prose-h3:mb-2
        prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/90
        prose-strong:text-foreground
        prose-ul:list-none prose-ul:pl-2 prose-ul:space-y-2
        prose-ol:list-none prose-ol:pl-2 prose-ol:space-y-2
        prose-li:pl-6 prose-li:relative
        prose-li::before:absolute prose-li::before:left-0 prose-li::before:top-1.5
        prose-ul>li::before:content-[''] prose-ul>li::before:w-1.5 prose-ul>li::before:h-1.5 prose-ul>li::before:bg-primary prose-ul>li::before:rounded-full
        prose-ol:counter-reset-list
        prose-ol>li:before:content-[counter(list)_'.'] prose-ol>li:before:font-semibold prose-ol>li:before:text-primary prose-ol:counter-increment-list
        prose-mark:bg-primary/20 prose-mark:px-1 prose-mark:py-0.5 prose-mark:rounded
    `;

    return <div className={cn(proseClasses, className)} dangerouslySetInnerHTML={{ __html: html }} />;
};
