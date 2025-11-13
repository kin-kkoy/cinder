import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Auth.module.css'

function RegisterPage({ setIsAuthed }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const navigate = useNavigate();
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    const register = async () => {
        if(!username.trim || !password.trim() || !confirmPassword.trim()){
            setError(`All fields are required`)
            return;
        }

        if(password !== confirmPassword){
            setError(`Passwords don't match!!`)
            return;
        }

        if(password.length < 6){
            setError(`Password must be at least 6 characters long`)
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username, password })
            })

            const data = await res.json();

            if(!res.ok) throw new Error (data.error || 'Registration failed')

            // Change alert to toast later soon
            alert('Registration successful! Going in now')
            localStorage.setItem(`accessToken`, data.accessToken)
            setIsAuthed(true)
            navigate('/notes')

        } catch (error) {
            console.error('Registration erorr:', error)
            setError(error.message || 'Something went wrong when trying to register')
        }finally{
            setLoading(false)
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.authHeader}>
                    <div className={styles.authLogo}>🔥</div>
                    <h1 className={styles.authTitle}>Join Cinder | CHANGE THIS TOO CRINGE LOL</h1>
                    <p className={styles.authSubtitle}>Create your account</p>
                </div>

                {error && <div className={styles.authError}>{error}</div>}

                <div className={styles.authForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Username</label>
                        <input 
                            type="text" 
                            className={styles.formInput}
                            placeholder="Choose a username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onFocus={e => e.target.select()}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Password</label>
                        <input 
                            type="password" 
                            className={styles.formInput}
                            placeholder="Create a password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onFocus={e => e.target.select()}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Confirm Password</label>
                        <input 
                            type="password" 
                            className={styles.formInput}
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            onFocus={e => e.target.select()}
                        />
                    </div>

                    <button 
                        className={styles.authButton} 
                        onClick={register}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </div>

                <div className={styles.authFooter}>
                    <p className={styles.authFooterText}>
                        Already have an account? <a href="/login" className={styles.authLink}>Login now</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage