import React, { useEffect, useState } from "react";
import { useReadProvider, useWalletProvider } from "../common/provider";
import { NFTCard } from "../components";
import InfiniteScroll from 'react-infinite-scroll-component';
import config from "../config";
import { v1 } from "../common/abi";
import { ethers } from "ethers";
import { Header } from "../components";
import { Helmet } from "react-helmet"

import "bulma/css/bulma.min.css";
import '../styles/globals.css'

export default function Home() {
  const [readProvider, setReadProvider] = useReadProvider();
  const [walletProvider, setWalletProvider] = useWalletProvider();
  const [lastNFTId, setLastNFTId] = useState(null);
  const [nfts, setNFTs] = useState([])
  const [nftToBalance, setNftToBalance] = useState({});
  const [walletAddress, setWalletAddress] = useState(null);

  const increment = 5;

  useEffect(async () => {
    if (!walletProvider) {
      return;
    }
    const newWalletAddress = await walletProvider.getSigner().getAddress();
    setWalletAddress(newWalletAddress);

    // Reset NFTs, since we don't know which ones we have
    setNFTs([]);

    setNftToBalance({});
    for (const nftId of Object.keys(nftToBalance)) {
      updateNftToBalance(nftId, newWalletAddress);
    }
  }, [walletProvider]);

  useEffect(async () => {
    const contractAddress = config.contractAddresses.v1.zang;
    const contractABI = v1.zang;
    const contract = new ethers.Contract(contractAddress, contractABI, readProvider);

    const newLastNFTId = (await contract.lastTokenId());

    setLastNFTId(newLastNFTId.toNumber());
  }, [])

  const updateNftToBalance = async (nftId, address) => {
    const contractAddress = config.contractAddresses.v1.zang;
    const contractABI = v1.zang;
    const contract = new ethers.Contract(contractAddress, contractABI, readProvider);

    const hexBalance = await contract.balanceOf(address, nftId);
    const balance = hexBalance.toNumber();

    setNftToBalance(currentNftToBalance => ({
      ...currentNftToBalance,
      [nftId]: balance
    }));
  }

  const getMoreIds = async (count, address) => {
    if (!address) {
      return;
    }

    const newNFTs = [...nfts];

    for (let i = 0; i < count; i++) {
      const newId = lastNFTId - newNFTs.length;
      if (newId >= 1) {
        newNFTs.push(newId);
        updateNftToBalance(newId, address);
      }
    }

    setNFTs(newNFTs);
  }

  useEffect(() => getMoreIds(20, walletAddress), [lastNFTId, walletAddress])

  const filteredNfts = nfts.filter(nftId => nftToBalance[nftId] !== undefined && nftToBalance[nftId] !== 0);

  useEffect(() => {
    if (filteredNfts.length < 20 && nfts.length < lastNFTId) {
      getMoreIds(20, walletAddress);
    }
  }, [nfts, walletAddress]);

    return (
        <div>
          <Helmet>
            <meta charSet="utf-8" />
            <title>zang</title>
            <meta name="icon" href="/public/favicon.ico" />
          </Helmet>
            <Header />
            <div className="columns m-4">
              <div className="column">
                <h1 className="title has-text-centered">Owned NFTs</h1>
                {
                  walletAddress ? (
                    <InfiniteScroll
                    dataLength={nfts.length} //This is important field to render the next data
                    next={() => getMoreIds(increment, walletAddress)}
                    hasMore={nfts.length < lastNFTId}
                    loader={<h4>Loading...</h4>}
                    endMessage={ lastNFTId === null ?
                      <p style={{ textAlign: 'center' }}>Loading...</p> : 
                      <p style={{ textAlign: 'center' }}>
                        <b>That's all folks!</b>
                      </p>
                    }
                  >
                    <div className="is-flex is-flex-direction-row is-flex-wrap-wrap" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {filteredNfts.map((id) => <NFTCard id={id} key={id} />)}
                    </div>
                  
                  </InfiniteScroll>
                  ) : (
                    <p className="has-text-centered">Connect a wallet to view owned NFTs</p>
                  )
                }
              </div>
            </div>
        </div>
    )
}