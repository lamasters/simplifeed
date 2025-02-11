import styles from '../styles/top-loader.module.css';

/**
 * Renders a loader component.
 * @returns {JSX.Element} The loader component.
 */
export default function TopLoader() {
    return (
        <>
            <div id={styles.loader}></div>
        </>
    );
}
