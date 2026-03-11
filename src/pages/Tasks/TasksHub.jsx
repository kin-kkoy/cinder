import { useState, useEffect, useRef } from "react"
import TaskCard from "../../components/Tasks/TaskCard"
import AddTaskCard from "../../components/Tasks/AddTaskCard"
import styles from './TasksHub.module.css'
import DailyTaskCard from "../../components/Tasks/DailyTaskCard"
import ConfirmModal from "../../components/Common/ConfirmModal"
import TaskDetailsModal from "../../components/Common/TaskDetailsModal"
import DailyTaskModal from "../../components/Common/DailyTaskModal"
import { HiOutlineTrash, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi'

function TasksHub({
  tasks,
  dailyTasks,
  tasksPagination,
  dailyTasksPagination,
  loadMoreTasks,
  loadMoreDailyTasks,
  loadingMore,
  loading,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  addDailyTask,
  updateDailyTask,
  deleteDailyTask,
  toggleDailyTaskCompletion
}) {

  // Persist view mode in localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('tasksViewMode') || 'card'
  })
  const [sortBy, setSortBy] = useState('priority')
  const [sortDir, setSortDir] = useState('asc') // sorting direction (ascending/descending)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState([]) // for deleting
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [openTask, setOpenTask] = useState(null)
  const [openDailyTask, setOpenDailyTask] = useState(null)
  const [isDailyCardOpen, setIsDailyCardOpen] = useState(false)
  const tasksSentinelRef = useRef(null)
  const dailyTasksSentinelRef = useRef(null)
  const scrollIntentTimeoutRef = useRef(null)

  const hasMoreTasks = tasksPagination?.hasNextPage
  const hasMoreDailyTasks = dailyTasksPagination?.hasNextPage

  // Sort tasks: incomplete first, then by priority (High -> Normal -> Low)
  const priorityOrder = { high: 0, normal: 1, low: 2 }
  const sortedTasks = [...tasks].sort((a, b) => {
    // First sort by completion status (incomplete first)
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }

    // Sort by priority within each group
    if(sortBy === 'priority') return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)

    // Or sort by due date
    if(sortBy === 'dueDate'){

      // check if both have date or are null
      if(!a.due_date && !b.due_date) return 0
      if(!a.due_date) return 1
      if(!b.due_date) return -1

      //if both have dates then compare and sort
      if(sortDir === 'dsc'){
        return new Date(a.due_date) - new Date(b.due_date)
      }else{
        return new Date(b.due_date) - new Date(a.due_date)
      }
    }

  })

  // Intersection Observer for tasks infinite scroll
  useEffect(() => {
    if (!hasMoreTasks || loadingMore) return

    const sentinel = tasksSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !loadingMore) {
          // Delay fetch to detect scroll intent (user must keep scrolling)
          scrollIntentTimeoutRef.current = setTimeout(() => {
            loadMoreTasks()
          }, 300)
        } else {
          // User scrolled away - cancel pending fetch
          if (scrollIntentTimeoutRef.current) {
            clearTimeout(scrollIntentTimeoutRef.current)
          }
        }
      },
      {
        root: null,
        rootMargin: '100px', // Trigger slightly before sentinel is visible
        threshold: 0
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      if (scrollIntentTimeoutRef.current) {
        clearTimeout(scrollIntentTimeoutRef.current)
      }
    }
  }, [hasMoreTasks, loadingMore, loadMoreTasks])

  // Intersection Observer for daily tasks infinite scroll
  useEffect(() => {
    if (!hasMoreDailyTasks || loadingMore) return

    const sentinel = dailyTasksSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !loadingMore) {
          setTimeout(() => {
            loadMoreDailyTasks()
          }, 300)
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0
      }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMoreDailyTasks, loadingMore, loadMoreDailyTasks])

  const changeView = () => {
    const newMode = viewMode === "card" ? "list" : "card"
    setViewMode(newMode)
    localStorage.setItem('tasksViewMode', newMode)
  }

  // Selecting Task Logic
  const openDailyCardDetails = (task) => {
    setOpenDailyTask(task);
  }
  const openCardDetails = (task) => {
    setOpenTask(task);
  }
  
  // Toggle Selection for DELETING ------
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedTasks([])
  }

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }

  const handleBatchDelete = () => {
    if (selectedTasks.length === 0) return
    setShowDeleteModal(true)
  }

  const confirmBatchDelete = () => {
    selectedTasks.forEach(id => deleteTask(id))
    setSelectedTasks([])
    setIsSelectionMode(false)
    setShowDeleteModal(false)
  }


  return (
    <div className={styles.container}>

        <div className={styles.header}>
          <h1>Tasks<span className={styles.accent}>Hub</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            {isSelectionMode && ` (${selectedTasks.length} selected)`}
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Sroting options */}
            <select
              value={sortBy}
              onChange={ e => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="priority">Priority</option>
              <option value="dueDate">Deadline</option>
            </select>
            {sortBy === 'dueDate' && (
              <select value={sortDir} onChange={ e => setSortDir(e.target.value)} className={styles.sortSelect}>
                <option value="asc">Earliest</option>
                <option value="dsc">Furthest</option>
              </select>
            )}

            {/* Delete button - always visible */}
            <button
              onClick={isSelectionMode ? handleBatchDelete : toggleSelectionMode}
              className={styles.batchDeleteBtn}
              disabled={isSelectionMode && selectedTasks.length === 0}
              title={isSelectionMode ? "Delete selected tasks" : "Select tasks to delete"}
            >
              <HiOutlineTrash size={18} />
            </button>

            {/* Cancel button - only in selection mode */}
            {isSelectionMode && (
              <button onClick={toggleSelectionMode} className={styles.toggleBtn}>
                Cancel
              </button>
            )}

            <button onClick={changeView} className={styles.toggleBtn} title={viewMode === "list" ? "Card View" : "List View"}>
              {viewMode === "list" ? <HiOutlineViewGrid size={18} /> : <HiOutlineViewList size={18} />}
            </button>
          </div>
        </div>

        
        {/* BODY ================================================================ */}
        <div className={viewMode === "card" ? styles.gridView : styles.listView}>

          {/* Add Task Component */}
          <AddTaskCard addTask={addTask} viewMode={viewMode} />

          {/* Daily Tasks Section */}
          <DailyTaskCard
            tasks={dailyTasks}
            toggleCompletion={toggleDailyTaskCompletion}
            deleteTask={deleteDailyTask}
            onOpenDetail={openDailyCardDetails}
            onOpenCard={() => setIsDailyCardOpen(true)}
          />

          {/* Daily tasks infinite scroll sentinel */}
          {hasMoreDailyTasks && (
            <div ref={dailyTasksSentinelRef} className={styles.sentinel}>
              {loadingMore ? <span className={styles.loadingDots}>...</span> : <span className={styles.moreDots}>...</span>}
            </div>
          )}

          {/* Normal Tasks Section - sorted by priority (High -> Normal -> Low) */}
          {loading ? (
            <p>Loading tasks...</p>
          ) : sortedTasks.length > 0 ? (
            sortedTasks.map(task => (
              <TaskCard key={task.id}
               task={task}
               deleteTask={deleteTask}
               toggleCompletion={toggleTaskCompletion}
               viewMode={viewMode}
               isSelectionMode={isSelectionMode}
               isSelected={selectedTasks.includes(task.id)}
               onToggleSelect={() => toggleTaskSelection(task.id)}
               onOpenDetail={openCardDetails}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No tasks yet. Create today's set of tasks or create a new task to do</p>
            </div>
          )}

          {/* Tasks infinite scroll sentinel (...) */}
          {hasMoreTasks && (
            <div ref={tasksSentinelRef} className={styles.sentinel}>
              {loadingMore ? <span className={styles.loadingDots}>...</span> : <span className={styles.moreDots}>...</span>}
            </div>
          )}
        </div>

        {/* Open task details Modal for DAILY TASK */}
        {isDailyCardOpen && <DailyTaskModal 
          tasks={dailyTasks}
          toggleCompletion={toggleDailyTaskCompletion}
          addDailyTask={addDailyTask}
          deleteTask={deleteDailyTask}
          onOpenDetail={openDailyCardDetails}
          onClose={() => setIsDailyCardOpen(false)}
        />}
        {openDailyTask && <TaskDetailsModal 
          onClose={() => setOpenDailyTask(null)}
          task = {openDailyTask}
          updateTask={updateDailyTask}
          isDailyTask={true}
        />}
        
        {/* Open Task details Modal for NORMAL TASK*/}
        {openTask && <TaskDetailsModal 
          onClose={() => setOpenTask(null)}
          task = {openTask}
          updateTask={updateTask}
        />}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmBatchDelete}
          title="Delete Tasks"
          message={`Are you sure you want to delete ${selectedTasks.length} selected task(s)? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />

    </div>
  )
}

export default TasksHub
