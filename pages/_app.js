import "bulma/css/bulma.min.css";
import '../styles/globals.css'

import Head from 'next/head'
import { Header } from "../components";

function MyApp({ Component, pageProps }) {
  return (
    <div>
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
