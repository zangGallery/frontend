import Head from 'next/head'
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export default function Home() {
    const [provider, setProvider] = useState(null)
    const [balance, setBalance] = useState(null)

    const connectWallet = async () => {
        const providerOptions = {
          /* See Provider Options Section */
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: "INFURA_ID" // required
            }
          }
      };
        
      const web3Modal = new Web3Modal({
        network: "mainnet", // optional
        cacheProvider: false, // optional
        providerOptions, // required
        disableInjectedProvider: false
      });
      web3Modal.clearCachedProvider();
        
      const walletProvider = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(walletProvider);

      setProvider(newProvider);
      const newBalance = await newProvider.getSigner().getBalance();
      setBalance(newBalance);
    }

    return (
        <div>
          <Head>
            <title>zang</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
            {provider ? <></> : <button onClick={connectWallet}>Connect Wallet</button>}
            {balance ? ethers.utils.formatEther(balance) : null}
        </div>
    )
}