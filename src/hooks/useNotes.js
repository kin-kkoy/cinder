import { useState, useEffect, useCallback } from "react";
import { toast } from "../utils/toast";
import logger from "../utils/logger";

// Custom hook for the notes/notebooks
export const useNotes = (authFetch, API, isAuthed) => {

    const [notes, setNotes] = useState([])
    const [notebooks, setNotebooks] = useState([])
    const [notesPagination, setNotesPagination] = useState(null)
    const [notebooksPagination, setNotebooksPagination] = useState(null)
    const [loadingMore, setLoadingMore] = useState(false)


    // ----------- Fetch data ================================================================
    useEffect(() => {
        if(!isAuthed) return

        const fetchData = async () => {
            try {
                const notesResponse = await authFetch(`${API}/notes`)
                if(notesResponse.ok) {
                    const data = await notesResponse.json()
                    setNotes(data.notes)
                    setNotesPagination(data.pagination)
                }

                const ntbkResponse = await authFetch(`${API}/notebooks`)
                if(ntbkResponse.ok) {
                    const data = await ntbkResponse.json()
                    setNotebooks(data.notebooks)
                    setNotebooksPagination(data.pagination)
                }

            } catch (error) {
                logger.error(`Error fetching for data:`, error)
            }
        }

        fetchData()

    }, [isAuthed, authFetch, API])

    // ----------- Load More Functions (Pagination) ==========================================
    const loadMoreNotes = useCallback(async () => {
        if (!notesPagination?.hasNextPage || loadingMore) return

        setLoadingMore(true)
        try {
            const response = await authFetch(
                `${API}/notes?cursor=${notesPagination.nextCursor}&limit=${notesPagination.limit}`
            )
            if(response.ok) {
                const data = await response.json()
                setNotes(prev => [...prev, ...data.notes]) // Append new notes to existing
                setNotesPagination(data.pagination) // Update pagination for next request
            }
        } catch (error) {
            logger.error('Error loading more notes:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [authFetch, API, notesPagination, loadingMore])

    const loadMoreNotebooks = useCallback(async () => {
        if (!notebooksPagination?.hasNextPage || loadingMore) return

        setLoadingMore(true)
        try {
            const response = await authFetch(
                `${API}/notebooks?cursor=${notebooksPagination.nextCursor}&limit=${notebooksPagination.limit}`
            )
            if(response.ok) {
                const data = await response.json()
                setNotebooks(prev => [...prev, ...data.notebooks]) // Append new notebooks to existing
                setNotebooksPagination(data.pagination)
            }
        } catch (error) {
            logger.error('Error loading more notebooks:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [authFetch, API, notebooksPagination, loadingMore])


    // ----------- Notes Operations like: Creating, deleting, etc. ===========================
    const addNote = useCallback(async (title = 'Untitled') => {
        try {
            const res = await authFetch(`${API}/notes`, {
                method: "POST",
                body: JSON.stringify({ title, body: '' })
            })
            if(!res.ok) throw new Error(`Failed to add note`)

            const newNote = await res.json()
            setNotes(currentNotes => [...currentNotes, newNote])

        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const deleteNote = useCallback(async (id) => {
        try {
            const res = await authFetch(`${API}/notes/${id}`, { method: "DELETE" })
            if(!res.ok) throw new Error(`Failed to delete note`)
            setNotes(allNotes => allNotes.filter( note => note.id !== id))

        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const editTitle = useCallback(async (id, newTitle) => {
        // For this, we'll go the optimistic way: The notes will always be updated so just set the frontend side to already have the updated title. In the background we'll do the api call to actually update

        setNotes(allNotes => allNotes.map( note => note.id === id ? {...note, title: newTitle} : note))

        try {
            await authFetch(`${API}/notes/${id}`, {
                method: "PUT",
                body: JSON.stringify({ title: newTitle })
            })
        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const editBody = useCallback(async (id, newBody) => {
        // Not optimistic here kay i think it's better because the body is quite big
        // Retries with exponential backoff to handle Render cold starts

        const MAX_RETRIES = 3;
        const BACKOFF = [1000, 2000, 4000]; // ms

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const res = await authFetch(`${API}/notes/${id}`, {
                    method: "PUT",
                    body: JSON.stringify({ body: newBody })
                })
                if(!res.ok) throw new Error("Failed to update body/description/contents");
                const data = await res.json()
                setNotes(allNotes => allNotes.map( note => note.id === id ? data : note))
                return true

            } catch (error) {
                logger.error(error)
                if (attempt < MAX_RETRIES - 1) {
                    await new Promise(r => setTimeout(r, BACKOFF[attempt]));
                }
            }
        }

        toast.error('Failed to save note. Your changes are backed up locally.')
        return false
    }, [authFetch, API])

    const toggleFavorite = useCallback(async (id) => {
        // Get current state before update
        setNotes(prevNotes => {
            const note = prevNotes.find(n => n.id === id)
            const newFavoriteState = !note.is_favorite

            // Optimistic update
            const updatedNotes = prevNotes.map(n =>
                n.id === id ? {...n, is_favorite: newFavoriteState} : n
            )

            // Make API call
            authFetch(`${API}/notes/${id}`, {
                method: "PUT",
                body: JSON.stringify({ is_favorite: newFavoriteState })
            }).catch(error => {
                logger.error(error)
                // Revert on error
                setNotes(prevNotes => prevNotes.map(n =>
                    n.id === id ? {...n, is_favorite: !newFavoriteState} : n
                ))
            })

            return updatedNotes
        })
    }, [authFetch, API])

    const updateColor = useCallback(async (id, color) => {
        // Optimistic update
        setNotes(allNotes => allNotes.map( note =>
            note.id === id ? {...note, color} : note
        ))

        try {
            await authFetch(`${API}/notes/${id}`, {
                method: "PUT",
                body: JSON.stringify({ color })
            })
        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const updateTags = useCallback(async (id, tags) => {
        // Optimistic update
        setNotes(allNotes => allNotes.map( note =>
            note.id === id ? {...note, tags} : note
        ))

        try {
            await authFetch(`${API}/notes/${id}`, {
                method: "PUT",
                body: JSON.stringify({ tags })
            })
        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])


    // ----------- Notebook Operations like: Creating, deleting, etc. ===========================
    const createNotebook = useCallback(async (name, noteIds, tags) => {
        try {
            // create notebook
            const res = await authFetch(`${API}/notebooks`, {
                method: "POST",
                body: JSON.stringify({ name, noteIds, tags })
            })
            if(!res.ok) throw new Error("Failed to create notebook");

            // get the newly created notebook and the updated list of notes
            const { notebook, updatedNotes } = await res.json()

            // update notes to be the newly updated list
            setNotes(currentNotes => currentNotes.map( note => {
                const updatedVersion = updatedNotes.find(currNote => currNote.id === note.id)
                return updatedVersion || note
            }))

            // add notebook
            setNotebooks(currNotebooks => [notebook, ...currNotebooks])
            toast.success("Notebook created successfully")

        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const deleteNotebook = useCallback(async (id) => {
        try {
            const res = await authFetch(`${API}/notebooks/${id}`, { method: "DELETE" })
            if(!res.ok) throw new Error("Failed to delete notebook");

            setNotebooks(currentNotebooks => currentNotebooks.filter(note => note.id !== id))

            // Refresh the notes to update their notebook_id and appear on the lists of notes
            const noteRes = await authFetch(`${API}/notes`) // just call GET again
            if(noteRes.ok) setNotes(await noteRes.json())

        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const toggleFavoriteNotebook = useCallback(async (id) => {
        setNotebooks(prevNotebooks => {
            const notebook = prevNotebooks.find(n => n.id === id)
            const newFavoriteState = !notebook.is_favorite

            const updatedNotebooks = prevNotebooks.map(n =>
                n.id === id ? {...n, is_favorite: newFavoriteState} : n
            )

            authFetch(`${API}/notebooks/${id}`, {
                method: "PUT",
                body: JSON.stringify({ is_favorite: newFavoriteState })
            }).catch(error => {
                logger.error(error)
                setNotebooks(prevNotebooks => prevNotebooks.map(n =>
                    n.id === id ? {...n, is_favorite: !newFavoriteState} : n
                ))
            })

            return updatedNotebooks
        })
    }, [authFetch, API])

    const updateNotebookColor = useCallback(async (id, color) => {
        setNotebooks(allNotebooks => allNotebooks.map( notebook =>
            notebook.id === id ? {...notebook, color} : notebook
        ))

        try {
            await authFetch(`${API}/notebooks/${id}`, {
                method: "PUT",
                body: JSON.stringify({ color })
            })
        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const updateNotebookTags = useCallback(async (id, tags) => {
        setNotebooks(allNotebooks => allNotebooks.map( notebook =>
            notebook.id === id ? {...notebook, tags} : notebook
        ))

        try {
            await authFetch(`${API}/notebooks/${id}`, {
                method: "PUT",
                body: JSON.stringify({ tags })
            })
        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const renameNotebook = useCallback(async (id, name) => {
        setNotebooks(allNotebooks => allNotebooks.map( notebook =>
            notebook.id === id ? {...notebook, name} : notebook
        ))

        try {
            await authFetch(`${API}/notebooks/${id}`, {
                method: "PUT",
                body: JSON.stringify({ name })
            })
        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])

    const removeNoteFromNotebook = useCallback(async (notebookId, noteId) => {
        try {
            const res = await authFetch(`${API}/notebooks/${notebookId}/notes/${noteId}`, {
                method: "DELETE"
            })
            if (!res.ok) throw new Error("Failed to remove note from notebook")

            // Update the note locally to remove its notebook_id
            setNotes(allNotes => allNotes.map(note =>
                note.id === noteId ? {...note, notebook_id: null} : note
            ))

            // Update the notebook's note_count
            setNotebooks(allNotebooks => allNotebooks.map(notebook =>
                notebook.id === notebookId ? {...notebook, note_count: Math.max(0, (notebook.note_count || 0) - 1)} : notebook
            ))

        } catch (error) {
            logger.error(error)
        }
    }, [authFetch, API])


    const addNotesToNotebook = useCallback(async (notebookId, noteIds) => {
        try {
            const res = await authFetch(`${API}/notebooks/${notebookId}/notes`, {
                method: "POST",
                body: JSON.stringify({ noteIds })
            })
            if (!res.ok) throw new Error("Failed to add notes to notebook")

            const { updatedNotes } = await res.json()

            setNotes(allNotes => allNotes.map(note => {
                const updated = updatedNotes.find(n => n.id === note.id)
                return updated || note
            }))

            setNotebooks(allNotebooks => allNotebooks.map(notebook =>
                notebook.id === notebookId
                    ? { ...notebook, note_count: (notebook.note_count || 0) + updatedNotes.length }
                    : notebook
            ))

            return updatedNotes
        } catch (error) {
            logger.error(error)
            return []
        }
    }, [authFetch, API])


    return {
        notes,
        notebooks,
        notesPagination,
        notebooksPagination,
        loadMoreNotes,
        loadMoreNotebooks,
        loadingMore,
        addNote,
        deleteNote,
        editTitle,
        editBody,
        toggleFavorite,
        updateColor,
        updateTags,
        createNotebook,
        deleteNotebook,
        toggleFavoriteNotebook,
        updateNotebookColor,
        updateNotebookTags,
        renameNotebook,
        removeNoteFromNotebook,
        addNotesToNotebook
    }
}