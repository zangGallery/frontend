import "bulma/css/bulma.min.css";
import '../styles/globals.css'

import React from "react";
import { Header } from "../components";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  return (
    <div id="app">
      <Header />
      <Component {...pageProps} />
    </div>
      
  )
}

export default MyApp
