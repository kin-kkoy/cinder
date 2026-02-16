import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';

// Custom plugins
import ToolbarPlugin from './plugins/ToolbarPlugin';
import FloatingToolbarPlugin from './plugins/FloatingToolbarPlugin';
import OnBlurPlugin from './plugins/OnBlurPlugin';
import AutosavePlugin from './plugins/AutosavePlugin';
import MarkdownInitPlugin from './plugins/MarkdownInitPlugin';
import CodeBlockExitPlugin from './plugins/CodeBlockExitPlugin';
import LinkClickPlugin from './plugins/LinkClickPlugin';
import CodeCopyPlugin from './plugins/CodeCopyPlugin';

// Theme and utils
import editorTheme from './themes/editorTheme';
import { TRANSFORMERS } from './utils/markdownTransformers';

import styles from './LexicalEditor.module.css';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import logger from '../../utils/logger';

function onError(error) {
  logger.error('Lexical Error:', error);
}

function ReadModeListener({isReadMode}){
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(!isReadMode);
  }, [editor, isReadMode])

  return null;
}

function LexicalEditor({ initialContent, onSave, noteId, onDirtyChange, placeholder = 'Start typing here...', interfaceMode }) {
  const lastSavedContentRef = useRef(initialContent || '');
  const initialConfig = {
    namespace: 'CinderNotesEditor',
    theme: editorTheme,
    onError,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={styles.editorContainer} data-editor-container>
        {/* Floating toolbar dock (renders via portal) */}
        <ToolbarPlugin isReadMode={interfaceMode} />

        {/* Editor area */}
        <div className={`${styles.editorInner} ${interfaceMode ? styles.readMode : ''}`}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={styles.contentEditable} />}
            placeholder={<div className={styles.placeholder}>{placeholder}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />

          {/* Core plugins */}
          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin 
            validateUrl={(url) => /^https?:\/\//i.test(url)}
            attributes={{
              target: '_blank',
              rel: 'noopener noreferrer'
            }}
          />
          <TabIndentationPlugin />

          {/* Markdown live transformation */}
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

          {/* Custom plugins */}
          <FloatingToolbarPlugin isReadMode={interfaceMode}/>
          <CodeBlockExitPlugin />
          <OnBlurPlugin onBlur={onSave} lastSavedContentRef={lastSavedContentRef} />
          <AutosavePlugin onSave={onSave} noteId={noteId} lastSavedContentRef={lastSavedContentRef} onDirtyChange={onDirtyChange} />
          <LinkClickPlugin isReadMode={interfaceMode} />
          <CodeCopyPlugin />

          {/* Read mode or not */}
          <ReadModeListener isReadMode={interfaceMode} />

          {/* Initialize content from markdown */}
          <MarkdownInitPlugin initialMarkdown={initialContent} />
        </div>
      </div>
    </LexicalComposer>
  );
}

export default LexicalEditor;
