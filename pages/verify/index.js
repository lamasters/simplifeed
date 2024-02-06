import { useEffect, useState } from 'react';

import Head from 'next/head';
import { UserSession } from '../../util/session';
import styles from '../../styles/verify.module.css';
import { useRouter } from 'next/router';

/**
 * Renders the verification component.
 * @returns {JSX.Element} The rendered verification component.
 */
export default function Verify() {
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const session = new UserSession();
    const router = useRouter();

    useEffect(() => {
        session.updateVerification(router, setVerified, setLoading);
    }, []);

    let verifyText = '';
    if (loading) {
        verifyText = 'Checking verification...';
    } else if (verified) {
        verifyText = 'Verification successful!';
    } else {
        verifyText = 'Verification failed. Please try signing in again.';
    }
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

            <main className={styles.container}>
                <h1>{verifyText}</h1>
            </main>
        </div>
    );
}
