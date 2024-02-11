import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';

import Head from 'next/head';
import Loader from '../../components/loader';
import { UserSession } from '../../util/session';
import styles from '../../styles/Login.module.css';
import { useRouter } from 'next/router';
import { useState } from 'react';

/**
 * Renders the signup page.
 * @returns {JSX.Element} The signup page component.
 */
export default function Login() {
    let session = new UserSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const signupFail = () =>
        toast.error('Failed to create an account', {
            position: 'bottom-center',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Slide,
        });
    const passwordMismatch = () =>
        toast.error("Passwords don't match", {
            position: 'bottom-center',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Slide,
        });
    const loginFailed = () =>
        toast.error('Login failed', {
            position: 'bottom-center',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Slide,
        });
    const router = useRouter();

    const updateEmail = (e) => {
        setEmail(e.target.value);
    };

    const updatePassword = (e) => {
        setPassword(e.target.value);
    };

    const updateConfirm = (e) => {
        setConfirm(e.target.value);
    };

    return (
        <div>
            <Head>
                <title>SimpliFeed</title>
                <link rel="icon" href="/favicon.ico" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="manifest" href="/manifest.json" />
            </Head>

            <main id={styles.container}>
                <header id={styles.header}>
                    <img src="/simplifeed.png" width="128px" height="128px" />
                    <h1>SimpliFeed</h1>
                </header>

                <form
                    id={styles.cluster}
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                >
                    <label>Email:</label>
                    <input onChange={updateEmail} type="text" />
                    <label>Password:</label>
                    <input onChange={updatePassword} type="password" />
                    <label>Confirm Password:</label>
                    <input onChange={updateConfirm} type="password" />
                    <label
                        style={{
                            color:
                                password === confirmPassword ? 'green' : 'red',
                        }}
                    >
                        {password === confirmPassword
                            ? 'Passwords match'
                            : "Passwords don't match"}
                    </label>
                    <button
                        onClick={() => {
                            if (password === confirmPassword) {
                                session.register(
                                    email,
                                    password,
                                    router,
                                    setLoading,
                                    signupFail,
                                    loginFailed
                                );
                            } else {
                                passwordMismatch();
                            }
                        }}
                        type="submit"
                    >
                        Sign Up
                    </button>
                </form>
                {loading ? <Loader /> : null}
            </main>
            <ToastContainer />
        </div>
    );
}
