import { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { HiOutlineTrash } from 'react-icons/hi'
import styles from './DailyTaskModal.module.css'
import ConfirmModal from './ConfirmModal'

function DailyTaskModal({ tasks, toggleCompletion, addDailyTask, deleteTask, onOpenDetail, onClose }) {
    const [taskTitle, setTaskTitle] = useState("")
    const [selectedPriority, setSelectedPriority] = useState('normal')
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState(null)

    const handleDeleteClick = (task) => {
        setTaskToDelete(task)
        setDeleteModalOpen(true)
    }

    const confirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete.id)
        }
        setDeleteModalOpen(false)
        setTaskToDelete(null)
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    const handleAdd = () => {
        if (!taskTitle.trim()) return
        addDailyTask(taskTitle, selectedPriority)
        setTaskTitle("")
    }

    const lowTasks    = tasks.filter(t => t.priority === 'low')
    const normalTasks = tasks.filter(t => t.priority === 'normal')
    const highTasks   = tasks.filter(t => t.priority === 'high')
    const columns = [
        { key: 'high',   label: 'High',   tasks: highTasks   },
        { key: 'normal', label: 'Normal', tasks: normalTasks },
        { key: 'low',    label: 'Low',    tasks: lowTasks    },
    ].filter(col => col.tasks.length > 0)

    const completedCount = tasks.filter(t => t.is_completed).length
    const totalCount = tasks.length

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>Today's Tasks</h3>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* Progress */}
                <div className={styles.progress}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                        />
                    </div>
                    <span className={styles.progressText}>
                        {completedCount} / {totalCount} completed
                    </span>
                </div>

                {/* Add-task row */}
                <div className={styles.addRow}>
                    <input
                        type="text"
                        value={taskTitle}
                        onChange={e => setTaskTitle(e.target.value)}
                        placeholder="New task..."
                        className={styles.addInput}
                        onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                    />
                    <select
                        value={selectedPriority}
                        onChange={e => setSelectedPriority(e.target.value)}
                        className={styles.addSelect}
                    >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                    </select>
                    <button className={styles.addBtn} onClick={handleAdd}>+</button>
                </div>

                {/* Columns */}
                {columns.length > 0 ? (
                    <div className={styles.columnsContainer}>
                        {columns.map(col => (
                            <div key={col.key} className={styles.column}>
                                <div className={`${styles.columnHeader} ${styles[col.key]}`}>
                                    {col.label}
                                </div>
                                <ul className={styles.taskList}>
                                    {col.tasks.map(task => (
                                        <li
                                            key={task.id}
                                            className={`${styles.taskItem} ${task.is_completed ? styles.completed : ''}`}
                                            onClick={() => onOpenDetail(task)}
                                        >
                                            {/* Checkbox */}
                                            <button
                                                className={`${styles.checkbox} ${task.is_completed ? styles.checked : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleCompletion(task.id, !task.is_completed)
                                                }}
                                            >
                                                {task.is_completed && <FaCheck size={12} />}
                                            </button>

                                            {/* Task Content */}
                                            <div className={styles.taskContent}>
                                                <span className={styles.taskTitle}>{task.title}</span>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteClick(task)
                                                }}
                                            >
                                                <HiOutlineTrash size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>No tasks yet — add one above.</div>
                )}

            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setTaskToDelete(null)
                }}
                onConfirm={confirmDelete}
                title="Delete Daily Task"
                message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.` : ''}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    )
}

export default DailyTaskModal
