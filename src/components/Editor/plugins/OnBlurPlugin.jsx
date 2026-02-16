import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { serializeEditorState } from '../utils/markdownSerializer';

function OnBlurPlugin({ onBlur, lastSavedContentRef }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleBlur = (event) => {
      // Don't save if focus moves to toolbar buttons
      const relatedTarget = event.relatedTarget;
      if (relatedTarget && relatedTarget.closest('[data-toolbar]')) {
        return;
      }

      const markdown = serializeEditorState(editor.getEditorState());

      // Only save if content has changed
      if (markdown !== lastSavedContentRef.current) {
        lastSavedContentRef.current = markdown;
        onBlur(markdown);
      }
    };

    rootElement.addEventListener('blur', handleBlur);
    return () => rootElement.removeEventListener('blur', handleBlur);
  }, [editor, onBlur, lastSavedContentRef]);

  return null;
}

export default OnBlurPlugin;
