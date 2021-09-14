import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import { ethers } from "ethers";
import { useReadProvider } from "../common/provider";
import config from "../config";
import { v1Abi } from "../common/abi";

export default function NFTCard({id}) {
    const router = useRouter();
    const [tokenURI, setTokenURI] = useState(null);
    const [tokenData, setTokenData] = useState(null);
    const [tokenType, setTokenType] = useState(null);
    const [tokenAuthor, setTokenAuthor] = useState(null);
    const [readProvider, setReadProvider] = useReadProvider();

    const contractAddress = config.contractAddresses.v1;
    const contractABI = v1Abi;

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
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        const tokenDataResponse = await fetch(tokenURI);
        const newTokenData = await tokenDataResponse.json();
        setTokenData(newTokenData);
    }

    useEffect(queryTokenURI, [id, readProvider])
    useEffect(queryTokenData, [tokenURI])
    useEffect(queryTokenAuthor, [id, readProvider])

    return (
        <div className="card" onClick={() => router.push('/nft/' + id)}>
            <div className="card-content">
                <div className="media">
                <div className="media-content">
                    <p className="title is-4">{tokenData?.name || ''}</p>
                    <p className="subtitle is-6"> by {tokenAuthor || 'unknown'}</p>
                </div>
                </div>

                <div className="content">
                    {tokenData?.description || ''}
                </div>
            </div>
        </div>
    )
}