import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'

function LoginPage({ setIsAuthed }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    // char char or design purposes
    const [loading, setLoading] = useState('')

    const navigate = useNavigate()
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000' 


    const login = async () => {
        if(!username.trim() || !password.trim()){
            setError('Username & Password required')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',// THIS ALLOWS US TO SEND/RECIEVE COOKIES
                body: JSON.stringify({ username, password })
            })

            const data = await res.json();

            if(!res.ok) throw new Error (data.error || 'Login failed')

            // if loggin in worked well, store the obtained token
            localStorage.setItem(`accessToken`, data.accessToken)
            setIsAuthed(true)

            // then redirect
            navigate('/notes')

        } catch (error) {
            console.error('Login erorr:', error)
            setError(error.message || 'Something went wrong when trying to login')
        }finally{
            setLoading(false)
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>

                <div className={styles.authHeader}>
                    <div className={styles.authLogo}>🔥</div>
                    <h1 className={styles.authTitle}>Welcome to Cinder</h1>
                </div>


                {error && <div className={styles.authError}>{error}</div>}


                <div className={styles.authForm}>

                    {/* username input field */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Username</label>
                        <input 
                            type="text" 
                            className={styles.formInput}
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onFocus={e => e.target.select()}
                        />
                    </div>

                    {/* password input field */}
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Password</label>
                        <input
                            className={styles.formInput}
                            type='password' 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onFocus={e => e.target.select()}
                        />
                    </div>

                    <button
                        className={styles.authButton} 
                        onClick={login}
                        disabled={loading} // this simply makes the button unclickable when pressed.
                    >
                        {loading ? `Logging in...` : `Login`}
                    </button>
                    
                </div>

                {/* redirect to register page */}
                <div className={styles.authFooter}>
                    <p className={styles.authFooterText}>
                        Don't have an account? <a href="/register" className={styles.authLink}>Register now</a>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default LoginPage