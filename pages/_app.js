import "bulma/css/bulma.min.css";
import '../styles/globals.css'

import Head from 'next/head'
import { Header } from "../components";
import { useEffect } from "react";
import Modal from 'react-modal';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Required for accessibility
    Modal.setAppElement('#app');
  }, [])

  return (
    <div id="app">
      <Head>
          <title>zang</title>
          <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Component {...pageProps} />
    </div>
      
  )
}

export default MyApp
