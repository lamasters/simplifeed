import styles from "../../styles/Login.module.css";

import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { UserSession } from "../../util/session";

export default function Login() {
  let session = new UserSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const router = useRouter();

  const updateEmail = (e) => {
    setEmail(e.target.value);
  };

  const updatePassword = (e) => {
    setPassword(e.target.value);
  };

  const updateConfirm = (e) => {
    setConfirm(e.target.value);
  };

  return (
    <div>
      <Head>
        <title>SimpliFeed</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main id={styles.container}>
        <header id={styles.header}>
          <img src="/simplifeed.png" width="128px" height="128px" />
          <h1>SimpliFeed</h1>
        </header>

        <div id={styles.cluster}>
          <label>Email:</label>
          <input onChange={updateEmail} type="text" />
          <label>Password:</label>
          <input onChange={updatePassword} type="password" />
          <label>Confirm Password:</label>
          <input onChange={updateConfirm} type="password" />
          <label
            style={{ color: password === confirmPassword ? "green" : "red" }}
          >
            {password === confirmPassword
              ? "Passwords match"
              : "Passwords don't match"}
          </label>
          <button
            onClick={() => {
              if (password === confirmPassword) {
                session.register(email, password, router);
              } else {
                alert("Passwords don't match");
              }
            }}
            type="submit"
          >
            Sign Up
          </button>
        </div>
      </main>
    </div>
  );
}
