import React from 'react';
import { useEffect, useState } from 'react';
import { useReadProvider } from '../common/provider';
import config from '../config';
import { ethers } from 'ethers';
import { v1Abi } from '../common/abi';
import rehypeSanitize from "rehype-sanitize";
import * as queryString from "query-string";

import MDEditor from "@uiw/react-md-editor"
import { navigate } from 'gatsby-link';
import { Helmet } from 'react-helmet';
import { Header } from '../components';

import "bulma/css/bulma.min.css";
import '../styles/globals.css'

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
    const { id } = queryString.parse(location.search);
    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [readProvider, setReadProvider] = useReadProvider()
    const [lastNFTId, setLastNFTId] = useState(null)

    const [contractError, setContractError] = useState(null);

    const contractAddress = config.contractAddresses.v1;
    const contractABI = v1Abi;

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;
        
        try {
            const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
            const tURI = await contract.uri(id);
      
            setTokenURI(tURI);
        }
        catch (e) {
            setContractError(e);
        }
    }

    const queryTokenAuthor = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
        try {
            const author = await contract.authorOf(id);
            setTokenAuthor(author);
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
        const response = await fetch(tokenData.textURI);
        const parsedText = await response.text()
        setTokenType(response.headers.get("content-type"))
        setTokenContent(parsedText)
    }

    const queryRoyaltyInfo = async () => {
        if (!id || !readProvider) return;
        
        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
        const [recipient, amount] = await contract.royaltyInfo(id, 10000);
        setRoyaltyInfo({
            recipient,
            amount: amount.div(100).toNumber()
        })
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

    useEffect(() => {
        setContractError(null);
    }, [id])

    useEffect(async () => {
        const contractAddress = config.contractAddresses.v1;
        const contractABI = v1Abi;
        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
    
        const newLastNFTId = (await contract.lastTokenId());
    
        setLastNFTId(newLastNFTId.toNumber());
    }, [])

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
            </div>
        </div>
    )
}