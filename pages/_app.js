import '../styles/globals.css';
import '../styles/player-style.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PlayerProvider } from '../components/player-context';
import GlobalPlayer from '../components/global-player';

// This default export is required in a new `pages/_app.js` file.
export default function App({ Component, pageProps }) {
    return (
        <PlayerProvider>
            <Component {...pageProps} />
            <GlobalPlayer />
            <Analytics />
            <SpeedInsights />
        </PlayerProvider>
    );
}
