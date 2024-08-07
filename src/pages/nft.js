import React from "react";
import { useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import {
    defaultReadProvider,
    useReadProvider,
    useWalletProvider,
} from "../common/provider";
import config from "../config";
import { ethers } from "ethers";
import { v1 } from "../common/abi";
import rehypeSanitize from "rehype-sanitize";
import schemas from "../common/schemas";
import * as queryString from "query-string";

import MDEditor from "@uiw/react-md-editor";
import HTMLViewer from "../components/HTMLViewer";
import { navigate } from "gatsby-link";
import { Helmet } from "react-helmet";
import { Header } from "../components";

import "bulma/css/bulma.min.css";
import "../styles/globals.css";
import Listings from "../components/Listings";
import TransferButton from "../components/TransferButton";
import { useEns } from "../common/ens";
import TypeTag from "../components/TypeTag";
import BurnButton from "../components/BurnButton";
import EditRoyaltyButton from "../components/EditRoyaltyButton";
import Decimal from "decimal.js";
import {
    formatError,
    isTokenExistenceError,
    standardErrorState,
} from "../common/error";
import StandardErrorDisplay from "../components/StandardErrorDisplay";
import NFTOwners from "../components/NFTOwners";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
//import { getEventListeners } from 'ws';

import {
    getEvents,
    computeBalances,
    parseHistory,
    getNftAuthor,
} from "../common/history";
import {
    formatTokenAmount,
    parseTokenAmount,
    shortenAddress,
} from "../common/utils";
import NFTHistory from "../components/NFTHistory";

import Address from "../components/Address";
import {
    getTokenAllowances,
    tokenAddressToId,
    tokenAllowancesState,
} from "../common/user";

const burnedIdsState = atom({
    key: "burnedIds",
    default: [],
});

const styles = {
    arrowContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "1em",
        height: "2em",
    },
    arrow: {
        fontSize: "2em",
        marginRight: "0.75em",
    },
};

export default function NFTPage({ location }) {
    const [readProvider] = useReadProvider();
    const [walletProvider] = useWalletProvider();
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const parsedQuery = queryString.parse(location.search);
    const id = parsedQuery ? parseInt(parsedQuery.id) : null;

    const macroNftType = parsedQuery?.type || "zang";

    const nftAddress = config.contractAddresses.v1[macroNftType];
    const nftABI = v1[macroNftType];
    const nftContract = new ethers.Contract(nftAddress, nftABI, readProvider);

    const marketplaceContract = new ethers.Contract(
        marketplaceAddress,
        marketplaceABI,
        readProvider
    );

    const [updateTracker, setUpdateTracker] = useState([0, null]);

    const { lookupEns } = useEns();

    const [burnedIds, setBurnedIds] = useRecoilState(burnedIdsState);
    const [prevValidId, setPrevValidId] = useState(null);
    const [nextValidId, setNextValidId] = useState(null);

    // === NFT Info ===

    const [tokenData, setTokenData] = useState(null);
    const [tokenType, setTokenType] = useState(null);
    const [tokenContent, setTokenContent] = useState(null);
    const [tokenAuthor, setTokenAuthor] = useState(null);
    const [royaltyInfo, setRoyaltyInfo] = useState(null);
    const [totalSupply, setTotalSupply] = useState(null);
    const [lastNFTId, setLastNFTId] = useState(null);
    const [exists, setExists] = useState(true);
    const [listings, setListings] = useState(null);

    const [walletAddress, setWalletAddress] = useState(null);

    // Owners tab or History tab
    const [isOwners, setIsOwners] = useState(true);
    const setOwners = () => setIsOwners(true);
    const setHistory = () => setIsOwners(false);
    const [events, setEvents] = useState(null);

    const [tokenAllowances, setTokenAllowances] =
        useRecoilState(tokenAllowancesState);

    const [, setStandardError] = useRecoilState(standardErrorState);

    const queryBalances = async (author) => {
        if (!readProvider || !id || !author) {
            return;
        }
        const marketplaceContract = new ethers.Contract(
            marketplaceAddress,
            marketplaceABI,
            defaultReadProvider
        );
        const firstZangBlock = config.firstBlocks.v1.zang;
        const firstMarketplaceBlock = config.firstBlocks.v1.marketplace;

        const events = await getEvents(
            id,
            nftContract,
            marketplaceContract,
            author,
            firstZangBlock,
            firstMarketplaceBlock
        );
        console.log("Find events", events, id, author);
        setEvents(events);
    };

    const queryPrevValidId = async () => {
        if (!id) {
            return;
        }

        let prevId = id - 1;
        let isValid = false;
        while (prevId >= 1 && !isValid) {
            if (burnedIds.includes(prevId)) {
                prevId--;
            } else {
                try {
                    isValid = await nftContract.exists(prevId);
                } catch (e) {
                    console.log(e);
                    setStandardError(formatError(e));
                    break;
                }

                if (isValid) {
                    break;
                } else {
                    setBurnedIds((burnedIds) => [...burnedIds, prevId]);
                    prevId--;
                }
            }
        }

        if (isValid) {
            return prevId;
        } else {
            return null;
        }
    };

    const queryLastNFTId = async () => {
        try {
            const newLastNFTId = await nftContract.lastTokenId();
            setLastNFTId(newLastNFTId.toNumber());
            return newLastNFTId.toNumber();
        } catch (e) {
            console.log(e);
            setStandardError(formatError(e));
        }
    };

    const queryNextValidId = async () => {
        if (!id || !readProvider) return;

        let nextId = id + 1;
        let isValid = false;
        let actualLastNFTId = lastNFTId;

        if (actualLastNFTId === null) {
            actualLastNFTId = await queryLastNFTId();
        }

        while (nextId <= actualLastNFTId && !isValid) {
            if (nextId == actualLastNFTId) {
                console.log("Querying...");
                await queryLastNFTId();
            }
            if (burnedIds.includes(nextId)) {
                nextId++;
            } else {
                try {
                    isValid = await nftContract.exists(nextId);
                } catch (e) {
                    console.log(e);
                    setStandardError(formatError(e));
                    break;
                }

                if (isValid) {
                    break;
                } else {
                    setBurnedIds((burnedIds) => [...burnedIds, nextId]);
                    nextId++;
                }
            }
        }

        if (isValid) {
            return nextId;
        } else {
            return null;
        }
    };

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;

        try {
            const tURI = await nftContract.uri(id);
            return tURI;
        } catch (e) {
            if (isTokenExistenceError(e)) {
                setExists(false);
            } else {
                console.log(e);
                setStandardError(formatError(e));
            }
        }
    };

    const queryTokenAuthor = async () => {
        if (!id || !readProvider) return;

        try {
            const author = await getNftAuthor(nftContract, id);
            setTokenAuthor(author);
            return author;
        } catch (e) {
            if (!isTokenExistenceError(e)) {
                console.log(e);
                setStandardError(formatError(e));
            }
            setTokenAuthor(null);
            return null;
        }
    };

    const queryTokenData = async (tURI) => {
        if (!tURI) return;

        try {
            const tokenDataResponse = await fetch(tURI);
            const newTokenData = await tokenDataResponse.json();
            setTokenData(newTokenData);

            return newTokenData;
        } catch (e) {
            console.log(e);
            setStandardError(formatError(e));
        }
    };

    const queryTokenContent = async (newTokenData) => {
        if (!newTokenData?.text_uri) return;
        var parsedTextURI = newTokenData.text_uri;
        parsedTextURI = parsedTextURI.replace("charset=UTF-8,", "");
        try {
            const response = await fetch(parsedTextURI);
            const parsedText = await response.text();
            console.log("Token type:", response.headers.get("content-type"));
            setTokenType(response.headers.get("content-type"));
            setTokenContent(parsedText);
        } catch (e) {
            console.log(e);
            setStandardError(formatError(e));
        }
    };

    const queryRoyaltyInfo = async () => {
        if (!id || !readProvider) return;

        try {
            let [recipient, amount] = await nftContract.royaltyInfo(id, 10000);
            console.log("Royalty info:", recipient, amount);
            amount = new Decimal(amount.toString());
            setRoyaltyInfo({
                recipient,
                amount: amount.div(100).toNumber(),
            });
        } catch (e) {
            console.log(e);
            setStandardError(formatError(e));
        }
    };

    const queryTotalSupply = async () => {
        if (!id || !readProvider) return;

        try {
            const events = await getEvents(
                id,
                nftContract,
                marketplaceContract,
                null,
                config.firstBlocks.v1.zang,
                config.firstBlocks.v1.marketplace
            );

            // Find transfers from the 0 address to get the total supply
            const matchingEvents = events.filter(
                (event) => event.args.from == ethers.constants.AddressZero
            );

            if (matchingEvents.length == 1) {
                console.log("Found total supply:", matchingEvents[0].args.to);
                setTotalSupply(matchingEvents[0].args.value);
            } else {
                console.log("No total supply found");
                setTotalSupply(null);
            }

            //setTotalSupply(await contract.totalSupply(id));
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    const changeId = (right) => () => {
        if (right) {
            navigate("/nft?id=" + nextValidId);
        } else {
            navigate("/nft?id=" + prevValidId);
        }
    };

    useEffect(() => {
        if (!id) {
            navigate("/");
        }
    }, [id]);

    useEffect(async () => {
        if (walletProvider) {
            try {
                setWalletAddress(await walletProvider.getSigner().getAddress());
            } catch (e) {
                setStandardError(formatError(e));
            }
        }
    }, [walletProvider]);

    useEffect(() => {
        setStandardError(null);
    }, [id]);

    useEffect(async () => {
        setExists(true);
        setTokenData(null);
        setTokenContent(null);
        setTokenType(null);
        setTokenAuthor(null);
        setRoyaltyInfo(null);
        setTotalSupply(null);
        setPrevValidId(null);
        setNextValidId(null);
        setListings(null);
        setListingSellerBalances({});
        setEvents(null);

        queryTokenURI()
            .then((tURI) => queryTokenData(tURI))
            .then((newTokenData) => queryTokenContent(newTokenData));
        queryTokenAuthor().then((author) => queryBalances(author));
        queryRoyaltyInfo();
        queryTotalSupply();

        const [prevId, nextId] = await Promise.all([
            queryPrevValidId(),
            queryNextValidId(),
        ]);
        setPrevValidId(prevId);
        setNextValidId(nextId);
    }, [id, readProvider]);

    /*useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryRoyaltyInfo(), [id, readProvider])
    useEffect(() => queryTotalSupply(), [id, readProvider])
    useEffect(() => setExists(true), [id, readProvider])*/
    useEffect(queryLastNFTId, []);

    // === Listing info ===

    const [listingSellerBalances, setListingSellerBalances] = useState({});

    const activeListings = () => {
        return listings
            ? listings.filter((listing) => parseInt(listing.seller, 16) != 0)
            : null;
    };

    const listingGroups = () => {
        if (!activeListings()) {
            return null;
        }
        const groups = {};

        for (const listing of activeListings()) {
            const seller = listing.seller;
            if (!groups[seller]) {
                groups[seller] = [];
            }
            groups[seller].push(listing);
        }

        const newGroups = [];

        for (const [seller, _listings] of Object.entries(groups)) {
            _listings.sort((a, b) => a.price - b.price);

            newGroups.push({
                seller,
                listings: _listings,
                sellerBalance: listingSellerBalances[seller], // undefined means that it's not available yet
            });
        }

        // Sort by price
        for (const group of newGroups) {
            group.listings.sort((a, b) => a.price - b.price);
        }
        newGroups.sort((a, b) => a.listings[0].price - b.listings[0].price);

        return newGroups;
    };

    const addressBalance = (address) => {
        return listingSellerBalances[address];
    };

    const userBalance = () => {
        return addressBalance(walletAddress);
    };

    const addressAvailableAmount = (address) => {
        if (!id || !walletAddress || activeListings() === null) return null;

        let _availableAmount = addressBalance(address);

        if (_availableAmount === null || _availableAmount === undefined) {
            return null;
        }

        for (const listing of activeListings()) {
            if (listing.seller == address) {
                _availableAmount -= listing.amount;
            }
        }

        if (_availableAmount < 0) {
            _availableAmount = 0;
        }

        return _availableAmount;
    };

    const userAvailableAmount = () => {
        return addressAvailableAmount(walletAddress);
    };

    const queryListings = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(
            marketplaceAddress,
            marketplaceABI,
            readProvider
        );

        try {
            console.log("Querying listing count for", nftContract.address, id);
            const listingCount = (
                await contract.listingCount(nftContract.address, id)
            ).toNumber();
            console.log("Listing count:", listingCount);

            const newListings = [];
            const promises = [];

            for (let i = 0; i < listingCount; i++) {
                promises.push(
                    contract
                        .listings(nftContract.address, id, i)
                        .then((listing) =>
                            newListings.push({
                                amount: listing.amount.toNumber(),
                                price: formatTokenAmount(
                                    listing.price,
                                    tokenAddressToId[listing.paymentToken]
                                ),
                                paymentToken: listing.paymentToken,
                                seller: listing.seller,
                                id: i,
                            })
                        )
                        .catch((e) => console.log(e))
                );
            }

            await Promise.all(promises);

            newListings.sort((a, b) => a.price - b.price);

            // If a listing has seller 0x0000... it has been delisted
            setListings(newListings);
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    const updateSellerBalance = async (sellerAddress) => {
        if (!sellerAddress || !readProvider || !id) return;

        try {
            const balance = await nftContract.balanceOf(sellerAddress, id);
            setListingSellerBalances((currentBalance) => ({
                ...currentBalance,
                [sellerAddress]: balance.toNumber(),
            }));
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    const queryUserBalance = async () => {
        await updateSellerBalance(walletAddress);
    };

    const queryListingSellerBalances = async () => {
        if (!id || !listings) return;

        const promises = [];

        try {
            console.log("Querying seller balances...");
            if (activeListings()) {
                console.log("Active listings:", activeListings());
                for (const listing of activeListings()) {
                    const promise = updateSellerBalance(listing.seller);
                    promises.push(promise);
                }
            }

            await Promise.all(promises);
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    useEffect(() => {
        const updateId = updateTracker[0];
        //if (updateId === id) {
        queryListings();
        queryTotalSupply();
        queryRoyaltyInfo();
        //}
    }, [updateTracker, id, walletProvider]);

    useEffect(() => {
        queryUserBalance();
    }, [updateTracker, walletAddress, id]);

    useEffect(() => {
        queryListingSellerBalances();
    }, [listings]);

    async function queryTokenAllowances() {
        if (!walletAddress || !readProvider) return;
        getTokenAllowances(walletAddress, readProvider).then((allowances) =>
            setTokenAllowances(allowances)
        );
    }

    useEffect(() => {
        queryTokenAllowances();
    }, [id, walletAddress, updateTracker]);

    const onUpdate = (updatedNFTId) => {
        setUpdateTracker(([_, counter]) => [updatedNFTId, counter + 1]);
    };

    return (
        <div>
            <Helmet>
                <title>
                    {id !== undefined && id !== null ? `#${id} - zang` : "zang"}
                </title>
            </Helmet>
            <Header />
            <div style={styles.arrowContainer}>
                {prevValidId ? (
                    <a
                        style={styles.arrow}
                        className="icon"
                        role="button"
                        onClick={changeId(false)}
                    >
                        {"\u25c0"}
                    </a>
                ) : (
                    <></>
                )}
                {nextValidId ? (
                    <a
                        style={styles.arrow}
                        className="icon"
                        role="button"
                        onClick={changeId(true)}
                    >
                        {"\u25b6"}
                    </a>
                ) : (
                    <></>
                )}
            </div>

            <StandardErrorDisplay />
            {exists ? (
                <div>
                    <div className="columns m-4">
                        <div
                            className="column is-two-thirds"
                            style={{ overflow: "hidden" }}
                        >
                            {readProvider ? (
                                <div>
                                    <div className="box">
                                        {tokenType &&
                                        (tokenContent || tokenContent == "") ? (
                                            tokenType == "text/html" ? (
                                                <HTMLViewer
                                                    source={tokenContent}
                                                />
                                            ) : tokenType == "text/markdown" ? (
                                                <MDEditor.Markdown
                                                    source={tokenContent}
                                                    rehypePlugins={[
                                                        () =>
                                                            rehypeSanitize(
                                                                schemas.validMarkdown
                                                            ),
                                                    ]}
                                                />
                                            ) : (
                                                <pre className="nft-plain">
                                                    {tokenContent}
                                                </pre>
                                            )
                                        ) : (
                                            <Skeleton count="12" />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p>Connect a wallet to view this NFT</p>
                            )}
                        </div>
                        <div className="column">
                            <h1 className="title">
                                {tokenData?.name !== null &&
                                tokenData?.name !== undefined ? (
                                    tokenData.name
                                ) : (
                                    <Skeleton />
                                )}
                            </h1>
                            <p className="subtitle mb-1">
                                {tokenAuthor !== null ? (
                                    <>
                                        by{" "}
                                        <Address
                                            address={tokenAuthor}
                                            shorten
                                            nChar={8}
                                        />
                                    </>
                                ) : (
                                    <Skeleton />
                                )}
                            </p>
                            <div className="has-text-left m-0">
                                {tokenType && totalSupply !== null ? (
                                    <span>
                                        <TypeTag type={tokenType} />
                                        <span className="tag is-black ml-1">
                                            Edition size:{" "}
                                            {totalSupply.toString()}
                                        </span>
                                    </span>
                                ) : (
                                    <Skeleton
                                        className="mr-1"
                                        inline
                                        count={2}
                                        width={90}
                                    />
                                )}
                            </div>
                            <p className="is-italic">
                                {tokenData?.description !== undefined &&
                                tokenData?.description !== null ? (
                                    tokenData.description
                                ) : (
                                    <Skeleton />
                                )}
                            </p>

                            {royaltyInfo &&
                            tokenAuthor &&
                            royaltyInfo?.amount !== null ? (
                                <p className="is-size-6 mt-5">
                                    {royaltyInfo.amount.toFixed(2)}% of every
                                    secondary sale goes to{" "}
                                    {royaltyInfo.recipient == tokenAuthor
                                        ? "the author"
                                        : royaltyInfo.recipient}
                                    .
                                </p>
                            ) : (
                                <Skeleton />
                            )}
                            <hr />
                            <Listings
                                nftContract={nftContract}
                                readProvider={readProvider}
                                walletProvider={walletProvider}
                                id={id}
                                walletAddress={walletAddress}
                                onUpdate={onUpdate}
                                userBalance={userBalance()}
                                userAvailableAmount={userAvailableAmount()}
                                listingGroups={listingGroups()}
                            />

                            <hr />
                            {readProvider && walletProvider ? (
                                <div>
                                    {userBalance() !== null ? (
                                        userBalance() != 0 ? (
                                            <div>
                                                <p>Owned: {userBalance()}</p>
                                                {userAvailableAmount() ===
                                                null ? (
                                                    <Skeleton />
                                                ) : (
                                                    <p>
                                                        Not listed:{" "}
                                                        {userAvailableAmount()}
                                                    </p>
                                                )}
                                                <div className="is-flex is-justify-content-center">
                                                    <TransferButton
                                                        id={id}
                                                        walletAddress={
                                                            walletAddress
                                                        }
                                                        balance={userBalance()}
                                                        availableAmount={userAvailableAmount()}
                                                        onUpdate={onUpdate}
                                                    />
                                                    <BurnButton
                                                        nftContract={
                                                            nftContract
                                                        }
                                                        id={id}
                                                        walletAddress={
                                                            walletAddress
                                                        }
                                                        balance={userBalance()}
                                                        availableAmount={userAvailableAmount()}
                                                        onUpdate={onUpdate}
                                                    />
                                                </div>
                                                <div className="is-flex is-justify-content-center mt-1">
                                                    {tokenAuthor ==
                                                    walletAddress ? (
                                                        <EditRoyaltyButton
                                                            nftContract={
                                                                nftContract
                                                            }
                                                            id={id}
                                                            walletAddress={
                                                                walletAddress
                                                            }
                                                            currentRoyaltyPercentage={
                                                                royaltyInfo?.amount
                                                            }
                                                            onUpdate={onUpdate}
                                                        />
                                                    ) : (
                                                        <></>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <></>
                                        )
                                    ) : (
                                        <Skeleton height={3} />
                                    )}
                                </div>
                            ) : (
                                <></>
                            )}
                            {readProvider ? (
                                <>
                                    <div class="tabs is-centered is-fullwidth">
                                        <ul>
                                            <li
                                                className={
                                                    isOwners
                                                        ? "is-active has-text-weight-semibold"
                                                        : ""
                                                }
                                                onClick={setOwners}
                                            >
                                                <a>Owners</a>
                                            </li>
                                            <li
                                                className={
                                                    isOwners
                                                        ? ""
                                                        : "is-active has-text-weight-semibold"
                                                }
                                                onClick={setHistory}
                                            >
                                                <a>History</a>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        {isOwners ? (
                                            <NFTOwners
                                                balances={computeBalances(
                                                    events
                                                )}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    maxHeight: "25em",
                                                    overflowY: "auto",
                                                }}
                                            >
                                                <NFTHistory
                                                    history={parseHistory(
                                                        events
                                                    )}
                                                    hideId
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <p>This NFT doesn't exist.</p>
            )}
        </div>
    );
}
