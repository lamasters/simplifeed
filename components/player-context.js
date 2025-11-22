import { createContext, useContext, useRef, useState } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const [playing, setPlaying] = useState(false);
    const [podcast, setPodcast] = useState(null);
    const [listenTime, setListenTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [queue, setQueue] = useState([]);
    const audioPlayer = useRef();

    const value = {
        playing,
        setPlaying,
        podcast,
        setPodcast,
        listenTime,
        setListenTime,
        loading,
        setLoading,
        queue,
        setQueue,
        audioPlayer,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    return useContext(PlayerContext);
}
