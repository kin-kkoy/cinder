import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './LinkPopover.module.css';

function LinkPopover({ isOpen, onClose, onConfirm, anchorPosition, hasSelectedText }) {
  const [url, setUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const popoverRef = useRef(null);
  const urlInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Reset and focus when opened
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setLinkText('');
      // Focus the appropriate input after render
      setTimeout(() => {
        if (hasSelectedText) {
          urlInputRef.current?.focus();
        } else {
          textInputRef.current?.focus();
        }
      }, 10);
    }
  }, [isOpen, hasSelectedText]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!url.trim()) return;

      // Ensure URL has protocol
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('mailto:')) {
        finalUrl = 'https://' + finalUrl;
      }

      if (hasSelectedText) {
        // Just pass the URL, text is already selected
        onConfirm(finalUrl, null);
      } else {
        // Pass both URL and link text
        onConfirm(finalUrl, linkText.trim() || finalUrl);
      }

      onClose();
    },
    [url, linkText, hasSelectedText, onConfirm, onClose]
  );

  if (!isOpen) return null;

  // Estimate popover height (roughly 120px for URL only, 180px with text field)
  const estimatedHeight = hasSelectedText ? 120 : 180;

  // Check if popover would go off bottom of viewport
  const shouldPositionAbove = anchorPosition.y + estimatedHeight + 20 > window.innerHeight;

  // Calculate position - ensure it stays within viewport
  const popoverStyle = {
    position: 'fixed',
    left: `${Math.min(anchorPosition.x, window.innerWidth - 280)}px`,
    transform: shouldPositionAbove ? 'translateX(-50%) translateY(-100%)' : 'translateX(-50%)',
  };

  if (shouldPositionAbove) {
    // Position above the anchor
    popoverStyle.top = `${anchorPosition.y - 8}px`;
  } else {
    // Position below the anchor
    popoverStyle.top = `${anchorPosition.y + 8}px`;
  }

  // Adjust if too close to left/right edges
  if (anchorPosition.x < 140) {
    popoverStyle.left = '140px';
  }
  if (anchorPosition.x > window.innerWidth - 140) {
    popoverStyle.left = `${window.innerWidth - 140}px`;
  }

  return createPortal(
    <div ref={popoverRef} className={styles.popover} style={popoverStyle}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {!hasSelectedText && (
          <div className={styles.field}>
            <label htmlFor="link-text" className={styles.label}>
              Text
            </label>
            <input
              ref={textInputRef}
              id="link-text"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link text"
              className={styles.input}
              autoComplete="off"
            />
          </div>
        )}
        <div className={styles.field}>
          <label htmlFor="link-url" className={styles.label}>
            URL
          </label>
          <input
            ref={urlInputRef}
            id="link-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className={styles.input}
            autoComplete="off"
          />
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.confirmBtn} disabled={!url.trim()}>
            Add Link
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default LinkPopover;
