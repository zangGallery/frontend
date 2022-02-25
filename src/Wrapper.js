import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useTransactionStatus } from "./common/transaction_status";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Wrapper ({ children, props }) {
    const { transactions } = useTransactionStatus();

    useEffect(() => {
        console.log(transactions);
        if(transactions[0]) {
            toast(JSON.stringify(transactions[0]));
        }
    }, [transactions]);

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
            <p>{JSON.stringify(transactions)}</p>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    )
}