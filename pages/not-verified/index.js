import Head from 'next/head';
import styles from '../../styles/verify.module.css';
/**
 * Renders the verification confirmation component.
 * @returns {JSX.Element} The rendered verification component.
 */
export default function NotVerified() {
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
                <h1>Verification Email Sent</h1>
                <p>
                    Please click the link sent to your email to continue using
                    Simplifeed
                </p>
            </main>
        </div>
    );
}
