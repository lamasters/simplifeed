import { addFeed } from "../util/feed";
import styles from "../styles/Home.module.css";

export default function Sidebar(props) {
  return (
    <div
      id={styles.content}
      style={{ minWidth: props.collapse ? null : "1000px" }}
    >
      <div
        id={styles.sidebar}
        style={{
          width: props.collapse ? "0px" : "calc(25vw - 50px)",
          minWidth: props.collapse ? "0px" : "300px",
          opacity: props.collapse ? 0.0 : 1.0,
        }}
      >
        <div id={styles.navbar}>
          <img
            className={styles.nav}
            src="/simplifeed.png"
            width="64px"
            height="64px"
          />
          <h1 className={styles.nav}>SimpliFeed</h1>
        </div>
        <h2>Feeds</h2>
        <ul id={styles.feedlist}>{props.feedList}</ul>
        <div id={styles.add}>
          <input onChange={props.updateURL} type="text"></input>
          <button
            onClick={() => {
              addFeed(url, props.state);
            }}
            type="submit"
          >
            Add Feed
          </button>
        </div>
        <button
          id={styles.logout}
          onClick={() => props.state.session.logout(props.state.router)}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
