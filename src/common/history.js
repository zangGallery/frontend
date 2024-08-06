import { ethers } from "ethers";
import { atom } from "recoil";
import { formatTokenAmount } from "./utils";
import { tokenAddressToId } from "./user";

const blockToDateState = atom({
    key: "blockToDateState",
    default: {},
});

const getTransferEvents = async (
    id,
    nftContract,
    relevantAddresses,
    firstNftBlock
) => {
    relevantAddresses = [...relevantAddresses];
    const queriedAddresses = [];

    const foundEvents = [];

    const addAddress = (address) => {
        if (
            !relevantAddresses.includes(address) &&
            !queriedAddresses.includes(address) &&
            address != ethers.constants.AddressZero
        ) {
            relevantAddresses.push(address);
        }
    };

    const addEvent = (event) => {
        let eventExists = false;
        for (const foundEvent of foundEvents) {
            if (
                foundEvent.transactionHash == event.transactionHash &&
                foundEvent.logIndex == event.logIndex
            ) {
                eventExists = true;
                break;
            }
        }

        if (!eventExists) {
            foundEvents.push(event);
        }
    };

    while (relevantAddresses.length > 0) {
        const currentRelevantAddresses = [...relevantAddresses];
        relevantAddresses = [];

        const eventPromises = [];

        for (const address of currentRelevantAddresses) {
            console.log("Querying address", address);
            queriedAddresses.push(address);

            if (address === null) {
                const allTransfersFilter = nftContract.filters.TransferSingle();
                eventPromises.push(nftContract.queryFilter(allTransfersFilter));
            } else {
                const transferOperatorFilter =
                    nftContract.filters.TransferSingle(address, null, null);
                const transferFromFilter = nftContract.filters.TransferSingle(
                    null,
                    address,
                    null
                );
                const transferToFilter = nftContract.filters.TransferSingle(
                    null,
                    null,
                    address
                );

                eventPromises.push(
                    nftContract.queryFilter(
                        transferOperatorFilter,
                        firstNftBlock
                    ),
                    nftContract.queryFilter(transferFromFilter, firstNftBlock),
                    nftContract.queryFilter(transferToFilter, firstNftBlock)
                );
            }
        }

        const events = await Promise.all(eventPromises);

        for (const eventGroup of events) {
            for (const event of eventGroup) {
                const { from, to, operator, id: nftId } = event.args;

                if (nftId == id || id === null) {
                    addAddress(from);
                    addAddress(to);
                    addAddress(operator);

                    addEvent(event);
                }
            }
        }
    }

    console.log("Found events:", foundEvents);

    return foundEvents;
};

const getEvents = async (
    id,
    nftContract,
    marketplaceContract,
    authorAddress,
    firstNftBlock,
    firstMarketplaceBlock
) => {
    const nftAddress = await nftContract.address;
    const tokenListedFilter = marketplaceContract.filters.TokenListed(
        nftAddress,
        id,
        null
    );
    const tokenDelistedFilter = marketplaceContract.filters.TokenDelisted(
        nftAddress,
        id,
        null
    );
    const tokenPurchasedFilter = marketplaceContract.filters.TokenPurchased(
        nftAddress,
        id,
        null,
        null
    );

    const [tokenListedEvents, tokenDelistedEvents, tokenPurchasedEvents] =
        await Promise.all([
            marketplaceContract.queryFilter(
                tokenListedFilter,
                firstMarketplaceBlock
            ),
            marketplaceContract.queryFilter(
                tokenDelistedFilter,
                firstMarketplaceBlock
            ),
            marketplaceContract.queryFilter(
                tokenPurchasedFilter,
                firstMarketplaceBlock
            ),
        ]);

    const relevantAddresses = [authorAddress];

    const addRelevantAddress = (address) => {
        if (
            !relevantAddresses.includes(address) &&
            address != ethers.constants.AddressZero
        ) {
            relevantAddresses.push(address);
        }
    };

    for (const tokenListedEvent of tokenDelistedEvents) {
        addRelevantAddress(tokenListedEvent.args._seller);
    }
    for (const tokenPurchasedEvent of tokenPurchasedEvents) {
        addRelevantAddress(tokenPurchasedEvent.args._buyer);
        addRelevantAddress(tokenPurchasedEvent.args._seller);
    }

    const transferEvents = await getTransferEvents(
        id,
        nftContract,
        relevantAddresses,
        firstNftBlock
    );

    const allEvents = [
        ...tokenListedEvents,
        ...tokenDelistedEvents,
        ...tokenPurchasedEvents,
        ...transferEvents,
    ];

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

    return allEvents;
};

const getAllEvents = async (
    nftContract,
    marketplaceContract,
    firstNftBlock,
    firstMarketplaceBlock
) => {
    return await getEvents(
        null,
        nftContract,
        marketplaceContract,
        null,
        firstNftBlock,
        firstMarketplaceBlock
    );
};

const computeBalances = (events) => {
    if (!events) {
        return;
    }

    const balances = {};

    const updateBalance = (address, variation) => {
        if (address == ethers.constants.AddressZero) {
            return;
        }

        if (balances[address] == undefined) {
            balances[address] = 0;
        }

        balances[address] += variation;
    };

    for (const event of events) {
        if (event.event == "TransferSingle") {
            const { from, to, value } = event.args;
            updateBalance(from, -value.toNumber());
            updateBalance(to, value.toNumber());
        }
    }

    // Filter out addresses with zero balance
    return Object.fromEntries(
        Object.keys(balances)
            .filter((address) => balances[address] != 0)
            .map((address) => [address, balances[address]])
    );
};

const parseHistory = (events) => {
    console.log("Parsing history for events:", events);
    if (!events) {
        return;
    }
    let parsedEvents = [];

    console.log(events);

    const paymentTokens = {};

    for (const event of events) {
        if (event.event == "TokenListed") {
            paymentTokens[event.args._listingId] =
                tokenAddressToId[event.args._paymentToken];
        }
    }

    console.log("Payment tokens:", paymentTokens);

    for (const event of events) {
        switch (event.event) {
            case "TokenListed":
                console.log(
                    "Parsing TokenListed event with payment token:",
                    event.args._paymentToken
                );
                parsedEvents.push({
                    id: parseInt(event.args._tokenId),
                    type: "list",
                    seller: event.args._seller,
                    paymentToken: tokenAddressToId[event.args._paymentToken],
                    price: formatTokenAmount(
                        event.args._price.toString(),
                        tokenAddressToId[event.args._paymentToken]
                    ),
                    amount: event.args.amount.toNumber(), // Note the lack of _
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                });
                break;
            case "TokenDelisted":
                parsedEvents.push({
                    id: parseInt(event.args._tokenId),
                    type: "delist",
                    seller: event.args._seller,
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                });
                break;
            case "TransferSingle":
                let transferType = "transfer";
                if (event.args.from == ethers.constants.AddressZero) {
                    transferType = "mint";
                } else if (event.args.to == ethers.constants.AddressZero) {
                    transferType = "burn";
                }
                parsedEvents.push({
                    id: parseInt(event.args.id),
                    type: transferType,
                    from: event.args.from,
                    to: event.args.to,
                    amount: event.args.value.toNumber(),
                    operator: event.args.operator,
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                });

                break;
            case "TokenPurchased":
                parsedEvents.push({
                    id: parseInt(event.args._tokenId),
                    type: "purchase",
                    buyer: event.args._buyer,
                    seller: event.args._seller,
                    amount: event.args._amount.toNumber(),
                    paymentToken: paymentTokens[event.args._tokenId],
                    price: formatTokenAmount(
                        event.args._price.toString(),
                        paymentTokens[event.args._listingId]
                    ).toString(),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                });

                break;
            default:
                console.log("Unknown event type: " + event.event);
        }
    }

    for (const event of parsedEvents.filter(
        (event) => event.type == "purchase"
    )) {
        // Filter out transfer and delist events that are part of the same purchase
        parsedEvents = parsedEvents.filter(
            (otherEvent) =>
                !(
                    (otherEvent.type == "transfer" ||
                        otherEvent.type == "delist") &&
                    event.transactionHash == otherEvent.transactionHash
                )
        );
    }

    console.log(parsedEvents.map((e) => e.type));

    return parsedEvents;
};

const getBlockTime = async (provider, blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    return new Date(parseInt(block.timestamp) * 1000);
};

const getNftAuthor = async (contract, id) => {
    const transferFromFilter = contract.filters.TransferSingle(
        null,
        ethers.constants.AddressZero,
        null
    );
    const events = await contract.queryFilter(transferFromFilter);
    const filteredEvents = events.filter((event) => event.args.id == id);
    if (filteredEvents.length == 1) {
        console.log("Found author:", filteredEvents[0].args.operator);
        return filteredEvents[0].args.operator;
    } else {
        throw new Error("Could not find author of NFT");
    }
};

export {
    blockToDateState,
    getBlockTime,
    getNftAuthor,
    getEvents,
    getAllEvents,
    computeBalances,
    parseHistory,
};
