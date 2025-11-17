import { useEffect, useState } from 'react'
import styles from './NotebookModal.module.css'
import { useNavigate } from 'react-router-dom'

function NotebookModal({ notebook, onClose, authFetch, API}) {
    // the reason why we pass authFetch and API is because clicking on the note will redirect to the notepage hence authfetching the GET through the API

    const [notebookNotes, setNotebookNotes] = useState([])
    const [loading, setLoading] = useState(false) // char char || design
    const navigate = useNavigate() // navigate because modal HAS TO CLOSE BEFORE/AFTER redirecting

    useEffect(() => {
        async function fetchNotebookNotes() {
            try {
                const res = await authFetch(`${API}/notebooks/${notebook.id}/notes`)
                if(!res.ok) throw new Error("Failed to fetch the notes of the notebook");
                const data = await res.json()
                setNotebookNotes(data)
            } catch (error) {
                console.error(`Error fetching notebook's notes:`, error)
            }finally{
                setLoading(false)
            }
        }

        fetchNotebookNotes()
    }, [notebook.id])

    
    // clicking the note
    const handleNoteClick = (noteId) => {
        navigate(`/notes/${noteId}`)
        onClose()
    }

    // closing of modal window
    const handleBacking = (e) => {
        if(e.target === e.currentTarget) onClose()
    }


    return (
        <div className={styles.backdrop} onClick={handleBacking}>
            <div className={styles.modal}>


                <div className={styles.header}>
                    <h2>{notebook.name}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>x</button>
                </div>


                <div className={styles.content}>
                    {loading ? (
                        <p className={styles.loading}>Loading notes....</p>
                    ) : notebookNotes.length === 0 ? (
                        // Though di possible, let's just add IN CASE or IF EVERRR mn jd gani
                        <p className={styles.empty}>No notes in this notebook yet</p>
                    ) : (
                        <div className={styles.noteList}>
                            {/* we gon display each note using map duh */}
                            {notebookNotes.map( note => (
                                <div key={note.id}
                                    className={styles.noteItem}
                                    onClick={() => handleNoteClick(note.id)}
                                >
                                    <h4>{note.title}</h4>
                                    <p>{note.body ? note.body.substring(0, 100) + '...' : 'No content'}</p>
                                    <span className={styles.date}>
                                        {new Date(note.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>



            </div>
        </div>
    )
}

export default NotebookModal