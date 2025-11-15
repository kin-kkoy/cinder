import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import styles from './ProfileDropdown.module.css'

function ProfileDropdown({ isCollapsed, handleLogout }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const buttonRef = useRef(null) // This refers to the profile button
    const navigate = useNavigate()

    // rerender component or run when clicking outside (this case, the rerendering is to hide/remove the window (which is this component))
    useEffect(() => {
        const handleClickOutside = e => {
            if(dropdownRef.current && !dropdownRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)){
                setIsOpen(false)
            }
        }

        if(isOpen) document.addEventListener('mousedown', handleClickOutside)
        
        // IMPORTANT: This is a cleanup function (callback), we do this so that when the component unmounts or is removed (which is what happens in this case) it'll remove the event listener that we created just above this line
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }

    }, [isOpen])

    const navigateSettings = () => {
        setIsOpen(false)
        navigate('/settings')
    }

    const navigateProfile = () => {
        setIsOpen(false)
        alert(`to be implemented!`)
    }

    const Logout = () => {
        setIsOpen(false)
        handleLogout()
    }

    // get dropdown menu position based on button position (profile btn)
    const getDropdownStyle = () => {
        if(!buttonRef.current) return {}

        // honestly don't knwo much bout this but it's apparently used to get the size of the box
        const rect = buttonRef.current.getBoundingClientRect()

        if(isCollapsed){
            // When collapsed: position to the right of button but ensure it doesn't go off screen
            const maxTop = window.innerHeight - 200  // 200px is approx dropdown height
            const top = Math.min(rect.top, maxTop)  // ← FIX: Don't go below viewport
            
            return {
                position: 'fixed',
                top: `${top}px`,
                left: `${rect.right + 8}px`,
            }
        }else{
            // if expanded, the menu appears above instead
            return{
                position: 'fixed',
                bottom: `${window.innerHeight - rect.top + 8}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`
            }
        }

    }

    return (
        <>
            <button
                ref={buttonRef}  // ← Add ref
                className={`${styles.profileBtn} ${isCollapsed ? styles.collapsed : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={isCollapsed ? "Profile" : undefined}
            >
                <span className={styles.icon}>👤</span>
                {!isCollapsed && <span>Profile</span>}
                {!isCollapsed && (
                    <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>▼</span>
                )}
            </button>

            {/* Render dropdown using Portal */}
            {isOpen && createPortal(
                <div 
                    ref={dropdownRef}
                    className={styles.dropdownMenu}
                    style={getDropdownStyle()}  // ← Position dynamically
                >
                    <button onClick={navigateProfile} className={styles.dropdownItem}>
                        <span className={styles.itemIcon}>👤</span>
                        <span>Profile</span>
                    </button>
                    <button onClick={navigateSettings} className={styles.dropdownItem}>
                        <span className={styles.itemIcon}>⚙️</span>
                        <span>Settings</span>
                    </button>
                    <div className={styles.divider}></div>
                    <button onClick={Logout} className={`${styles.dropdownItem} ${styles.danger}`}>
                        <span className={styles.itemIcon}>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>,
                document.body  // ← Render directly into body
            )}
        </>
    )
}

export default ProfileDropdown