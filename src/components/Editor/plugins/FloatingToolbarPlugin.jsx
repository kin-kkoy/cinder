import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';

import { FaBold, FaItalic, FaStrikethrough, FaLink, FaCode } from 'react-icons/fa';

import styles from './FloatingToolbarPlugin.module.css';
import LinkPopover from './LinkPopover';

function FloatingToolbar({ editor }) {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);

  // Link popover state
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkPopoverPosition, setLinkPopoverPosition] = useState({ x: 0, y: 0 });

  const updateToolbar = useCallback(() => {
    // Don't hide toolbar if link popover is open
    if (linkPopoverOpen) return;

    const selection = $getSelection();

    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsVisible(false);
      return;
    }

    // Update format states
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsStrikethrough(selection.hasFormat('strikethrough'));
    setIsCode(selection.hasFormat('code'));

    const node = selection.anchor.getNode();
    const parent = node.getParent();
    setIsLink($isLinkNode(parent) || $isLinkNode(node));

    // Calculate position
    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      setIsVisible(false);
      return;
    }

    setPosition({
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + window.scrollY - 10,
    });
    setIsVisible(true);
  }, [linkPopoverOpen]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateToolbar]);

  // Hide on click outside
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        // Let the selection change handler deal with visibility
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const formatBold = (e) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const formatItalic = (e) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const formatStrikethrough = (e) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  };

  const formatCode = (e) => {
    e.preventDefault();
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
  };

  const insertLink = useCallback(
    (e) => {
      e.preventDefault();

      if (isLink) {
        // Remove existing link
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        return;
      }

      // Get selection position for popover
      const nativeSelection = window.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        const range = nativeSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setLinkPopoverPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 10,
        });
      }

      setLinkPopoverOpen(true);
    },
    [isLink, editor]
  );

  const handleLinkConfirm = useCallback(
    (url) => {
      editor.focus();
      // In floating toolbar, there's always selected text
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    },
    [editor]
  );

  const handleLinkPopoverClose = useCallback(() => {
    setLinkPopoverOpen(false);
    editor.focus();
  }, [editor]);

  if (!isVisible && !linkPopoverOpen) return null;

  return createPortal(
    <>
      {isVisible && (
        <div
          ref={toolbarRef}
          className={styles.floatingToolbar}
          style={{
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          data-toolbar
        >
          <button
            onMouseDown={formatBold}
            className={`${styles.btn} ${isBold ? styles.active : ''}`}
            title="Bold"
          >
            <FaBold />
          </button>
          <button
            onMouseDown={formatItalic}
            className={`${styles.btn} ${isItalic ? styles.active : ''}`}
            title="Italic"
          >
            <FaItalic />
          </button>
          <button
            onMouseDown={formatStrikethrough}
            className={`${styles.btn} ${isStrikethrough ? styles.active : ''}`}
            title="Strikethrough"
          >
            <FaStrikethrough />
          </button>
          <button
            onMouseDown={formatCode}
            className={`${styles.btn} ${isCode ? styles.active : ''}`}
            title="Inline Code"
          >
            <FaCode />
          </button>
          <button
            onMouseDown={insertLink}
            className={`${styles.btn} ${isLink ? styles.active : ''}`}
            title="Link"
          >
            <FaLink />
          </button>
        </div>
      )}

      {/* Link popover */}
      <LinkPopover
        isOpen={linkPopoverOpen}
        onClose={handleLinkPopoverClose}
        onConfirm={handleLinkConfirm}
        anchorPosition={linkPopoverPosition}
        hasSelectedText={true}
      />
    </>,
    document.body
  );
}

function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  return <FloatingToolbar editor={editor} />;
}

export default FloatingToolbarPlugin;
