import { useState } from 'react'
import Card from '../components/NoteCard/Card'
import HorizontalCard from '../components/NoteCard/HorizontalCard'
import AddCard from '../components/NoteCard/AddCard'
import AddCardList from '../components/NoteCard/AddCardList'
import styles from './NotesHub.module.css'
import HorizontalNotebookCard from '../components/NoteCard/HorizontalNotebookCard'
import NotebookCard from '../components/NoteCard/NotebookCard'
import NotebookModal from '../components/Menus/NotebookModal'

// obtains the notes and 
function NotesHub({ notes, notebooks, addNote, deleteNote, createNotebook, deleteNotebook, authFetch, API }) {

  const [viewMode, setViewMode] = useState("list")
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [selectedNotebook, setSelectedNotebook] = useState(null)

  const changeView = () => viewMode === "list" ? setViewMode("grid") : setViewMode("list")

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedNotes([])  // clear the selected notes when toggling
  }

  const toggleNoteSelection = noteId => {
    setSelectedNotes(prevNote => prevNote.includes(noteId) ? prevNote.filter(id => id !== noteId) : [...prevNote, noteId])
  }

  const handleCreateNotebook = async () => {
    if(selectedNotes.length === 0){
      alert('Please select at least one note to create a notebook')
      return
    }

    // get name of notebook
    const name = prompt('Enter notebook name:', 'My Notebook')
    if(!name) return

    // create the notebook --> stop selection mode since successful and clear the notes selected
    await createNotebook(name, selectedNotes)
    setIsSelectionMode(false)
    setSelectedNotes([])
  }

  const handleOpenNotebook = notebook => setSelectedNotebook(notebook)

  const handleCloseModal = () => setSelectedNotebook(null)


  // Filter notes that aren't a part of any notebook
  const loneNotes = notes.filter(note => !note.notebook_id)


  return (
    <div className={styles.container}>


      <div className={styles.header}>
        <h1>NotesHub</h1>
      </div>
        
      <div className={styles.controls}>

        <div>
          <p style={{ color: '#888', fontSize: '14px' }}>
            {notebooks.length} {notebooks.length === 1 ? 'notebook | ' : 'notebooks | '}
            {loneNotes.length} {loneNotes.length === 1 ? 'note' : 'notes'}
            {isSelectionMode && ` (${selectedNotes.length} selected)`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isSelectionMode && (
            <button 
              onClick={handleCreateNotebook} 
              className={styles.createNotebookBtn}
              disabled={selectedNotes.length === 0}
            >
              Create Notebook ({selectedNotes.length})
            </button>
          )}
          
          <button 
            onClick={toggleSelectionMode} 
            className={styles.toggleBtn}
          >
            {isSelectionMode ? 'Cancel' : 'Select Notes'}
          </button>

          <button onClick={changeView} className={styles.toggleBtn}>
            {viewMode === "list" ? "Card View" : "List View"}
          </button>
        </div>

      </div>


      {/* ADD NOTE FOR LIST VIEW - above list */}
      {viewMode === "list" && !isSelectionMode && <AddCardList addNote={addNote}/>}

      {/* notes display area && ADD NOTE FOR CARD VIEW */}
      <div className={viewMode === "grid" ? styles.gridView : styles.listView}>

        {/* list view by default, change if it's in grid view */}
        {viewMode === "grid" && !isSelectionMode && <AddCard addNote={addNote}/>}
        
        {/* display NOTEBOOKS FIRST */}
        {!isSelectionMode && (
          viewMode === "list" ? 
            notebooks.map(notebook => (
              <HorizontalNotebookCard 
                key={notebook.id} 
                notebook={notebook}
                deleteNotebook={deleteNotebook}
                onOpen={handleOpenNotebook}
              />
            ))
            : 
            notebooks.map(notebook => (
              <NotebookCard 
                key={notebook.id} 
                notebook={notebook}
                deleteNotebook={deleteNotebook}
                onOpen={handleOpenNotebook}
              />
            ))
        )}

        {/* afterwards display the LONE NOTES (notes that aren't part of a notebook) */}
        {viewMode === "list" ? 
          loneNotes.map( note => (
            <HorizontalCard key={note.id} 
              note={note} 
              deleteNote={deleteNote} 
              isSelectionMode={isSelectionMode}
              isSelected={selectedNotes.includes(note.id)}
              onToggleSelect={() => toggleNoteSelection(note.id)}
            />
          ))
          : 
          loneNotes.map( note => (
            <Card key={note.id} 
              note={note} 
              deleteNote={deleteNote} 
              isSelectionMode={isSelectionMode}
              isSelected={selectedNotes.includes(note.id)}
              onToggleSelect={() => toggleNoteSelection(note.id)}
            /> 
          ))
        }
      </div>


      {/* Modal area */}
      {selectedNotebook && (
        <NotebookModal
          notebook={selectedNotebook}
          onClose={handleCloseModal}
          authFetch={authFetch}
          API={API}
        />
      )}


    </div>
  )
}

export default NotesHub