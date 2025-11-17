import { Link } from 'react-router-dom'
import styles from './Card.module.css'

function HorizontalCard({ note, deleteNote, isSelectionMode, isSelected, onToggleSelect }) {

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if(window.confirm(`Delete "${note.title}"?`)) deleteNote(note.id)
  }

  const cardClicked = (e) => {
    // If in selection mode, toggle selection instead of navigating
    if (isSelectionMode) {
      e.preventDefault()
      onToggleSelect()
    }
  }


  const cardContent = (
    <div className={`${styles.horizontalCard} ${isSelected ? styles.selected : ''}`} onClick={cardClicked} >

      {/* checkbox should ONLY APPEAR IN SELECTION MODE */}
      {isSelectionMode && (
        <div className={styles.checkbox}>
          <input type='checkbox'
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className={styles.horizontalCardContent}>
        <h4>{note.title}</h4>
        <p className={styles.preview}>
          {note.body ? note.body.substring(0, 150) + '...' : 'No content yet'}
        </p>
      </div>


      <div className={styles.meta}>        
        {/* Show delete button only when NOT in selection mode */}
        {!isSelectionMode && (
          <button onClick={handleDelete}>
            🗑️
          </button>
        )}
      </div>

    </div>
  )


  return isSelectionMode ? (
    cardContent
  ) : (
    <Link to={`/notes/${note.id}`} style={{textDecoration: 'none'}}>
      {cardContent}
    </Link>
  )
}

export default HorizontalCard