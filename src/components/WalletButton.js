import React, { useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ensProvider, restoreDefaultReadProvider, useReadProvider, useWalletProvider } from "../common/provider";
import config from "../config";
import ethProvider from "eth-provider";
import {RoutingLink} from ".";
import { atom, useRecoilState } from 'recoil';
import { formatError, standardErrorState } from '../common/error';

const ensAddressState = atom({
    key: 'ensAddress',
    default: null
});

const ensAvatarState = atom({
    key: 'ensAvatar',
    default: null
});

const walletBalanceState = atom({
    key: 'walletBalance',
    default: null
});

const styles = {
    ensInfoContainer: {
        display: 'flex',
        alignItems: 'space-between',
        justifyContent : 'center'
    },
    avatar: {
        marginRight: '0.5em'
    },
    walletButton: {
        borderColor: 'white'
    }
}

export default function WalletButton() {
    const [readProvider, setReadProvider] = useReadProvider();
    const [walletProvider, setWalletProvider] = useWalletProvider();
    const [ensAddress, setEnsAddress] = useRecoilState(ensAddressState);
    const [ensAvatar, setEnsAvatar] = useRecoilState(ensAvatarState);
    const [balance, setBalance] = useRecoilState(walletBalanceState);
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const providerOptions = {
        /* See Provider Options Section */
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: {
                    137: "https://polygon-rpc.com/"
                },
                network: "matic"
            },
        },
        frame: {
            package: ethProvider
        }
    };

    const connectWallet = async () => {
        const web3Modal = new Web3Modal({
            network: config.networks.main.chainId,
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
            if (e?.message) {
                setStandardError(formatError(e));
            } else {
                // Some wallets reject the promise without actually throwing an error.
                // In this situation we fail silently.
                console.log(e);
            }
            return;
        }

        setStandardError(null);

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
            newProvider.getBalance(walletAddress).then(balance => {
                const balanceFormatted = ethers.utils.formatEther(balance);
                setBalance(balanceFormatted);
            });
            const _ensAddress = await ensProvider.lookupAddress(walletAddress);
            setEnsAddress(_ensAddress);
            
            const _ensAvatar = await ensProvider.getAvatar(_ensAddress);
            setEnsAvatar(_ensAvatar);
        } catch (e) {
            // Fetching can fail without side effects
            console.log(e);
        }
    }

    return (
        <div>
            <div className="is-flex is-align-items-center is-justify-content-center has-background-white-ter" style={{borderRadius: '4px', padding: '2px'}}>
                <div className="is-flex is-align-items-center has-text-black" style={{height: "40px"}}><span>{balance ? <div className="p-2">{parseFloat(balance).toFixed(4)} <object className="matic-6" type="image/svg+xml" data="https://zang.gallery/matic_logo.svg" aria-label="Matic" /></div> : ''}</span></div>
                <a className="button has-background-white has-text-black m-0" style={styles.walletButton} onClick={connectWallet}>{
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
            {balance ? <p className="is-size-7">Need more? <RoutingLink href="/bridge"><u>Bridge</u></RoutingLink></p>: <></>}
        </div>
    )
}