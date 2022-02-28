import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useTransactionStatus } from "./common/transaction_status";
import { ToastContainer, toast } from 'react-toastify';
import TransactionNotifications from "./components/TransactionNotifications";


export default function Wrapper ({ children, props }) {
    

    return (
        <div>
            <Helmet>
                <meta charSet="utf-8" />
                <meta name="icon" href="/public/favicon.ico" />
                <meta name="keywords" content="zang, text, NFTs, on-chain" />
            </Helmet>
            {
                process.env.NODE_ENV !== 'development' ? (
                    <Helmet>
                        <meta http-equiv="Content-Security-Policy" content="script-src 'self'"/>
                    </Helmet>
                ) : <></>
            }
            <div style={{minHeight: "90vh"}}>
                {children}
            </div>
            <TransactionNotifications />
            <footer className="footer has-background-black has-text-white">
                <div className="columns">
                    <div className="column has-text-centered">
                        <p><a href="mailto:team@zang.gallery"><u>team@zang.gallery</u></a></p>
                        <p>Platform fee: 5%</p>
                    </div>
                    <div className="column has-text-centered">
                        <a href="https://twitter.com/zanggallery" target="_blank"><u>Twitter</u></a>
                        <br/>
                        <a href="https://github.com/zanggallery" target="_blank"><u>Github</u></a>
                        <br/>
                        <a href="https://discord.gg/jnpCz9R3gf" target="_blank"><u>Discord</u></a>
                    </div>
                </div>
            </footer>
        </div>
    )
}