import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode, $isTextNode } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListNode, $isListItemNode } from '@lexical/list';
import { $isQuoteNode } from '@lexical/rich-text';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';

// Convert a text node with formatting to markdown
function textNodeToMarkdown(node) {
  let text = node.getTextContent();
  if (!text) return '';

  // Apply formatting in correct order (innermost first)
  if (node.hasFormat('code')) {
    text = '`' + text + '`';
  }
  if (node.hasFormat('bold') && node.hasFormat('italic')) {
    text = '***' + text + '***';
  } else {
    if (node.hasFormat('bold')) {
      text = '**' + text + '**';
    }
    if (node.hasFormat('italic')) {
      text = '*' + text + '*';
    }
  }
  if (node.hasFormat('strikethrough')) {
    text = '~~' + text + '~~';
  }

  return text;
}

// Convert children of a node to markdown text
function childrenToMarkdown(node) {
  const children = node.getChildren();
  let result = '';

  for (const child of children) {
    if ($isTextNode(child)) {
      result += textNodeToMarkdown(child);
    } else if ($isLinkNode(child)) {
      const linkText = childrenToMarkdown(child);
      const url = child.getURL();
      result += `[${linkText}](${url})`;
    } else if (child.getTextContent) {
      result += child.getTextContent();
    }
  }

  return result;
}

// Convert a single block node to markdown
function blockToMarkdown(node, listType = null, listDepth = 0, listIndex = 1) {
  const indent = '  '.repeat(listDepth);

  if ($isParagraphNode(node)) {
    const text = childrenToMarkdown(node);
    return text; // Empty string for empty paragraphs is fine
  }

  if ($isHeadingNode(node)) {
    const tag = node.getTag();
    const level = parseInt(tag.charAt(1));
    const prefix = '#'.repeat(level) + ' ';
    return prefix + childrenToMarkdown(node);
  }

  if ($isQuoteNode(node)) {
    return '> ' + childrenToMarkdown(node);
  }

  if ($isCodeNode(node)) {
    const language = node.getLanguage() || '';
    return '```' + language + '\n' + node.getTextContent() + '\n```';
  }

  if ($isListItemNode(node)) {
    const children = node.getChildren();

    let prefix = indent;
    if (listType === 'number') {
      prefix += `${listIndex}. `;
    } else if (listType === 'check') {
      const checked = node.getChecked?.() ? 'x' : ' ';
      prefix += `- [${checked}] `;
    } else {
      prefix += '- ';
    }

    // Collect all inline content into one string, handle nested lists separately
    let inlineContent = '';
    const nestedListLines = [];

    for (const child of children) {
      if ($isListNode(child)) {
        const nestedLines = listToMarkdown(child, listDepth + 1);
        nestedListLines.push(...nestedLines);
      } else if ($isTextNode(child)) {
        inlineContent += textNodeToMarkdown(child);
      } else if ($isLinkNode(child)) {
        const linkText = childrenToMarkdown(child);
        const url = child.getURL();
        inlineContent += `[${linkText}](${url})`;
      } else if (child.getTextContent) {
        inlineContent += child.getTextContent();
      }
    }

    const lines = [];
    if (inlineContent) {
      lines.push(prefix + inlineContent);
    }
    lines.push(...nestedListLines);

    return lines.join('\n');
  }

  // Fallback
  if (node.getTextContent) {
    return node.getTextContent();
  }

  return '';
}

// Convert a list node to markdown lines
function listToMarkdown(node, depth = 0) {
  const listType = node.getListType();
  const items = node.getChildren();
  const lines = [];
  let index = 1;

  for (const item of items) {
    if ($isListItemNode(item)) {
      const line = blockToMarkdown(item, listType, depth, index);
      lines.push(line);
      index++;
    }
  }

  return lines;
}

function OnBlurPlugin({ onBlur, initialContent }) {
  const [editor] = useLexicalComposerContext();
  const lastSavedContent = useRef(initialContent || '');

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleBlur = (event) => {
      // Don't save if focus moves to toolbar buttons
      const relatedTarget = event.relatedTarget;
      if (relatedTarget && relatedTarget.closest('[data-toolbar]')) {
        return;
      }

      editor.getEditorState().read(() => {
        const root = $getRoot();
        const children = root.getChildren();
        const lines = [];

        for (const child of children) {
          if ($isListNode(child)) {
            // Handle lists specially
            const listLines = listToMarkdown(child);
            lines.push(...listLines);
          } else {
            // Regular block nodes (paragraph, heading, quote, code)
            lines.push(blockToMarkdown(child));
          }
        }

        // Join with newlines - preserves empty lines from empty paragraphs
        const markdown = lines.join('\n');

        // Only save if content has changed
        if (markdown !== lastSavedContent.current) {
          lastSavedContent.current = markdown;
          onBlur(markdown);
        }
      });
    };

    rootElement.addEventListener('blur', handleBlur);
    return () => rootElement.removeEventListener('blur', handleBlur);
  }, [editor, onBlur]);

  return null;
}

export default OnBlurPlugin;
