import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { useReadProvider } from '../common/provider';
import config from '../config';
import { ethers } from 'ethers';
import { v1Abi } from '../common/abi';
import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";

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
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [readProvider, setReadProvider] = useReadProvider()

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

    useEffect(queryTokenURI, [id, readProvider])
    useEffect(queryTokenData, [tokenURI])
    useEffect(queryTokenContent, [tokenData])

    useEffect(queryTokenAuthor, [id, readProvider])
    useEffect(queryRoyaltyInfo, [id, readProvider])

    return (
        <div>
            <div className="columns m-4">
                <div className="column is-half">
                    { readProvider ? (
                        <div>
                            <h1 className="title">{tokenData?.name || ''}</h1>
                            <p className="subtitle">{tokenAuthor ? `by ${tokenAuthor}` : ''}</p>
                            <p className="is-italic">{tokenData?.description || ''}</p>
                            {tokenType && tokenContent ? (
                                tokenType == 'text/markdown' ? (
                                    <MDViewer source={tokenContent} rehypePlugins={[rehypeSanitize]} />
                                ) : <p>{tokenContent}</p>
                            ) : <></>}
                            {royaltyInfo && tokenAuthor && royaltyInfo?.amount != 0 ? 
                            <p>{royaltyInfo.amount.toFixed(2)}% of every sale goes to {royaltyInfo.recipient == tokenAuthor ? 'the author' : royaltyInfo.recipient}.</p>
                            : <></>
                            }
                        </div>
                    )
                    : <p>Connect a wallet to view this NFT</p>
                    }
                </div>
            </div>
        </div>
    )
}