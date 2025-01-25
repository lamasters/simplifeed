import { addPodcast, searchPodcasts } from '../util/feed-api';

import { Typeahead } from 'react-typeahead';
import styles from '../styles/sidebar.module.css';
import { useState } from 'react';

/**
 * Deletes a podcast from the podcastData and loadedData arrays, updates the filter state, and saves the updated podcastData to localStorage.
 * @param {Array} podcastData - The array of podcast data.
 * @param {Array} loadedData - The array of loaded podcast data.
 * @param {string} filter - The current filter value.
 * @param {object} state - Hooks to manipulate application state.
 * @param {string} source - The title of the podcast to be deleted.
 */
function deletePodcast(podcastData, loadedData, filter, state, source) {
    const filteredFeed = podcastData.filter(
        (podcast) => podcast.title !== source
    );
    state.setPodcastData(filteredFeed);
    const filteredLoaded = loadedData.filter(
        (podcast) => podcast.title !== source
    );
    state.setLoadedData(filteredLoaded);
    if (filter === source) {
        state.setFilter(null);
    }
    localStorage.setItem('podcastData', JSON.stringify(filteredFeed));
}

function sortedPodcasts(podcastData) {
    let feedDataCopy = podcastData.slice();
    feedDataCopy.sort((a, b) => {
        let a_title = a.title.toLowerCase();
        let b_title = b.title.toLowerCase();
        if (a_title < b_title) {
            return -1;
        }
        if (a_title > b_title) {
            return 1;
        }
        return 0;
    });
    return feedDataCopy;
}

function getPodcastIcon(source, editing, props) {
    if (editing) {
        return (
            <img
                id={styles.trash}
                src="/trash.png"
                width="28px"
                height="28px"
                onClick={async () => {
                    await props.state.session.deletePodcast(source.id);
                    deletePodcast(
                        props.podcastData,
                        props.loadedData,
                        props.filter,
                        props.state,
                        source?.title
                    );
                }}
            />
        );
    } else {
        if (!source?.url) {
            return null;
        }
        let url = source.url.replace('https://', '').split('/')[0];
        try {
            url = new URL(source.url).origin;
            if (source.items.length > 0) {
                url = new URL(source.items[0]?.link).origin;
            }
        } catch {
            console.error('Invalid URL');
        }
        return (
            <img
                id={styles.icon}
                src={`https://www.google.com/s2/favicons?sz=64&domain=${url}`}
                width="28px"
                height="28px"
            />
        );
    }
}

/**
 * Renders the sidebar component.
 *
 * @param {Object} props - The component props.
 * @returns {JSX.Element} The rendered sidebar component.
 */
export default function PodcastSidebar(props) {
    const [url, setURL] = useState('');
    const [editing, setEditing] = useState(false);
    const [feedOptions, setFeedOptions] = useState([]);
    return (
        <div id={styles.sidebar}>
            <div id={styles.navbar}>
                <h1 className={styles.nav}>SimpliFeed</h1>
            </div>
            <h2>Podcasts</h2>
            <ul id={styles.feedlist}>
                <div className={styles.source_row}>
                    <li
                        onClick={() => props.state.setFilter(null)}
                        className={styles.source}
                        style={{ width: '100%' }}
                        key={0}
                    >
                        All Podcasts
                    </li>
                </div>
                {sortedPodcasts(props.podcastData).map((source) => (
                    <div className={styles.source_row} key={source?.title}>
                        {getPodcastIcon(source, editing, props)}
                        <li
                            onClick={() => props.state.setFilter(source?.title)}
                            className={styles.source}
                        >
                            {source?.title}
                        </li>
                    </div>
                ))}
            </ul>
            <div id={styles.add}>
                <button
                    onClick={() => {
                        setEditing(!editing);
                    }}
                >
                    {editing ? 'Done' : 'Edit Feeds'}
                </button>
                <label>Search Podcasts</label>
                <Typeahead
                    options={feedOptions}
                    maxVisible={5}
                    onChange={async (e) => {
                        setURL(e.target.value);
                        let feeds = await searchPodcasts(
                            props.state,
                            e.target.value
                        );
                        setFeedOptions(feeds);
                    }}
                    onOptionSelected={(url) => {
                        setURL(url);
                        setFeedOptions([]);
                    }}
                    customClasses={{
                        results: styles.search_results,
                        listItem: styles.search_item,
                    }}
                />
                <button
                    onClick={() => {
                        addPodcast(
                            url,
                            props.state,
                            props.podcastData,
                            props.addPodcastFail
                        );
                    }}
                    type="submit"
                >
                    Add Podcast
                </button>
            </div>
            <button onClick={() => props.state.router.push('/')}>
                Switch to News
            </button>
            <button
                id={styles.logout}
                onClick={() =>
                    props.state.session.logout(
                        props.state.router,
                        props.logoutFail
                    )
                }
            >
                Logout
            </button>
        </div>
    );
}
