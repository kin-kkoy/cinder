import styles from './Card.module.css'
import { Link } from 'react-router-dom'

function Card({ note, deleteNote, isSelectionMode, isSelected, onToggleSelect }) {

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if(window.confirm(`Delete "${note.title}?`)) deleteNote(note.id)
  }

  const cardClicked = (e) => {
    // stop the usual navigation if in selection mode (selecting notes to add to notebook) and instead allow selection
    if(isSelectionMode){
      e.preventDefault()
      onToggleSelect()
    }
  }


  const cardContent = (
    <div className={`${styles.card} ${isSelected ? styles.isSelected : ''}`} 
      onClick={ cardClicked }
    >

      {isSelectionMode && (
        <div className={styles.checkbox}>
          <input type='checkbox'
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <h2 className={styles.title}>{note.title}</h2>
      <p className={styles.preview}>{note.body ? note.body.substring(0, 100) + '...' : 'No content yet'}</p>

      <div className={styles.footer}>
        {!isSelectionMode && (
          <button onClick={handleDelete}>🗑️ Delete Note</button>
        )}


      </div>
    </div>
  )


  return isSelectionMode ? (
    cardContent
  ) : (
    <Link to={`/notes/${note.id}`} style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  )
}

export default Card