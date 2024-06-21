import '../styles/globals.css';

import { Analytics } from '@vercel/analytics/react';

// This default export is required in a new `pages/_app.js` file.
export default function App({ Component, pageProps }) {
    return (
        <>
            <Component {...pageProps} />
            <Analytics />
        </>
    );
}
