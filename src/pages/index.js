import React, { useEffect, useState } from "react";
import { useReadProvider } from "../common/provider";
import { NFTCard } from "../components";
import InfiniteScroll from 'react-infinite-scroll-component';
import config from "../config";
import { v1Abi } from "../common/abi";
import { ethers } from "ethers";
import { Header } from "../components";
import { Helmet } from "react-helmet"

import "bulma/css/bulma.min.css";
import '../styles/globals.css'

export default function Home() {
  const [readProvider, setReadProvider] = useReadProvider();
  const [lastNFTId, setLastNFTId] = useState(null);
  const [nfts, setNFTs] = useState([])

  const increment = 5;

  useEffect(async () => {
    const contractAddress = config.contractAddresses.v1;
    const contractABI = v1Abi;
    const contract = new ethers.Contract(contractAddress, contractABI, readProvider);

    const newLastNFTId = (await contract.lastTokenId());

    setLastNFTId(newLastNFTId.toNumber());
  }, [])

  const getMoreIds = (count) => {
    const newNFTs = [...nfts];

    for (let i = 0; i < count; i++) {
      const newId = lastNFTId - newNFTs.length;
      if (newId >= 1) {
        newNFTs.push(newId);
      }
    }

    setNFTs(newNFTs);
  }

  useEffect(() => getMoreIds(20), [lastNFTId])

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
                <h1 className="title">Latest NFTs</h1>
                <InfiniteScroll
                  dataLength={nfts.length} //This is important field to render the next data
                  next={() => getMoreIds(increment)}
                  hasMore={nfts.length < lastNFTId}
                  loader={<h4>Loading...</h4>}
                  endMessage={
                    <p style={{ textAlign: 'center' }}>
                      <b>That's all folks!</b>
                    </p>
                  }
                >
                  <div className="is-flex is-flex-direction-row is-flex-wrap-wrap">
                {nfts.map((id) => <NFTCard id={id} key={id} />)}
                </div>
                </InfiniteScroll>
              </div>
            </div>
        </div>
    )
}