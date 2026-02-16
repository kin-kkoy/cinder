import { useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { serializeEditorState } from '../utils/markdownSerializer';

const AUTOSAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes
const DRAFT_SAVE_INTERVAL = 5 * 1000;     // 5 seconds

function AutosavePlugin({ onSave, noteId, lastSavedContentRef, onDirtyChange }) {
  const [editor] = useLexicalComposerContext();
  const isDirty = useRef(false);
  const isDraftDirty = useRef(false);

  const getDraftKey = useCallback(() => `cinder_draft_${noteId}`, [noteId]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!isDraftDirty.current) return;

    const markdown = serializeEditorState(editor.getEditorState());
    localStorage.setItem(getDraftKey(), JSON.stringify({
      content: markdown,
      savedAt: Date.now()
    }));
    isDraftDirty.current = false;
  }, [editor, getDraftKey]);

  // Track editor changes — just set dirty flags, no serialization
  useEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      if (!isDirty.current) {
        isDirty.current = true;
        onDirtyChange?.(true);
      }
      isDraftDirty.current = true;
    });
  }, [editor, onDirtyChange]);

  // Periodic autosave to backend (every 2 min)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isDirty.current) return;

      const markdown = serializeEditorState(editor.getEditorState());

      // Skip if content hasn't actually changed from last backend save
      if (markdown === lastSavedContentRef.current) {
        isDirty.current = false;
        onDirtyChange?.(false);
        return;
      }

      const success = await onSave(markdown);
      if (success) {
        lastSavedContentRef.current = markdown;
        isDirty.current = false;
        onDirtyChange?.(false);
        localStorage.removeItem(getDraftKey());
        isDraftDirty.current = false;
      }
      // On failure: content stays in localStorage draft as backup
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [editor, onSave, lastSavedContentRef, onDirtyChange, getDraftKey]);

  // Periodic draft save to localStorage (every 5 sec)
  useEffect(() => {
    const interval = setInterval(saveDraft, DRAFT_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveDraft]);

  // On unmount: save draft if dirty (covers in-app navigation)
  useEffect(() => {
    return () => {
      if (isDirty.current || isDraftDirty.current) {
        const markdown = serializeEditorState(editor.getEditorState());
        localStorage.setItem(getDraftKey(), JSON.stringify({
          content: markdown,
          savedAt: Date.now()
        }));
      }
    };
  }, [editor, getDraftKey]);

  return null;
}

export default AutosavePlugin;
