import React from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { restoreDefaultReadProvider, useReadProvider, useWalletProvider } from "../common/provider";
import config from "../config";

export default function WalletButton() {
    const [readProvider, setReadProvider] = useReadProvider();
    const [walletProvider, setWalletProvider] = useWalletProvider();

    const providerOptions = {
        /* See Provider Options Section */
        walletconnect: {
            package: WalletConnectProvider,
            options: {
            infuraId: config.api_keys.infura.project_id
            }
        }
    };

    const connectWallet = async () => {
        const web3Modal = new Web3Modal({
            network: config.networks.external,
            cacheProvider: false, 
            providerOptions,
            disableInjectedProvider: false
        });
        // Force to prompt wallet selection
        web3Modal.clearCachedProvider();
        
        const wallet = await web3Modal.connect();

        // Remove any pre-existing event handlers
        delete wallet._events.accountsChanged;
        delete wallet._events.chainChanged;
        delete wallet._events.disconnect;

        // The only remaining one is the default connect eventHandler
        wallet._eventsCount = 1;

        const handleDisconnect = () => {
            setWalletProvider(null);
            restoreDefaultReadProvider();
        }

        const handleChange = async () => {
            if (wallet.selectedAddress) {
                const regeneratedProvider = new ethers.providers.Web3Provider(wallet);
                setReadProvider(regeneratedProvider);
                setWalletProvider(regeneratedProvider);
            }
            else {
                // If the provider is connected but no addresses are selected, treat it as a disconnection
                handleDisconnect();
            }
        }

        wallet.on('disconnect', handleDisconnect)
        wallet.on('accountsChanged', handleChange)
        wallet.on('chainChanged', handleChange)

        const newProvider = new ethers.providers.Web3Provider(wallet);
        setReadProvider(newProvider);
        setWalletProvider(newProvider);
    }

    return (
        <div className="buttons">
            <a className="button is-link" onClick={connectWallet}>{walletProvider ? 'Change Wallet' : 'Connect Wallet'}</a>
        </div>
    )
}