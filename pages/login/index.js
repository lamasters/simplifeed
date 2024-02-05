import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Loader from '../../components/loader';
import { UserSession } from '../../util/session';
import styles from '../../styles/Login.module.css';
import { useRouter } from 'next/router';
import { useState } from 'react';

/**
 * Renders the Login component.
 * @returns {JSX.Element} The rendered Login component.
 */
export default function Login() {
    let session = new UserSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
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

                <div id={styles.cluster}>
                    <div
                        className={styles.sso}
                        onClick={() => {
                            try {
                                session.account.createOAuth2Session(
                                    'google',
                                    `${window.location.origin}/success`,
                                    `${window.location.origin}/failure`
                                );
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                    >
                        <Image
                            src="/google.png"
                            width={28}
                            height={28}
                            alt="Google logo"
                            style={{ marginRight: '5px' }}
                        />
                        Continue with Google
                    </div>
                    <label>Email</label>
                    <input onChange={updateEmail} type="text" />
                    <label>Password</label>
                    <input onChange={updatePassword} type="password" />
                    <button
                        onClick={() => {
                            session.login(email, password, router, setLoading);
                        }}
                        type="submit"
                    >
                        Sign In
                    </button>
                    <Link
                        href="/signup"
                        style={{
                            color: '#48f',
                            textDecoration: 'underline',
                            marginTop: '10px',
                        }}
                    >
                        Don't have an account? Sign up here!
                    </Link>
                    {loading ? <Loader /> : null}
                </div>
            </main>
        </div>
    );
}
