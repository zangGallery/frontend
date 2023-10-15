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
import * as bl from "../blacklist.json";
import StandardErrorDisplay from "../components/StandardErrorDisplay";

import "bulma/css/bulma.min.css";
import "../styles/globals.css";

export default function Home() {
    const [readProvider] = useReadProvider();
    const [lastNFTId, setLastNFTId] = useState(null);
    const [lastDisplayedNFTId, setLastDisplayedNFTId] = useState(null);
    const [nfts, setNFTs] = useState([]);

    const [, setStandardError] = useRecoilState(standardErrorState);

    const increment = 5;
    var blacklist = bl.default;

    useEffect(async () => {
        const contractAddress = config.contractAddresses.v1.zang;
        const contractABI = v1.zang;
        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            readProvider
        );

        console.log(await contract.name());

        try {
            console.log("Connecting to", contract);
            const newLastNFTId = await contract.lastTokenId();
            console.log("ffff");
            setLastNFTId(newLastNFTId.toNumber());
            setLastDisplayedNFTId(newLastNFTId.toNumber());
        } catch (e) {
            console.log(e);
            setStandardError(formatError(e));
        }
    }, []);

    const getMoreIds = (count) => {
        const NFTs = [...nfts];
        console.log(blacklist);
        var last = lastDisplayedNFTId || lastNFTId;
        if (lastDisplayedNFTId) last--;
        var lastDisplayed = lastDisplayedNFTId;
        console.log("last", last);

        for (let i = 0; i < count; i++) {
            var id = last - i;
            if (id >= 1 && !blacklist.includes(id)) {
                console.log(id);
                NFTs.push(id);
                lastDisplayed = id;
            }
        }

        setLastDisplayedNFTId(lastDisplayed);
        setNFTs(NFTs);
    };

    useEffect(() => getMoreIds(20), [lastNFTId]);

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
                        next={() => getMoreIds(increment)}
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
