import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { useProvider } from '../../common/provider';
import config from '../../config';
import { ethers } from 'ethers';
import { v1Abi } from '../../common/abi';
import dynamic from "next/dynamic";

const MDViewer = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default.Markdown),
  { ssr: false }
);

export default function NFTPage() {
    const router = useRouter();
    const { id } = router.query;
    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [provider, setProvider] = useProvider()

    const queryTokenURI = async () => {
        if (!id || !provider) return;

        const contractAddress = config.contractAddresses.v1;
        
        const contract = new ethers.Contract(contractAddress, v1Abi, provider);
        const tURI = await contract.uri(id);
  
        setTokenURI(tURI);
    }

    const queryTokenAuthor = async () => {
        if (!id || !provider) return;

        const contractAddress = config.contractAddresses.v1;
        
        const contract = new ethers.Contract(contractAddress, v1Abi, provider);
        const author = await contract.authorOf(id);
  
        setTokenAuthor(author);
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        const tokenDataResponse = await fetch(tokenURI);
        const newTokenData = await tokenDataResponse.json();
        setTokenData(newTokenData);
    }

    const queryTokenContent = async () => {
        if (!tokenData?.textURI) return;
        const response = await fetch(tokenData.textURI);
        const parsedText = await response.text()
        setTokenType(response.headers.get("content-type"))
        setTokenContent(parsedText)
    }

    useEffect(queryTokenURI, [id, provider])
    useEffect(queryTokenData, [tokenURI])
    useEffect(queryTokenContent, [tokenData])

    useEffect(queryTokenAuthor, [id, provider])

    return (
        <div>
            <div className="columns m-4">
                <div className="column is-half">
                    { provider ? (
                        <div>
                            <h1 className="title">{tokenData?.name || 'Unknown NFT'}</h1>
                            {tokenAuthor ? <p className="subtitle">By {tokenAuthor}</p> : <></>}
                            {tokenData?.description ? <p className="is-italic">{tokenData?.description}</p> : <></>}
                            {tokenType && tokenContent ? (
                                tokenType == 'text/markdown' ? (
                                    <MDViewer source={tokenContent} />
                                ) : <p>{tokenContent}</p>
                            ) : <></>}
                        </div>
                    )
                    : <p>Connect a wallet to view this NFT</p>
                    }
                </div>
            </div>
        </div>
    )
}