import React from "react";
import { Helmet } from "react-helmet";
import { RecoilRoot } from "recoil";

const wrapPageElement = ({ element, props }) => {
    return (
        <RecoilRoot {...props}>
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
            {element}
        </RecoilRoot>);
}

export {
    wrapPageElement
}