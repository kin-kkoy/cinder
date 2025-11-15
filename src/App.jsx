import { useEffect, useState } from "react"
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import Sidebar from "./components/Bars/Sidebar.jsx"
import NotePage from "./pages/NotePage.jsx"
import NotesHub from "./pages/NotesHub.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import RegisterPage from "./pages/RegisterPage.jsx"
import TasksHub from "./pages/TasksHub.jsx"
import ModsHub from "./pages/ModsHub.jsx"
import SettingsPage from "./pages/SettingsPage.jsx"

function App() {

  const [notes, setNotes] = useState([])
  const [isAuthed, setIsAuthed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) // for sidebar's margin. It's setter logic will be done on the sidebar (which is the child)
  const [currentNoteID, setCurrentNoteID] = useState(null)

  // first and foremost check if user already has token
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if(accessToken) setIsAuthed(true)
  }, [])

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000' 

  // get token and attach to `Authentication` header
  const getAuthHeaders = () => {
    const accessToken = localStorage.getItem('accessToken')
    return{
      'Content-Type': 'application/json',
      'Authorization': accessToken ? `Bearer ${accessToken}` : ''
    }
  }

  const refreshAuthToken = async () => {
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include' // auto sends HttpOnly cookie
      })

      if (!res.ok) throw new Error(`Failed to refresh token`)

      const data = await res.json()
      localStorage.setItem(`accessToken`, data.accessToken)
      return data.accessToken

    } catch (refreshTokenError) {
      // failed to refresh token = logout user
      localStorage.removeItem(`accessToken`)
      setIsAuthed(false)
      throw error
    }
  }

  // helper function for AUTHENTICATED FETCH
  const authFetch = async (URL, reqProps = {}) => {
    let res = await fetch(URL, {
      ...reqProps,
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
        ...reqProps.headers
      },
    })

    // If access token has expired (15mins), try to refresh it
    if(res.status === 401) {
      try {
        
        // First, try to refresh/reset access token
        await refreshAuthToken()

        // If successfully refreshed, then attempt again to call the fetch request
        res = await fetch(URL, {
          ...reqProps,
          credentials: 'include',
          headers: {
            ...getAuthHeaders(),
            ...reqProps.headers
          },
        })

      } catch (refreshError) {
        console.error(`Token refresh failed:`, refreshError)
        localStorage.removeItem(`accessToken`)
        setIsAuthed(false)
        throw new Error('Session expired. Please login again.')
        
      }
    }

    return res
  }

  // Insta GET notes
  useEffect(() => {
    if(!isAuthed) return // don't fetch if not logged in / invalid session

    async function fetchNotes() {
      try{
        const res = await authFetch(`${API}/notes`)
        if(!res.ok) throw new Error(`Failed to fetch notes`)
        const data = await res.json()
        setNotes(data)
      }catch (err){
        console.error(err)
      }
    }

    fetchNotes()
  }, [isAuthed])

  // add
  const handleAddNote = async (title = 'Untitled') => {
    try{
      const res = await authFetch(`${API}/notes`, {
        method: "POST",
        body: JSON.stringify({ title, body: '' })
      })
      if(!res.ok) throw new Error('Failed to add note')
      const newNote = await res.json()
      setNotes(previousNotes => [...previousNotes, newNote])
    }catch(err){
      console.error('FAILED TO ADD NOTE:  ', err)
    }
  }

  // delete
  const handleDeleteNote = async (id) => {
    try {
      const res = await authFetch(`${API}/notes/${id}`, { method: 'DELETE' })
      if(!res.ok) throw new Error('Failed to add note')
      setNotes(previousNotes => previousNotes.filter(n => n.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  // update (edit) title
  const handleEditTitle = async (id, newTitle) => {
    try {
      const res = await authFetch(`${API}/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title: newTitle })
      })
      if(!res.ok) throw new Error('Failed to add note')
      const updatedNote = await res.json()
      setNotes(previousNotes => previousNotes.map(note => note.id === id ? updatedNote : note))
    } catch (error) {
      console.error(error)
    }
  }
  
  // update (edit) body
  const handleEditBody = async (id, newBody) => {
    try {
      const res = await authFetch(`${API}/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ body: newBody })
      })
      if(!res.ok) throw new Error('Failed to add note')
      const data = await res.json()
      setNotes(previousNotes => previousNotes.map(note => note.id === id ? data : note))
    } catch (error) {
      console.error(error)
    }
  }


  // Wrapper component to get the ID from route parameters
  function NotePageWrapper({ notes, editTitle, editBody, onNoteChange}){
    const { id } = useParams()

    useEffect(() => {
      onNoteChange(id)
    }, [id, onNoteChange])

    return <NotePage notes={notes} editTitle={editTitle} editBody={editBody} />
  }


  //  Elements area
  const notesHubElement = (
    <NotesHub notes={notes} 
    addNote={handleAddNote}
    deleteNote={handleDeleteNote}/>
  )

  // temp style so that my eyes won't cry when dev mode
  const style = {
    backgroundColor: "#121212", // dark grayish background
    color: "#ffffff",            // white text
    minHeight: "100vh",          // full height
    margin: 0,
    padding: 0,
    fontFamily: "Arial, sans-serif",
  };


  return (

    <div style={style}>
      <BrowserRouter>
        <div style={{ display: "flex", 
          flexDirection: "row", 
          margin: 0, 
          padding: 0, 
          backgroundColor: '#121212'
        }}>

          {/* Only show sidebar when logged in */}
          {isAuthed && (
            <Sidebar isCollapsed={isCollapsed} 
              toggleSidebar={setIsCollapsed} 
              notes={notes} 
              currentNoteID={currentNoteID} 
            />
          )}


          {/* blank space reserved for fixed sidebar */}
          {isAuthed && (
            <div style={{
              width: isCollapsed ? '70px' : '250px',
              flexShrink: 0,  /* Prevents this from shrinking */
              transition: 'width 0.3s ease'
            }} />
          )}


          {/* The main page/s (the contents on the right, not sidebar) */}
          <div style={{ flex: 1, 
            padding: isAuthed ? '20px 40px' : '0', 
            overflowY: 'auto', 
            backgroundColor: '#121212',
            minWidth: 0  /* Allows flex item to shrink below content size */
          }}>


            <Routes>
              <Route path="/login" element={<LoginPage setIsAuthed={setIsAuthed} />} />
              <Route path="/register" element={<RegisterPage setIsAuthed={setIsAuthed} />} />
              {isAuthed ? (
                <>
                  <Route path="/notes" element={notesHubElement} />
                  <Route path="/notes/:id" element={
                    <NotePageWrapper notes={notes} 
                      editTitle={handleEditTitle}
                      editBody={handleEditBody}
                      onNoteChange={setCurrentNoteID}
                      />
                    }
                  />
                  <Route path="/tasks" element={<TasksHub />} />
                  <Route path="/mods" element={<ModsHub />} />

                  <Route path="/settings" element={<SettingsPage />} />
                </>
              ) : (
                <Route path="*" element={<LoginPage setIsAuthed={setIsAuthed} />} />
              )}
              {/* <Route path="add" element={}/> */}
            </Routes>

          </div>
        </div>
      </BrowserRouter>
    </div>

  )
}

export default App
