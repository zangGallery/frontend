import React, { useState } from "react";
import { useEffect } from "react";
import { useReadProvider } from "../common/provider";
import config from "../config";
import { v1 } from "../common/abi";
import { ethers } from "ethers";
import { computeBalances, getEvents } from "../common/history";

export default function NFTHistory({ id, authorAddress }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;
    const firstZangBlock = config.firstBlocks.v1.polygon.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;
    const firstMarketplaceBlock = config.firstBlocks.v1.polygon.marketplace;

    const [readProvider, setReadProvider] = useReadProvider();
    const [history, setHistory] = useState(null);
    const [balances, setBalances] = useState(null);

    const zangContract = new ethers.Contract(zangAddress, zangABI, readProvider);
    const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceABI, readProvider);


    useEffect(async () => {
        const events = await getEvents(id, zangContract, marketplaceContract, authorAddress, firstZangBlock, firstMarketplaceBlock);
        const balances = computeBalances(events);

        console.log(events);
        console.log(balances);
    }, [id, authorAddress]);

    return <></>;
}