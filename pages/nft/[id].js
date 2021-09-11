import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';

export default function NFTPage() {
    const router = useRouter();
    const { id } = router.query;
    const [tokenURI, setTokenURI] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)

    const queryTokenURI = async () => {
        if (!tokenURI) return null;

        const contractAddress = config.contractAddresses.v1;
        
        const contract = new ethers.Contract(contractAddress, v1Abi, provider);
        const tURI = await contract.tokenURI(requestedTokenId);
  
        setTokenURI(tURI);
    }

    const queryTokenContent = async () => {
        if (tokenURI) {
            const response = await fetch(tokenURI);
            const parsedJson = await response.json()
            setTokenContent(parsedJson)
        }
        else return null;
    }

    useEffect(() => queryTokenURI(), [id])
    useEffect(() => queryTokenContent, [tokenURI])

    return (
        <div>
            <div className="columns m-4">
                <div className="column is-half">
                    <h1 className="title">{tokenURI?.title || 'Unknown NFT'}</h1>
                    {tokenURI?.description ? <p>tokenURI?.description</p> : <></>}

                    <p>Token URI: {tokenURI}</p>
                    <p>{tokenContent}</p>
                </div>
            </div>
        </div>
    )
}