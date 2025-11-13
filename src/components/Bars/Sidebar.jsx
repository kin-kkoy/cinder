import { useState } from "react"
import LogoutBtn from "../Buttons/LogoutBtn";
import { useNavigate } from "react-router-dom";
import styles from './Sidebar.module.css'


// CHANGE EVERYTHING THERE!! WHAT SHOULD HAPPEN:
//  - Initially will not show (in home page) but when either notes/todo/mod(game)
//      is added, will appear and will change depending on whether notes/todo/mod(game)
//  - Notes: will have a buttons for: home page, todo, mod(game). Then below those
//      buttons will be an add note/folder button and then the list of notes (buttons)
//  - Todo: to implement but same concept
//  - Game: (Don't bother yet and think about this feature much more thoroughly)
//  - Bottom part ----------
//  - User icon (button): Opens up a modal with the options:
//       settings, profile page, logout


function Sidebar({ isCollapsed, toggleSidebar }) {

    // Contents depend on whether on notes/note(specific)/todo/mod page
    //  you will use the concept of *mounting* and `useEffect` 
    //      - useEffect to observe when pathname changes like if it's /notes or not

    // for now stay in default mode unless it's time to implement sidebar
    const [currentState, setCurrentState] = useState('def'); // value: def(default)|notes|note|todo|mod

    const navigate = useNavigate()



    // // Don't mind these 2 yet, to be implemented soon since these are just extras
    // // Sort note
    // const sortNote = choice => {
    //     // TODO: Ideally, the sorting happens in the backend, and frontend simply fetches and displays.
    //     alert(`This is temporary, sorting should be implemented`)
    // }
    // // Display note toggle (card/list view)
    // const displayToggle = choice => {
    //     // TODO: Clicking this button toggles between card/list view
    //     alert(`This is temporary, toggling will be implemented`)
    // }


    // logout
    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refreshToken')

        // calling logout endpoint/route to revoke the refresh token
        try {
            await fetch(`${import.meta.VITE_API_URL || 'http://localhost:3000'}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(refreshToken)
            })
        } catch (error) {
            console.error('Logout errror:', error)
        }

        // clear tokens then redirect
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
        window.location.reload()
    }


    return (
        <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>

            <div className={styles.topSection}>
                <button className={styles.toggleBtn} onClick={() => toggleSidebar(!isCollapsed)}>{isCollapsed ? '→' : '☰'}</button>
            </div>

            <div className={styles.menuSection}>
                {!isCollapsed && (<p className={styles.sectionLabel}>---- Dropdown-like window shows these: ----</p>)}
                <button className={styles.menuBtn}
                    onClick={() => alert(`to be implemented`)}
                    title="Profile"  // Tooltip for collapsed state
                >
                    <span className={styles.icon}>👤</span>
                    {!isCollapsed && <span>Profile</span>}
                </button>
                <button className={styles.menuBtn}
                    onClick={() => alert(`to be implemented`)}
                    title="Settings"
                >
                    <span className={styles.icon}>⚙️</span>
                    {!isCollapsed && <span>Settings</span>}
                </button>
            </div>

            <div className={styles.bottomSection}>
                <LogoutBtn handleLogout={handleLogout} isCollapsed={isCollapsed} />
            </div>

        </div>
    )
}

export default Sidebar