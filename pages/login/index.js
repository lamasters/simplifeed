import styles from '../../styles/Login.module.css';

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { UserSession } from '../../util/session';

export default function Login() {
    let session = new UserSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const updateEmail = (e) => {
        setEmail(e.target.value);
    };

    const updatePassword = (e) => {
        setPassword(e.target.value);
    };

    return (
        <div>
            <Head>
                <title>SimpliFeed</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main id={styles.container}>
                <header id={styles.header}>
                    <img src="/simplifeed.png" width="128px" height="128px" />
                    <h1>SimpliFeed</h1>
                </header>

                <div id={styles.cluster}>
                    <label>Email:</label>
                    <input onChange={updateEmail} type="text" />
                    <label>Password:</label>
                    <input onChange={updatePassword} type="password" />
                    <button
                        onClick={() => {
                            session.login(email, password, router);
                        }}
                        type="submit"
                    >
                        Sign In
                    </button>
                    <Link
                        href="/signup"
                        style={{
                            color: '#5b97bb',
                            textDecoration: 'underline',
                        }}
                    >
                        Don't have an account? Sign up here!
                    </Link>
                </div>
            </main>
        </div>
    );
}
