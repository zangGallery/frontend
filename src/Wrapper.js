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
            {children}
            <TransactionNotifications />
        </div>
    )
}