import "bulma/css/bulma.min.css";
import '../styles/globals.css'

import React from "react";
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
      <Header />
      <Component {...pageProps} />
    </div>
      
  )
}

export default MyApp
