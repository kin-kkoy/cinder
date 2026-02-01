import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import { $isCodeNode } from '@lexical/code';

function CodeBlockExitPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Handle Shift+Enter - exit code block if no content below
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Only handle Shift+Enter
        if (!event?.shiftKey) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();
        const topLevelElement = anchorNode.getTopLevelElement();

        if (!topLevelElement || !$isCodeNode(topLevelElement)) return false;

        // Check if code block is the last element (no line below)
        const nextSibling = topLevelElement.getNextSibling();
        if (nextSibling !== null) return false; // There's already content after

        // Create new paragraph after code block
        event.preventDefault();

        editor.update(() => {
          const newParagraph = $createParagraphNode();
          topLevelElement.insertAfter(newParagraph);
          newParagraph.select();
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

export default CodeBlockExitPlugin;
