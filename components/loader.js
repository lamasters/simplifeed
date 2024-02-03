import styles from '../styles/loader.module.css';

export default function Loader() {
    return (
        <>
            <div className={styles.loader} id={styles.loader_1}></div>
            <div className={styles.loader} id={styles.loader_2}></div>
            <div className={styles.loader} id={styles.loader_3}></div>
            <div className={styles.loader} id={styles.loader_4}></div>
        </>
    );
}
