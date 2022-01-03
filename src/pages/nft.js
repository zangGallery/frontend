import React from 'react';
import { useEffect, useState } from 'react';
import { mainnetProvider, useReadProvider, useWalletProvider } from '../common/provider';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import rehypeSanitize from "rehype-sanitize";
import * as queryString from "query-string";

import MDEditor from "@uiw/react-md-editor"
import { navigate } from 'gatsby-link';
import { Helmet } from 'react-helmet';
import { Header, ListModal } from '../components';

import "bulma/css/bulma.min.css";
import '../styles/globals.css'
import Listings from '../components/Listings';

const styles = {
    arrowContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '1em'
    },
    arrow: {
        fontSize: '2em',
        marginRight: '0.75em'
    }
}

export default function NFTPage( { location }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const { id } = queryString.parse(location.search);
    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()
    const [lastNFTId, setLastNFTId] = useState(null)

    const [contractError, setContractError] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;
        
        try {
            const contract = new ethers.Contract(zangAddress, zangABI, readProvider);
            const tURI = await contract.uri(id);
      
            setTokenURI(tURI);
        }
        catch (e) {
            setContractError(e);
        }
    }

    const queryTokenAuthor = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);
        try {
            const author = await contract.authorOf(id);
            setTokenAuthor(author);

            const ensAddress = await mainnetProvider.lookupAddress(author);

            if (ensAddress) {
                setTokenAuthor(ensAddress);
            } else {
                setTokenAuthor(author);
            }
        }
        catch (e) {
            setContractError(e);
        }
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        try {
            const tokenDataResponse = await fetch(tokenURI);
            const newTokenData = await tokenDataResponse.json();
            setTokenData(newTokenData);
        }
        catch (e) {
            setContractError(e);
        }
    }

    const queryTokenContent = async () => {
        if (!tokenData?.textURI) return;
        var parsedTextURI = tokenData.textURI.replaceAll("#", "%23") //TODO: workaround, togliere con nuovo deploy
        parsedTextURI = parsedTextURI.replace("text/markdown;charset=UTF-8", "text/markdown");
        const response = await fetch(parsedTextURI);
        const parsedText = await response.text()
        console.log("content: "+parsedTextURI)
        setTokenType(response.headers.get("content-type"))
        setTokenContent(parsedText)
    }

    const queryRoyaltyInfo = async () => {
        if (!id || !readProvider) return;
        
        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            const [recipient, amount] = await contract.royaltyInfo(id, 10000);
            setRoyaltyInfo({
                recipient,
                amount: amount.div(100).toNumber()
            })
        } catch (e) {
            setContractError(e);
        }
    }

    

    const changeId = (right) => () => {
        if (right) {
            navigate('/nft?id=' + (parseInt(id) + 1));
        }
        else {
            navigate('/nft?id=' + (parseInt(id) - 1));
        }
    }

    useEffect(() => {
        if (!id) {
            navigate('/');
        }
    }, [id])

    useEffect(async () => {
        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            const newLastNFTId = (await contract.lastTokenId());
            setLastNFTId(newLastNFTId.toNumber());
        } catch (e) {
            setContractError(e);
        }

    }, [])

    useEffect(async () => {
        if (walletProvider) {
            try {
                setWalletAddress(await walletProvider.getSigner().getAddress());
            } catch (e) {
                setContractError(e);
            }
        }
    }, [walletProvider])

    useEffect(() => {
        setContractError(null);
    }, [id])

    useEffect(() => queryTokenURI(), [id, readProvider])
    useEffect(() => queryTokenData(), [tokenURI])
    useEffect(() => queryTokenContent(), [tokenData])

    useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryRoyaltyInfo(), [id, readProvider])

    return (
        <div>
            <Helmet>
                <meta charSet="utf-8" />
                <title>zang</title>
                <meta name="icon" href="/public/favicon.ico" />
            </Helmet>
            <Header />
            <div style={styles.arrowContainer}>
                { id == 1 ? <></> : <a style={styles.arrow} className="icon" role="button" onClick={changeId(false)}>{'\u25c0'}</a>}
                { lastNFTId && id == lastNFTId ? <></> : <a style={styles.arrow} className="icon" role="button" onClick={changeId(true)}>{'\u25b6'}</a> }
            </div>
            <div className="columns m-4">
                <div className="column">
                    { readProvider ? (
                        contractError ? <p>Could not retrieve contract info : {contractError.message}.</p> : (
                            <div>
                                <div className="box">
                                {tokenType && tokenContent ? (
                                    tokenType == 'text/markdown' ? (
                                        <MDEditor.Markdown source={tokenContent} rehypePlugins={[rehypeSanitize]} />
                                    ) : <pre className="nft-plain">{tokenContent}</pre>
                                ) : <></>}
                                </div>
                            </div>
                        )
                    )
                    : <p>Connect a wallet to view this NFT</p>
                    }
                </div>
                { 
                    contractError ? <></> : (
                    <div className="column">
                        <h1 className="title">{tokenData?.name || ''}</h1>
                        <p className="subtitle">{tokenAuthor ? `by ${tokenAuthor}` : ''}</p>
                        <p className="is-italic">{tokenData?.description || ''}</p>
                        {royaltyInfo && tokenAuthor && royaltyInfo?.amount !== 0 ? 
                        <p>{royaltyInfo.amount.toFixed(2)}% of every sale goes to {royaltyInfo.recipient == tokenAuthor ? 'the author' : royaltyInfo.recipient}.</p>
                        : <></>
                        }
                    </div>
                    )
                }
                <Listings readProvider={readProvider} walletProvider={walletProvider} id={id} walletAddress={walletAddress} onError={setContractError} />
            </div>
        </div>
    )
}