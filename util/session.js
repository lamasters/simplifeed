import {
  Account,
  Client,
  Databases,
  Functions,
  ID,
  Permission,
  Query,
  Role,
} from "appwrite";

import { downloadFeed } from "./rss.js";

export class UserSession {
  constructor() {
    this.client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("6466ae2840a206b68738");

    this.account = new Account(this.client);
    this.database = new Databases(this.client);
    this.functions = new Functions(this.client);

    this.uid = null;
    this.sessionInfo = null;
  }

  async login(email, password, router) {
    try {
      let res = await this.account.createEmailSession(email, password);
      this.sessionInfo = res;
      this.uid = res.$id;
      router.push("/");
    } catch (err) {
      this.uid = null;
      this.sessionInfo = null;
      console.error(err);
      alert("Login failed");
    }
  }

  async logout(router) {
    try {
      await this.account.deleteSession("current");
      this.sessionInfo = null;
      this.uid = null;
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("Logout failed");
    }
  }

  async register(email, password, router) {
    try {
      await this.account.create(ID.unique(), email, password);
      await this.login(email, password, router);
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  }

  async getSession() {
    try {
      let res = await this.account.get();
      this.sessionInfo = res;
      this.uid = res.$id;
      return res;
    } catch (err) {
      this.uid = null;
      this.sessionInfo = null;
      console.error(err);
      return { $id: null };
    }
  }

  async getFeeds() {
    try {
      let feeds = await this.database.listDocuments(
        "6466af38420c3ca601c1",
        "6466af49bd8be929475e",
        [Query.equal("user_id", this.uid)]
      );

      return feeds.documents;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async createFeed(url) {
    if (this.uid == null) {
      await this.getSession();
    }

    let feed = await downloadFeed(url);
    if (feed == null) {
      alert("Could not add feed source");
      return;
    }

    try {
      await this.database.createDocument(
        "6466af38420c3ca601c1",
        "6466af49bd8be929475e",
        ID.unique(),
        { url: url, user_id: this.uid },
        [
          Permission.read(Role.user(this.uid)),
          Permission.write(Role.user(this.uid)),
          Permission.update(Role.user(this.uid)),
          Permission.delete(Role.user(this.uid)),
        ]
      );
    } catch (err) {
      console.error(err);
    }
  }

  async deleteFeed(id) {
    try {
      await this.database.deleteDocument(
        "6466af38420c3ca601c1",
        "6466af49bd8be929475e",
        id
      );
    } catch (err) {
      console.error(err);
    }
  }

  async getArticleSources() {
    let urls = this.getFeeds();
    if (urls == null) {
      return;
    }

    try {
      let res = await this.functions.createExecution(
        "6529c949e39f65da5e91",
        JSON.stringify({ type: "source", urls: urls }),
        false,
        "/",
        "GET"
      );
      let articleSources = JSON.parse(res.response).data;
      let feeds = [];
      let source_data;
      for (let source of articleSources) {
        if (source.status != 200) continue;
        source_data = source.data;
        feeds.push({
          title: source_data.title,
          items: source_data.articles
        });
      }
      return feeds;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getArticle(url, title) {
    try {
      let res = await this.functions.createExecution(
        "6529c949e39f65da5e91",
        JSON.stringify({ type: "content", urls: [url] }),
        false,
        "/",
        "GET"
      );
      let articles_res = JSON.parse(res.response).data[0];
      if (articles_res.status != 200) return <div>Error fetching article.</div>;
      let article = articles_res.data;
      let content = [
        <a
          href={`//${url}`}
          target="_blank"
          style={{ color: "blue", textDecoration: "underline" }}
        >
          View original content
        </a>,
        <br />,
        <h1 style={{ textAlign: "center", margin: "10px" }}>{title}</h1>,
        <br />,
      ];
      for (let tag of article.tags) {
        content.push(<p>{tag}</p>);
        content.push(<br />);
      }
      for (let i = 0; i < 15; i++) {
        content.push(<br />);
      }

      return <div>{content}</div>;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
