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

export default function NFTPage( { location }) {
    const { id } = queryString.parse(location.search);
    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [readProvider, setReadProvider] = useReadProvider()

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
        const author = await contract.authorOf(id);
  
        setTokenAuthor(author);
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

    useEffect(() => {
        if (!id) {
            navigate('/');
        }
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
                <meta name="icon"href="/public/favicon.ico" />
            </Helmet>
            <Header />
            <div className="columns m-4">
                <div className="column is-half">
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
                <div className="column is-half">
                <h1 className="title">{tokenData?.name || ''}</h1>
                            <p className="subtitle">{tokenAuthor ? `by ${tokenAuthor}` : ''}</p>
                            <p className="is-italic">{tokenData?.description || ''}</p>
                            {royaltyInfo && tokenAuthor && royaltyInfo?.amount !== 0 ? 
                            <p>{royaltyInfo.amount.toFixed(2)}% of every sale goes to {royaltyInfo.recipient == tokenAuthor ? 'the author' : royaltyInfo.recipient}.</p>
                            : <></>
                            }
                    </div>
            </div>
        </div>
    )
}