import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $createLinkNode } from '@lexical/link';

// Parse inline markdown formatting and create text nodes
function parseInlineMarkdown(text, paragraph) {
  if (!text) return;

  // Regex patterns for inline formatting
  const patterns = [
    // Bold + Italic (must come before bold and italic)
    { regex: /\*\*\*(.+?)\*\*\*/g, formats: ['bold', 'italic'] },
    // Bold
    { regex: /\*\*(.+?)\*\*/g, formats: ['bold'] },
    // Italic
    { regex: /\*(.+?)\*/g, formats: ['italic'] },
    // Strikethrough
    { regex: /~~(.+?)~~/g, formats: ['strikethrough'] },
    // Inline code
    { regex: /`(.+?)`/g, formats: ['code'] },
    // Links [text](url)
    { regex: /\[(.+?)\]\((.+?)\)/g, isLink: true },
  ];

  // Simple approach: find all formatting and apply
  // For simplicity, just create text with basic parsing
  let remaining = text;
  let lastIndex = 0;

  // Check for link pattern first
  const linkRegex = /\[(.+?)\]\((.+?)\)/g;
  let linkMatch;
  const parts = [];
  let currentIndex = 0;

  while ((linkMatch = linkRegex.exec(text)) !== null) {
    // Add text before link
    if (linkMatch.index > currentIndex) {
      parts.push({ type: 'text', content: text.slice(currentIndex, linkMatch.index) });
    }
    // Add link
    parts.push({ type: 'link', text: linkMatch[1], url: linkMatch[2] });
    currentIndex = linkMatch.index + linkMatch[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(currentIndex) });
  }

  // If no links found, just use the whole text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  // Process each part
  for (const part of parts) {
    if (part.type === 'link') {
      const linkNode = $createLinkNode(part.url);
      const linkTextNode = $createTextNode(part.text);
      linkNode.append(linkTextNode);
      paragraph.append(linkNode);
    } else {
      // Parse formatting in text content
      let content = part.content;

      // Simple formatting detection (not perfect but covers common cases)
      const textNode = $createTextNode(content);

      // Check for formatting markers and apply
      if (/\*\*\*(.+?)\*\*\*/.test(content)) {
        content = content.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
        const node = $createTextNode(content);
        node.toggleFormat('bold');
        node.toggleFormat('italic');
        paragraph.append(node);
      } else if (/\*\*(.+?)\*\*/.test(content)) {
        content = content.replace(/\*\*(.+?)\*\*/g, '$1');
        const node = $createTextNode(content);
        node.toggleFormat('bold');
        paragraph.append(node);
      } else if (/\*(.+?)\*/.test(content)) {
        content = content.replace(/\*(.+?)\*/g, '$1');
        const node = $createTextNode(content);
        node.toggleFormat('italic');
        paragraph.append(node);
      } else if (/~~(.+?)~~/.test(content)) {
        content = content.replace(/~~(.+?)~~/g, '$1');
        const node = $createTextNode(content);
        node.toggleFormat('strikethrough');
        paragraph.append(node);
      } else if (/`(.+?)`/.test(content)) {
        content = content.replace(/`(.+?)`/g, '$1');
        const node = $createTextNode(content);
        node.toggleFormat('code');
        paragraph.append(node);
      } else {
        paragraph.append($createTextNode(content));
      }
    }
  }
}

// Parse a single line and return the appropriate node
function parseLine(line) {
  // Empty line
  if (line === '') {
    return $createParagraphNode();
  }

  // Heading
  const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const tag = `h${Math.min(level, 6)}`;
    const heading = $createHeadingNode(tag);
    parseInlineMarkdown(headingMatch[2], heading);
    return heading;
  }

  // Quote
  if (line.startsWith('> ')) {
    const quote = $createQuoteNode();
    parseInlineMarkdown(line.slice(2), quote);
    return quote;
  }

  // Regular paragraph
  const paragraph = $createParagraphNode();
  parseInlineMarkdown(line, paragraph);
  return paragraph;
}

// Parse list items (handles nested lists and different types)
function parseListBlock(lines, startIndex) {
  const firstLine = lines[startIndex];

  // Determine list type
  let listType = 'bullet';
  if (/^\d+\.\s/.test(firstLine)) {
    listType = 'number';
  } else if (/^-\s\[[ x]\]\s/.test(firstLine)) {
    listType = 'check';
  }

  const list = $createListNode(listType);
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];

    // Check if still a list item
    const bulletMatch = line.match(/^-\s(.*)$/);
    const numberedMatch = line.match(/^\d+\.\s(.*)$/);
    const checkMatch = line.match(/^-\s\[([ x])\]\s(.*)$/);

    if (checkMatch && listType === 'check') {
      const item = $createListItemNode();
      item.setChecked(checkMatch[1] === 'x');
      parseInlineMarkdown(checkMatch[2], item);
      list.append(item);
      i++;
    } else if (bulletMatch && listType === 'bullet') {
      const item = $createListItemNode();
      parseInlineMarkdown(bulletMatch[1], item);
      list.append(item);
      i++;
    } else if (numberedMatch && listType === 'number') {
      const item = $createListItemNode();
      parseInlineMarkdown(numberedMatch[1], item);
      list.append(item);
      i++;
    } else {
      // End of list
      break;
    }
  }

  return { node: list, endIndex: i };
}

function MarkdownInitPlugin({ initialMarkdown }) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once per mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (initialMarkdown !== undefined && initialMarkdown !== null) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (!initialMarkdown) {
          root.append($createParagraphNode());
          return;
        }

        const lines = initialMarkdown.split('\n');
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];

          // Check for code block
          if (line.startsWith('```')) {
            const language = line.slice(3).trim();
            const codeLines = [];
            i++;

            while (i < lines.length && !lines[i].startsWith('```')) {
              codeLines.push(lines[i]);
              i++;
            }

            const codeNode = $createCodeNode(language || undefined);
            const textNode = $createTextNode(codeLines.join('\n'));
            codeNode.append(textNode);
            root.append(codeNode);
            i++; // Skip closing ```
            continue;
          }

          // Check for list
          if (/^(\d+\.\s|-\s)/.test(line)) {
            const { node, endIndex } = parseListBlock(lines, i);
            root.append(node);
            i = endIndex;
            continue;
          }

          // Regular line (paragraph, heading, quote, or empty)
          root.append(parseLine(line));
          i++;
        }

        // Ensure at least one paragraph
        if (root.getChildrenSize() === 0) {
          root.append($createParagraphNode());
        }
      });
    }
  }, [editor, initialMarkdown]);

  return null;
}

export default MarkdownInitPlugin;
