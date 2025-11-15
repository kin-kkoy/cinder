import { useState } from 'react'
import Card from '../components/NoteCard/Card'
import HorizontalCard from '../components/NoteCard/HorizontalCard'
import AddCard from '../components/NoteCard/AddCard'
import AddCardList from '../components/NoteCard/AddCardList'
import styles from './NotesHub.module.css'

// obtains the notes and 
function NotesHub({ notes, addNote, deleteNote }) {

  const [viewMode, setViewMode] = useState("list")

  const changeView = () => viewMode === "list" ? setViewMode("grid") : setViewMode("list")


  return (
    <div className={styles.container}>


      <div className={styles.header}>
        <h1>NotesHub</h1>
      </div>
        
      <div className={styles.controls}>
        <div>
                <p style={{ color: '#888', fontSize: '14px' }}>
                    {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </p>
            </div>
            <button onClick={changeView} className={styles.toggleBtn}>
                {viewMode === "list" ? "Card View" : "List View"}
            </button>
      </div>


        {/* ADD NOTE FOR LIST VIEW - above list */}
        {viewMode === "list" && <AddCardList addNote={addNote}/>}

        {/* notes display area && ADD NOTE FOR CARD VIEW */}
        <div className={viewMode === "grid" ? styles.gridView : styles.listView}>
          {viewMode === "grid" && <AddCard addNote={addNote}/>}
          
          {viewMode === "list"
            ? notes.map( note => <HorizontalCard key={note.id} note={note} deleteNote={deleteNote} /> )
            : notes.map( note => <Card key={note.id} note={note} deleteNote={deleteNote} /> )
          }
        </div>


    </div>
  )
}

export default NotesHub