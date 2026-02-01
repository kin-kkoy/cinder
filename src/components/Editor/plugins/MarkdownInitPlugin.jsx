import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $createLinkNode } from '@lexical/link';

// Parse text content and extract formats, handling nested formatting
function parseFormattedText(text) {
  let content = text;
  const formats = [];

  // Check and strip outermost formatting layers
  // Order: strikethrough (outermost) -> bold/italic -> code (innermost)

  // Check for strikethrough ~~...~~
  let strikeMatch = content.match(/^~~(.+)~~$/);
  if (strikeMatch) {
    formats.push('strikethrough');
    content = strikeMatch[1];
  }

  // Check for bold+italic ***...***
  let boldItalicMatch = content.match(/^\*\*\*(.+)\*\*\*$/);
  if (boldItalicMatch) {
    formats.push('bold', 'italic');
    content = boldItalicMatch[1];
  } else {
    // Check for bold **...**
    let boldMatch = content.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      formats.push('bold');
      content = boldMatch[1];
    }

    // Check for italic *...* (after potentially stripping bold)
    let italicMatch = content.match(/^\*(.+)\*$/);
    if (italicMatch) {
      formats.push('italic');
      content = italicMatch[1];
    }
  }

  // Check for inline code `...`
  let codeMatch = content.match(/^`(.+)`$/);
  if (codeMatch) {
    formats.push('code');
    content = codeMatch[1];
  }

  return { content, formats };
}

// Create a text node with specified formats
function createFormattedTextNode(content, formats) {
  const node = $createTextNode(content);
  for (const format of formats) {
    node.toggleFormat(format);
  }
  return node;
}

// Tokenize and parse inline markdown
function parseInlineContent(text, parent) {
  if (!text) return;

  let pos = 0;

  while (pos < text.length) {
    // Check for link [text](url)
    const linkMatch = text.slice(pos).match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const linkNode = $createLinkNode(linkMatch[2]);
      // Parse the link text for formatting
      const { content, formats } = parseFormattedText(linkMatch[1]);
      linkNode.append(createFormattedTextNode(content, formats));
      parent.append(linkNode);
      pos += linkMatch[0].length;
      continue;
    }

    // Check for inline code `...`
    const codeMatch = text.slice(pos).match(/^`([^`]+)`/);
    if (codeMatch) {
      parent.append(createFormattedTextNode(codeMatch[1], ['code']));
      pos += codeMatch[0].length;
      continue;
    }

    // Check for strikethrough with possible nested formatting ~~...~~
    const strikeMatch = text.slice(pos).match(/^~~(.+?)~~/);
    if (strikeMatch) {
      const innerContent = strikeMatch[1];
      const { content, formats } = parseFormattedText(innerContent);
      formats.push('strikethrough');
      parent.append(createFormattedTextNode(content, formats));
      pos += strikeMatch[0].length;
      continue;
    }

    // Check for bold+italic ***...***
    const boldItalicMatch = text.slice(pos).match(/^\*\*\*(.+?)\*\*\*/);
    if (boldItalicMatch) {
      parent.append(createFormattedTextNode(boldItalicMatch[1], ['bold', 'italic']));
      pos += boldItalicMatch[0].length;
      continue;
    }

    // Check for bold **...**
    const boldMatch = text.slice(pos).match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      const innerContent = boldMatch[1];
      // Check if inner content has strikethrough
      const strikeInner = innerContent.match(/^~~(.+)~~$/);
      if (strikeInner) {
        parent.append(createFormattedTextNode(strikeInner[1], ['bold', 'strikethrough']));
      } else {
        parent.append(createFormattedTextNode(innerContent, ['bold']));
      }
      pos += boldMatch[0].length;
      continue;
    }

    // Check for italic *...*
    const italicMatch = text.slice(pos).match(/^\*([^*]+)\*/);
    if (italicMatch) {
      const innerContent = italicMatch[1];
      // Check if inner content has strikethrough
      const strikeInner = innerContent.match(/^~~(.+)~~$/);
      if (strikeInner) {
        parent.append(createFormattedTextNode(strikeInner[1], ['italic', 'strikethrough']));
      } else {
        parent.append(createFormattedTextNode(innerContent, ['italic']));
      }
      pos += italicMatch[0].length;
      continue;
    }

    // No formatting matched - consume plain text until next potential pattern
    const nextPattern = text.slice(pos + 1).search(/[\[`*~]/);
    const endPos = nextPattern === -1 ? text.length : pos + 1 + nextPattern;
    const plainText = text.slice(pos, endPos);

    if (plainText) {
      parent.append($createTextNode(plainText));
    }
    pos = endPos;
  }
}

// Parse inline markdown formatting and create text nodes
function parseInlineMarkdown(text, parent) {
  if (!text) return;
  parseInlineContent(text, parent);
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
