import React from "react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { mainnetProvider, useReadProvider } from "../common/provider";
import config from "../config";
import { v1 } from "../common/abi";
import { navigate } from "gatsby-link";
import MDEditor from "@uiw/react-md-editor"
import rehypeSanitize from "rehype-sanitize";

const styles = {
    card: {
        width: '52ch',
        maxWidth: '52ch'
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
    const [tokenURI, setTokenURI] = useState(null);
    const [tokenData, setTokenData] = useState(null);
    const [tokenAuthor, setTokenAuthor] = useState(null);
    const [readProvider, setReadProvider] = useReadProvider();
    const [tokenType, setTokenType] = useState(null);
    const [tokenContent, setTokenContent] = useState(null);

    const contractAddress = config.contractAddresses.v1.zang;
    const contractABI = v1.zang;

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
        const tURI = await contract.uri(id);

        setTokenURI(tURI);
    }

    const queryTokenAuthor = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
        const author = await contract.authorOf(id);

        setTokenAuthor(author);

        const ensAddress = await mainnetProvider.lookupAddress(author);

        if (ensAddress) {
            setTokenAuthor(ensAddress);
        } else {
            setTokenAuthor(author);
        }
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        const tokenDataResponse = await fetch(tokenURI);
        const newTokenData = await tokenDataResponse.json();
        console.log(newTokenData)
        setTokenData(newTokenData);
    }

    const queryTokenContent = async () => {
        if (!tokenData?.textURI) return;
        var parsedTextURI = tokenData.textURI.replaceAll("#", "%23") //TODO: workaround, togliere con nuovo deploy
        parsedTextURI = parsedTextURI.replace("text/markdown;charset=UTF-8", "text/markdown");
        const response = await fetch(parsedTextURI);
        const parsedText = await response.text()
        console.log("content: " + parsedTextURI)
        setTokenType(response.headers.get("content-type"))
        setTokenContent(parsedText)
    }

    const shorten = (text, maxLength) => {
        return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
    }

    useEffect(() => queryTokenURI(), [id, readProvider])
    useEffect(() => queryTokenData(), [tokenURI])
    useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryTokenContent(), [tokenData])

    return (
        <div className="card m-3 cursor-pointer" style={styles.card} onClick={() => navigate('/nft?id=' + id)}>
            
            <div style={styles.cardPreview}>
                {tokenType && tokenContent ? (
                    tokenType == 'text/markdown' ? (
                        <MDEditor.Markdown source={tokenContent} rehypePlugins={[rehypeSanitize]} />
                    ) : <pre className="nft-plain">{tokenContent}</pre>
                ) : <></>}
            </div>
            <div style={styles.cardShadow}></div>
            <div className="card-content" >
                <div className="media">
                    <div className="media-content">
                        <p className="title is-4">{tokenData?.name || '...'}</p>
                        <p className="subtitle is-6"> by {tokenAuthor || '...'}</p>
                    </div>
                </div>

                <div className="content is-italic" style={styles.description}>
                    {tokenData?.description || '...'}
                </div>
                <div className="has-text-right">
                    {(tokenData?.textURI.split(';')[0] == "data:text/plain" || (tokenData?.textURI.split(',')[0]) == "data:text/plain") ? <span class="tag is-info">plaintext</span> : <span class="tag is-link">markdown</span>}
                </div>
            </div>
        </div>
    )
}