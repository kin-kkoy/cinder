import styles from './NotebookCard.module.css'

function HorizontalNotebookCard({ notebook, deleteNotebook, onOpen }) {

    const handleDelete = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if(window.confirm(`Delete notebook "${notebook.name}"? (Don't worry notes will not be deleted)`)) deleteNotebook(notebook.id)
    }

    // if u're monkey brain moment:  this is for what happens when this card (Notebook Card) is pressed
    const handleClick = (e) => {
        e.preventDefault()
        onOpen(notebook) // open the modal window instead of navigating
    }

    return (
        <div onClick={handleClick} className={styles.cardLink} style={{ cursor: 'pointer' }}>
            <div className={styles.horizontalCard}>
                <div className={styles.horizontalIcon}>📁</div>
                
                <div className={styles.content}>
                <h4 className={styles.horizontalTitle}>{notebook.name}</h4>
                </div>

                <div className={styles.meta}>
                    <span className={styles.date}>
                        !! change this to category maybe !!
                        {/* {new Date(notebook.created_at).toLocaleDateString()} */}
                    </span>
                    <button onClick={handleDelete} className={styles.deleteBtn}>
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HorizontalNotebookCard