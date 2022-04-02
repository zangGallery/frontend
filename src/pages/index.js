import React, { useEffect, useState } from "react";
import { useReadProvider } from "../common/provider";
import { NFTCard } from "../components";
import InfiniteScroll from "react-infinite-scroll-component";
import config from "../config";
import { v1 } from "../common/abi";
import { ethers } from "ethers";
import { Header } from "../components";
import { Helmet } from "react-helmet";
import { useRecoilState } from "recoil";
import { formatError, standardErrorState } from "../common/error";
import StandardErrorDisplay from "../components/StandardErrorDisplay";
import { getListings } from "../common/listings";

import "bulma/css/bulma.min.css";
import "../styles/globals.css";

export default function Home() {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [readProvider] = useReadProvider();
    const [lastNFTId, setLastNFTId] = useState(null);
    const [nfts, setNFTs] = useState([]);
    const [listings, setListings] = useState({});

    const [, setStandardError] = useRecoilState(standardErrorState);

    const defaultIncrement = 5;

    useEffect(async () => {
        const contractAddress = config.contractAddresses.v1.zang;
        const contractABI = v1.zang;
        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            readProvider
        );

        try {
            const newLastNFTId = await contract.lastTokenId();
            setLastNFTId(newLastNFTId.toNumber());
        } catch (e) {
            setStandardError(formatError(e));
        }
    }, []);

    const getMoreIds = (count) => {
        const newNFTs = [...nfts];

        for (let i = 0; i < count; i++) {
            const newId = lastNFTId - newNFTs.length;
            if (newId >= 1) {
                newNFTs.push(newId);
            }
        }

        setNFTs(newNFTs);

        return newNFTs;
    };

    const queryListings = async (newNFTs) => {
        if (!nfts || !readProvider) return;

        const marketplaceContract = new ethers.Contract(
            marketplaceAddress,
            marketplaceABI,
            readProvider
        );

        try {
            const promiseIds = [];
            const promises = [];
            for (const nftId of newNFTs) {
                if (!listings[nftId]) {
                    promiseIds.push(nftId);
                    promises.push(getListings(nftId, marketplaceContract));
                }
            }

            const newListings = await Promise.all(promises);
            const listingsObject = Object.fromEntries(promiseIds.map((promiseId, i) => [promiseId, newListings[i]]));

            setListings((currentListings) => ({...currentListings, ...listingsObject}));
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    const next = (increment) => {
        const newNFTs = getMoreIds(increment);
        queryListings(newNFTs);
    }

    useEffect(() => next(20), [lastNFTId]);

    return (
        <div>
            <Helmet>
                <title>zang</title>
            </Helmet>
            <Header />
            <StandardErrorDisplay />
            <div className="columns m-4">
                <div className="column">
                    <h1 className="title has-text-centered">Latest NFTs</h1>
                    <InfiniteScroll
                        dataLength={nfts.length}
                        next={() => next(defaultIncrement)}
                        hasMore={nfts.length < lastNFTId}
                        loader={<h4>Loading...</h4>}
                        endMessage={
                            lastNFTId === null ? (
                                <p style={{ textAlign: "center" }}>
                                    Loading...
                                </p>
                            ) : (
                                <p style={{ textAlign: "center" }}>
                                    <b>That's all folks!</b>
                                </p>
                            )
                        }
                    >
                        <div
                            className="is-flex is-flex-direction-row is-flex-wrap-wrap"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            {nfts.map((id) => (
                                <NFTCard id={id} key={id} />
                            ))}
                        </div>
                    </InfiniteScroll>
                </div>
            </div>
        </div>
    );
}
