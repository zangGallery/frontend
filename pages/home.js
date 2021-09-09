import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";

export default function home() {
    const [provider, setProvider] = useState(null)
    useEffect(() => {
        const providerOptions = {
            /* See Provider Options Section */
        };
          
          const web3Modal = new Web3Modal({
            network: "mainnet", // optional
            cacheProvider: true, // optional
            providerOptions // required
        });
          
        const walletProvider = await web3Modal.connect();
        setProvider(new ethers.providers.Web3Provider(walletProvider));
    }, [])
    

    return (
        <div>
            {provider.getBlockNumber()}
        </div>
    )
}