import { Link } from "react-router-dom"
import styles from './SidebarList.module.css'


function SidebarList({ isCollapsed, notes, currentNoteID }) {

    if (isCollapsed) return null; // don't show list if collapsed

    return (
        <div className={styles.notesListContainer}>
            <p className={styles.listTitle}>List of Notes</p>
            <div className={styles.notesList}>
                {notes.length === 0 ? (
                    <p className={styles.emptyMessage}>No notes yet</p>
                ) : (
                    notes.map( note => (
                        // if u're wondering why naay key, reason is it's list
                        <Link key={note.id}
                            to={`/notes/${note.id}`}
                            className={`${styles.noteItem} ${currentNoteID == note.id ? styles.active : ''}`}
                        >
                            <span className={styles.noteTitle}>{note.title || 'Untitled'}</span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}

export default SidebarList