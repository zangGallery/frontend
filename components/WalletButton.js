import React from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useProvider } from "../common/provider";

export default function WalletButton() {
    const [provider, setProvider] = useProvider()

    const connectWallet = async () => {
        const providerOptions = {
            /* See Provider Options Section */
            walletconnect: {
                package: WalletConnectProvider, // required
                options: {
                infuraId: "INFURA_ID" // required //TODO: Get true infura id
                }
            }
        };
        
        const web3Modal = new Web3Modal({
            network: "mainnet", // optional
            cacheProvider: false, // optional
            providerOptions, // required
            disableInjectedProvider: false
        });
        //web3Modal.clearCachedProvider();
        
        const walletProvider = await web3Modal.connect();
        const newProvider = new ethers.providers.Web3Provider(walletProvider);

        setProvider(newProvider)
    }

    return (
        <div className="buttons">
            <a className="button is-link" onClick={connectWallet}>Connect Wallet</a>
        </div>
    )
}