import React from "react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useReadProvider } from "../common/provider";
import config from "../config";
import { v1 } from "../common/abi";
import { navigate } from "gatsby-link";
import MDEditor from "@uiw/react-md-editor"
import rehypeSanitize from "rehype-sanitize";
import { useEns } from "../common/ens";
import TypeTag from "./TypeTag";

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

    const contractAddress = config.contractAddresses.v1.zang;
    const contractABI = v1.zang;

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);

        try {
            const tURI = await contract.uri(id);
            setTokenURI(tURI);
        } catch (e) {
            if (e.errorArgs && e.errorArgs[0] === 'ZangNFT: uri query for nonexistent token') {
                setExists(false);
            } else {
                // TODO: Set error
                console.log(e);
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
            if (e.errorArgs && e.errorArgs[0] === 'ZangNFT: author query for nonexistent token') {
                setExists(false);
            } else {
                // TODO: Set error
                console.log(e);
            }
        }
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        try {
            const tokenDataResponse = await fetch(tokenURI);
            const newTokenData = await tokenDataResponse.json();
            console.log(newTokenData)
            setTokenData(newTokenData);
        } catch (e) {
            // TODO: Set error
            console.log(e)
        }
    }

    const queryTokenContent = async () => {
        if (!tokenData?.text_uri) return;
        var parsedTextURI = tokenData.text_uri.replaceAll("#", "%23") //TODO: workaround, togliere con nuovo deploy
        parsedTextURI = parsedTextURI.replace("text/markdown;charset=UTF-8", "text/markdown");

        try {
            const response = await fetch(parsedTextURI);
            const parsedText = await response.text()
            console.log("content: " + parsedTextURI)
            setTokenType(response.headers.get("content-type"))
            setTokenContent(parsedText)
        } catch (e) {
            // TODO: Set error
            console.log(e)
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

    const effectiveTokenAuthor = lookupEns(tokenAuthor) || tokenAuthor || '...';

    if (!exists) {
        return <></>
    }

    return (
        <div className="card m-3 cursor-pointer" style={styles.card} onClick={() => navigate('/nft?id=' + id)}>
            <div style={styles.cardPreview}>
                {tokenType && tokenContent ? (
                    tokenType == 'text/markdown' ? (
                        <MDEditor.Markdown source={tokenContent} rehypePlugins={[rehypeSanitize]} />
                    ) : <pre className="nft-plain" style={{overflow: 'hidden'}}>{tokenContent}</pre>
                ) : <></>}
            </div>
            <div style={styles.cardShadow}></div>
            <div className="card-content" >
                <div className="media">
                    <div className="media-content">
                        <p className="title is-4">{tokenData?.name || '...'}</p>
                        <p className="subtitle is-6"> by {effectiveTokenAuthor}</p>
                    </div>
                </div>

                <div className="content is-italic" style={styles.description}>
                    {tokenData?.description || '...'}
                </div>
                <div className="has-text-right">
                    <TypeTag type={tokenData?.textURI} isUri={true} />
                </div>
            </div>
        </div>
    )
}