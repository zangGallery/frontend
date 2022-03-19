import React from "react";
import { Helmet } from "react-helmet";
import { Header } from '../components';

var styles = {
    lifi: {
        height: '115vh',
        width: '90vw',
        border: '3px solid black',
        padding: '2em',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '3em'
    },
    iframe: {
        height: '100%',
        width: '100%'
    }
}

export default function Bridge() {
    return (
        <>
            <Helmet>
                <title>Bridge</title>
            </Helmet>
            <Header />
            <div id="lifi-widget" style={styles.lifi}>
                <iframe id="lifi-iframe" style={styles.iframe} src="https://li.finance/embed?fromChain=eth&amp;toChain=pol&amp;toToken=0x0000000000000000000000000000000000000000" scrolling="auto" allowtransparency="true" title="Li.Fi Widget" class="lifi__widget-iframe" frameborder="0"></iframe>
            </div>
        </>
    )
}