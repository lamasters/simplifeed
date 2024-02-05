/**
 * Renders the Login component.
 * @returns {JSX.Element} The rendered login failed component.
 */
export default function Failure() {
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
                <h1>FAILED LOGIN</h1>
            </main>
        </div>
    );
}
