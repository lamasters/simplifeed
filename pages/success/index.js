'use client';
import Head from 'next/head';
import Link from 'next/link';

/**
 * Renders the Login component.
 * @returns {JSX.Element} The rendered login success component.
 */
export default function Success() {
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

            <main>
                <h1>SUCCESSFUL LOGIN</h1>
                <Link href={window.location.origin}>Continue</Link>
            </main>
        </div>
    );
}
