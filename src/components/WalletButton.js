import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { mainnetProvider, restoreDefaultReadProvider, useReadProvider, useWalletProvider } from "../common/provider";
import config from "../config";

const styles = {
    ensInfoContainer: {
        display: 'flex',
        alignItems: 'space-between',
        justifyContent : 'center'
    },
    avatar: {
        marginRight: '0.5em'
    }
}

export default function WalletButton() {
    const [readProvider, setReadProvider] = useReadProvider();
    const [walletProvider, setWalletProvider] = useWalletProvider();
    const [ensAddress, setEnsAddress] = useState(null);
    const [ensAvatar, setEnsAvatar] = useState(null);

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
        
        let wallet;
        
        try {
            wallet = await web3Modal.connect();
        } catch (e) {
            // TODO: Set error
            console.log('Error connecting to wallet:', e);
            return;
        }

        // Remove any pre-existing event handlers
        delete wallet._events.accountsChanged;
        delete wallet._events.chainChanged;
        delete wallet._events.disconnect;
        delete wallet._events.network;

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

        // ethers.js recommends refreshing the page when a user changes network
        wallet.on("network", (newNetwork, oldNetwork) => {
            // When a Provider makes its initial connection, it emits a "network"
            // event with a null oldNetwork along with the newNetwork. So, if the
            // oldNetwork exists, it represents a changing network
            if (oldNetwork) {
                window.location.reload();
            }
        });

        const newProvider = new ethers.providers.Web3Provider(wallet);
        setReadProvider(newProvider);
        setWalletProvider(newProvider);

        try {
            const walletAddress = await newProvider.getSigner().getAddress();
            const _ensAddress = await mainnetProvider.lookupAddress(walletAddress);
            setEnsAddress(_ensAddress);
            
            const _ensAvatar = await mainnetProvider.getAvatar(_ensAddress);
            setEnsAvatar(_ensAvatar);
        } catch (e) {
            // TODO: Set error
            console.log(e);
        }
    }

    return (
        <div className="buttons">
            
            <a className="button is-link" style={styles.walletButton} onClick={connectWallet}>{
            walletProvider ? (
                <div style={styles.ensInfoContainer}>
                    {
                        ensAvatar ? (
                            <div className="image" style={styles.avatar}>
                                <img className="is-rounded is-1by1" src={ensAvatar || ''} />
                            </div>
                        ) : <></>
                    }
                    <p>{ensAddress ? ensAddress : 'Change Wallet'}</p>
                </div>
                
                ) : 'Connect Wallet'}
            
            </a>
        </div>
    )
}