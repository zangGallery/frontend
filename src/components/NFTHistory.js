import React, { useState } from "react";
import { useEffect } from "react";
import { useReadProvider } from "../common/provider";
import config from "../config";
import { v1 } from "../common/abi";
import { ethers } from "ethers";

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

    const getTransferEvents = async (relevantAddresses) => {
        const zangContract = new ethers.Contract(zangAddress, zangABI, readProvider);
        relevantAddresses = [...relevantAddresses];
        const queriedAddresses = [];

        const foundEvents = [];

        const addAddress = (address) => {
            if (!relevantAddresses.includes(address) && !queriedAddresses.includes(address) && address != ethers.constants.AddressZero) {
                relevantAddresses.push(address);
            }
        }

        const addEvent = (event) => {
            let eventExists = false;
            for (const foundEvent of foundEvents) {
                if (foundEvent.transactionHash == event.transactionHash && foundEvent.logIndex == event.logIndex) {
                    eventExists = true;
                    break;
                }
            }

            if (!eventExists) {
                foundEvents.push(event);
            }
        }

        while (relevantAddresses.length > 0) {
            const currentRelevantAddresses = [...relevantAddresses];
            relevantAddresses = [];

            const eventPromises = [];

            for (const address of currentRelevantAddresses) {
                console.log('Querying address', address);
                queriedAddresses.push(address);

                const transferOperatorFilter = zangContract.filters.TransferSingle(address, null, null);
                const transferFromFilter = zangContract.filters.TransferSingle(null, address, null);
                const transferToFilter = zangContract.filters.TransferSingle(null, null, address);

                eventPromises.push(
                    zangContract.queryFilter(transferOperatorFilter, firstZangBlock),
                    zangContract.queryFilter(transferFromFilter, firstZangBlock),
                    zangContract.queryFilter(transferToFilter, firstZangBlock)
                );
            }

            const events = await Promise.all(eventPromises);

            for (const eventGroup of events) {
                for (const event of eventGroup) {
                    const { from, to, operator, id: nftId } = event.args;

                    if (nftId == id) {
                        addAddress(from);
                        addAddress(to);
                        addAddress(operator);

                        addEvent(event);
                    }
                }
            }
        }

        return foundEvents;
    }

    const queryHistory = async () => {
        const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceABI, readProvider);

        const tokenListedFilter = marketplaceContract.filters.TokenListed(id, null);
        const tokenDelistedFilter = marketplaceContract.filters.TokenDelisted(id, null);
        const tokenPurchasedFilter = marketplaceContract.filters.TokenPurchased(id, null, null);

        const [tokenListedEvents, tokenDelistedEvents, tokenPurchasedEvents] = await Promise.all([
            marketplaceContract.queryFilter(tokenListedFilter, firstMarketplaceBlock),
            marketplaceContract.queryFilter(tokenDelistedFilter, firstMarketplaceBlock),
            marketplaceContract.queryFilter(tokenPurchasedFilter, firstMarketplaceBlock)
        ]);

        const relevantAddresses = [authorAddress];

        const addRelevantAddress = (address) => {
            if (!relevantAddresses.includes(address) && address != ethers.constants.AddressZero) {
                relevantAddresses.push(address);
            }
        }

        for (const tokenListedEvent of tokenDelistedEvents) {
            addRelevantAddress(tokenListedEvent.args._seller);
        }
        for (const tokenPurchasedEvent of tokenPurchasedEvents) {
            addRelevantAddress(tokenPurchasedEvent.args._buyer);
            addRelevantAddress(tokenPurchasedEvent.args._seller);
        }

        const transferEvents = await getTransferEvents(relevantAddresses);
        console.log(transferEvents);

        const allEvents = [...tokenListedEvents, ...tokenDelistedEvents, ...tokenPurchasedEvents, ...transferEvents];

        allEvents.sort((a, b) => {
            const aElements = [a.blockNumber, a.transactionIndex, a.logIndex];
            const bElements = [b.blockNumber, b.transactionIndex, b.logIndex];

            for (let i = 0; i < aElements.length; i++) {
                if (aElements[i] < bElements[i]) {
                    return -1;
                } else if (aElements[i] > bElements[i]) {
                    return 1;
                }
            }

            return 0;
        });

        console.log(allEvents);

        const balances = {};

        const updateBalance = (address, variation) => {
            if (address == ethers.constants.AddressZero) {
                return;
            }

            if (balances[address] == undefined) {
                balances[address] = 0;
            }

            balances[address] += variation;
        }

        for (const event of allEvents) {
            if (event.event == 'TransferSingle') {
                const { from, to, value } = event.args;
                updateBalance(from, -value.toNumber());
                updateBalance(to, value.toNumber());
            }
        }

        setHistory(allEvents);
        setBalances(balances);
    }

    useEffect(queryHistory, [id, authorAddress]);

    return <></>;
}