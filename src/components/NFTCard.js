import React from "react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useReadProvider } from "../common/provider";
import config from "../config";
import { v1 } from "../common/abi";
import { navigate } from "gatsby-link";
import MDEditor from "@uiw/react-md-editor"
import rehypeSanitize from "rehype-sanitize";
import schemas from "../common/schemas";
import { useEns } from "../common/ens";
import TypeTag from "./TypeTag";
import { isTokenExistenceError } from "../common/error";
import { useRecoilState } from 'recoil';
import { formatError, standardErrorState } from '../common/error';
import HTMLViewer from "./HTMLViewer";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const styles = {
    card: {
        width: '52ch',
        maxWidth: '90%'
    },
    description: {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    },
    cardPreview: {
        height: '20ch',
        overflow: 'hidden',
        padding: '3ch',
        position: 'relative',
    },
    cardShadow: {
        boxShadow: 'inset 0 -2em 2em -3em gray',
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '20ch'
    }
}

export default function NFTCard({ id }) {
    const { lookupEns } = useEns();
    const [tokenURI, setTokenURI] = useState(null);
    const [tokenData, setTokenData] = useState(null);
    const [tokenAuthor, setTokenAuthor] = useState(null);
    const [readProvider, setReadProvider] = useReadProvider();
    const [tokenType, setTokenType] = useState(null);
    const [tokenContent, setTokenContent] = useState(null);
    const [exists, setExists] = useState(true);
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const contractAddress = config.contractAddresses.v1.zang;
    const contractABI = v1.zang;

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);

        try {
            const tURI = await contract.uri(id);
            setTokenURI(tURI);
        } catch (e) {
            if (isTokenExistenceError(e)) {
                setExists(false);
            } else {
                setStandardError(formatError(e));
            }
        }
    }

    const queryTokenAuthor = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);

        try {
            const author = await contract.authorOf(id);

            setTokenAuthor(author);
        } catch (e) {
            if (isTokenExistenceError(e)) {
                setExists(false);
            } else {
                setStandardError(formatError(e));
            }
        }
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        try {
            const tokenDataResponse = await fetch(tokenURI);
            const newTokenData = await tokenDataResponse.json();
            //console.log(newTokenData)
            setTokenData(newTokenData);
        } catch (e) {
            setStandardError(formatError(e));
        }
    }

    const queryTokenContent = async () => {
        if (!tokenData?.text_uri) return;
        var parsedTextURI = tokenData.text_uri.replaceAll("#", "%23") //TODO: workaround, togliere con nuovo deploy
        parsedTextURI = parsedTextURI.replace("text/markdown;charset=UTF-8", "text/markdown");

        try {
            const response = await fetch(parsedTextURI);
            const parsedText = await response.text()
            //console.log("content: " + parsedTextURI)
            setTokenType(response.headers.get("content-type"))
            setTokenContent(parsedText)
        } catch (e) {
            setStandardError(formatError(e));
        }
    }

    const shorten = (text, maxLength) => {
        return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
    }

    useEffect(() => queryTokenURI(), [id, readProvider])
    useEffect(() => queryTokenData(), [tokenURI])
    useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryTokenContent(), [tokenData])
    useEffect(() => setExists(true), [id, readProvider])

    const effectiveTokenAuthor = lookupEns(tokenAuthor) || tokenAuthor || null;

    if (!exists) {
        return <></>
    }

    return (
        <div className="card m-3 cursor-pointer" style={styles.card} onClick={() => navigate('/nft?id=' + id)}>
            <div style={styles.cardPreview}>
                {tokenType && (tokenContent !== null) ? (
                    tokenType == 'text/html' ? (
                        <HTMLViewer source={tokenContent} />
                    ) : (
                        tokenType == 'text/markdown' ? (
                            <MDEditor.Markdown source={tokenContent} rehypePlugins={[() => rehypeSanitize(schemas.validMarkdown)]} />
                        ) : <pre className="nft-plain" style={{overflow: 'hidden'}}>{tokenContent}</pre>
                    )
                ) : <Skeleton count={10}/>}
            </div>
            <div style={styles.cardShadow}></div>
            <div className="card-content" >
                <div className="media">
                    <div className="media-content">
                        <p className="title is-4 mb-0">{tokenData?.name || <Skeleton/>}</p>
                        <span className="subtitle is-6">{effectiveTokenAuthor !== null ? "by " + effectiveTokenAuthor : <Skeleton/>}</span>
                    </div>
                </div>

                <div className="content is-italic" style={styles.description}>
                    {tokenData?.description !== undefined && tokenData?.description !== null ? tokenData.description : <Skeleton/>}
                </div>
                <div className="has-text-right">
                    <TypeTag type={tokenData?.text_uri} isUri={true} />
                </div>
            </div>
        </div>
    )
}