import React from 'react';
import { useEffect, useState } from 'react';
import { atom, useRecoilState } from 'recoil'
import { useReadProvider, useWalletProvider } from '../common/provider';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import rehypeSanitize from "rehype-sanitize";
import * as queryString from "query-string";

import MDEditor from "@uiw/react-md-editor"
import { navigate } from 'gatsby-link';
import { Helmet } from 'react-helmet';
import { Header } from '../components';

import { formatEther, parseUnits } from '@ethersproject/units';

import "bulma/css/bulma.min.css";
import '../styles/globals.css'
import Listings from '../components/Listings';
import TransferButton from '../components/TransferButton';
import { useEns } from '../common/ens';
import TypeTag from '../components/TypeTag';
import BurnButton from '../components/BurnButton';
import EditRoyaltyButton from '../components/EditRoyaltyButton';
import Decimal from 'decimal.js';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const burnedIdsState = atom({
    key: 'burnedIds',
    default: []
});

const styles = {
    arrowContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '1em',
        height: '2em'
    },
    arrow: {
        fontSize: '2em',
        marginRight: '0.75em'
    }
}

export default function NFTPage( { location }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const parsedQuery = queryString.parse(location.search);
    const id = parsedQuery ? parseInt(parsedQuery.id) : null;

    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()
    const { lookupEns } = useEns()

    const [burnedIds, setBurnedIds] = useRecoilState(burnedIdsState);
    const [prevValidId, setPrevValidId] = useState(null);
    const [nextValidId, setNextValidId] = useState(null);

    // === NFT Info ===

    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [totalSupply, setTotalSupply] = useState(null)
    const [lastNFTId, setLastNFTId] = useState(null)
    const [exists, setExists] = useState(true)

    const [contractError, setContractError] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);

    const queryPrevValidId = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        let prevId = id - 1;
        let isValid = false;
        while(prevId >= 1 && !isValid) {
            if (burnedIds.includes(prevId)) {
                prevId--;
            } else {
                try {
                    isValid = await contract.exists(prevId);
                } catch (e) {
                    setContractError(e);
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
    }

    const queryLastNFTId = async () => {
        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            const newLastNFTId = (await contract.lastTokenId());
            setLastNFTId(newLastNFTId.toNumber());
            newLastNFTId.toNumber();
        } catch (e) {
            setContractError(e);
        }
    }

    const queryNextValidId = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        let nextId = id + 1;
        let isValid = false;

        while(nextId <= lastNFTId && !isValid) {
            if (nextId == lastNFTId) {
                await queryLastNFTId();
            }
            if (burnedIds.includes(nextId)) {
                nextId++;
            } else {
                try {
                    isValid = await contract.exists(nextId);
                } catch (e) {
                    setContractError(e);
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
    }

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;
        
        try {
            const contract = new ethers.Contract(zangAddress, zangABI, readProvider);
            const tURI = await contract.uri(id);

            console.log('URI:', tURI);
      
            setTokenURI(tURI);
        }
        catch (e) {
            if (e.errorArgs && e.errorArgs[0] === 'ZangNFT: uri query for nonexistent token') {
                setExists(false);
            } else {
                setContractError(e);
            }
        }
    }

    const queryTokenAuthor = async () => {
        if (!id || !readProvider) return;

        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);
        try {
            const author = await contract.authorOf(id);
            setTokenAuthor(author);
        }
        catch (e) {
            if (!e.errorArgs || e.errorArgs[0] !== 'ZangNFT: author query for nonexistent token') {
                setContractError(e);
            }
        }
    }

    const queryTokenData = async () => {
        if (!tokenURI) return;

        try {
            const tokenDataResponse = await fetch(tokenURI);
            const newTokenData = await tokenDataResponse.json();
            setTokenData(newTokenData);
        }
        catch (e) {
            setContractError(e);
        }
    }

    const queryTokenContent = async () => {
        if (!tokenData?.text_uri) return;
        var parsedTextURI = tokenData.text_uri
        parsedTextURI = parsedTextURI.replace("text/markdown;charset=UTF-8", "text/markdown");
        try {
            const response = await fetch(parsedTextURI);
            const parsedText = await response.text()
            console.log("content: "+parsedTextURI)
            setTokenType(response.headers.get("content-type"))
            setTokenContent(parsedText)
        } catch (e) {
            setContractError(e);
        }
    }

    const queryRoyaltyInfo = async () => {
        if (!id || !readProvider) return;
        
        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            let [recipient, amount] = await contract.royaltyInfo(id, 10000);
            amount = new Decimal(amount.toString());
            setRoyaltyInfo({
                recipient,
                amount: amount.div(100).toNumber()
            })
        } catch (e) {
            setContractError(e);
        }
    }

    const queryTotalSupply = async () => {
        if (!id || !readProvider) return;
        
        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            setTotalSupply(await contract.totalSupply(id));
        } catch (e) {
            setContractError(e);
        }
    }

    const changeId = (right) => () => {
        if (right) {
            navigate('/nft?id=' + nextValidId);
        }
        else {
            navigate('/nft?id=' + prevValidId);
        }
    }

    useEffect(() => {
        if (!id) {
            navigate('/');
        }
    }, [id])

    useEffect(async () => {
        if (walletProvider) {
            try {
                setWalletAddress(await walletProvider.getSigner().getAddress());
            } catch (e) {
                setContractError(e);
            }
        }
    }, [walletProvider])

    useEffect(() => {
        setContractError(null);
    }, [id])

    useEffect(async () => {
        setExists(true);
        setTokenURI(null);
        setTokenData(null);
        setTokenContent(null);
        setTokenType(null);
        setTokenAuthor(null);
        setRoyaltyInfo(null);
        setTotalSupply(null);
        setPrevValidId(null);
        setNextValidId(null);

        queryTokenURI();
        queryTokenAuthor();
        queryRoyaltyInfo();
        queryTotalSupply();

        const [prevId, nextId] = await Promise.all([queryPrevValidId(), queryNextValidId()]);
        setPrevValidId(prevId);
        setNextValidId(nextId);
    }, [id, readProvider])
    useEffect(() => queryTokenData(), [tokenURI])
    useEffect(() => queryTokenContent(), [tokenData])

    useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryRoyaltyInfo(), [id, readProvider])
    useEffect(() => queryTotalSupply(), [id, readProvider])
    useEffect(() => setExists(true), [id, readProvider])
    useEffect(queryLastNFTId, [])

    // === Listing info ===

    const [listings, setListings] = useState([])
    const [listingSellerBalances, setListingSellerBalances] = useState({});

    const activeListings = () => {
        return listings.filter(listing => parseInt(listing.seller, 16) != 0)
    }

    const listingGroups = () => {
        const groups = {};

        for (const listing of activeListings()) {
            const seller = listing.seller;
            if (!groups[seller]) {
                groups[seller] = [];
            }
            groups[seller].push(listing);
        }

        const newGroups = []

        for (const [seller, _listings] of Object.entries(groups)) {
            _listings.sort((a, b) => a.price - b.price)

            newGroups.push({
                seller,
                listings: _listings,
                sellerBalance: listingSellerBalances[seller] // undefined means that it's not available yet
            })
        }

        return newGroups;
    }

    const addressBalance = (address) => {
        return listingSellerBalances[address] || 0; 
    }

    const userBalance = () => {
        return addressBalance(walletAddress);
    }

    const addressAvailableAmount = (address) => {
        if (!id || !walletAddress) return 0;

        let _availableAmount = addressBalance(address);

        for (const listing of activeListings()) {
            if (listing.seller == address) {
                _availableAmount -= listing.amount;
            }
        }

        if (_availableAmount < 0) {
            _availableAmount = 0;
        }

        return _availableAmount;
    }

    const userAvailableAmount = () => {
        return addressAvailableAmount(walletAddress);
    }

    const queryListings = async () => {
        if (!id || !readProvider) return;
        
        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, readProvider);

        try {
            const listingCount = (await contract.listingCount(id)).toNumber();

            const newListings = [];
            const promises = [];

            for (let i = 0; i < listingCount; i++) {
                promises.push(
                    contract.listings(id, i)
                        .then((listing) => newListings.push({
                            amount: listing.amount.toNumber(),
                            price: formatEther(parseUnits(listing.price.toString(), 'wei')),
                            seller: listing.seller,
                            id: i
                        }))
                        .catch((e) => console.log(e))
                )
            }

            await Promise.all(promises);

            // If a listing has seller 0x0000... it has been delisted
            setListings(newListings);
        } catch (e) {
            setContractError(e);
        }
    }

    const updateSellerBalance = async (sellerAddress) => {
        if (!sellerAddress || !readProvider || !id) return;

        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            const balance = await contract.balanceOf(sellerAddress, id)
            setListingSellerBalances((currentBalance) => ({...currentBalance, [sellerAddress]: balance.toNumber()}));
        }
        catch (e) {
            setContractError(e);
        }
    }

    const queryUserBalance = async () => {
        await updateSellerBalance(walletAddress);
    }

    const queryListingSellerBalances = async () => {
        if (!id || !listings) return;

        console.log('Listings: ', activeListings())

        const promises = [];

        try {
            for (const listing of activeListings()) {
                const promise = updateSellerBalance(listing.seller);
                promises.push(promise);
            }
            
            await Promise.all(promises);
        } catch (e) {
            setContractError(e);
        }
    }

    const onUpdate = () => {
        queryListingSellerBalances();
        queryListings();
        queryUserBalance();
        queryTotalSupply();
    }

    useEffect(queryListings, [id, walletAddress])
    useEffect(queryUserBalance, [id, walletAddress])
    useEffect(queryListingSellerBalances, [id, readProvider, listings])

    return (
        <div>
            <Helmet>
                <title>{id !== undefined && id !== null ? `#${id} - zang` : 'zang'}</title>
            </Helmet>
            <Header />
            <div style={styles.arrowContainer}>
                { prevValidId ? <a style={styles.arrow} className="icon" role="button" onClick={changeId(false)}>{'\u25c0'}</a> : <></>}
                { nextValidId ? <a style={styles.arrow} className="icon" role="button" onClick={changeId(true)}>{'\u25b6'}</a> : <></>}
            </div>
                {
                    contractError ?
                        (
                            <article class="message is-danger">
                                <div class="message-body">
                                    <strong>Error:</strong> {contractError?.message}.
                                </div>
                            </article>
                        ) : <></>
                }
                {
                    exists ?
                        totalSupply == 0 ? (
                            <p>This NFT has been successfully burned. <a href='/'>Go to Home Page</a>.</p>
                        ) : (
                            <div>
                                <div className="columns m-4">
                                    <div className="column is-two-thirds" style={{overflow: 'hidden'}}>
                                        { readProvider ? (
                                            (
                                                <div>
                                                    <div className="box">
                                                        {tokenType && (tokenContent || tokenContent == '') ? (
                                                            tokenType == 'text/markdown' ? (
                                                                <MDEditor.Markdown source={tokenContent} rehypePlugins={[rehypeSanitize]} />
                                                            ) : <pre className="nft-plain">{tokenContent}</pre>
                                                        ) : <Skeleton count="12"/>}
                                                    </div>
                                                </div>
                                            )
                                        )
                                        : <p>Connect a wallet to view this NFT</p>
                                        }
                                    </div>
                                    { 
                                        <div className="column">
                                            <h1 className="title">{tokenData?.name || <Skeleton/>}</h1>
                                            <p className="subtitle mb-1">{tokenAuthor ? `by ${lookupEns(tokenAuthor) || tokenAuthor}` : <Skeleton/>}</p>
                                            <div className="has-text-left m-0">
                                                {tokenType && totalSupply ? <span><TypeTag type={tokenType}/><span className="tag is-black ml-1">Edition size: {totalSupply.toString()}</span></span> : <Skeleton className="mr-1" inline count={2} width={90}/>}
                                            </div>
                                            <p className="is-italic">{tokenData?.description || <Skeleton/>}</p>

                                            {royaltyInfo && tokenAuthor && royaltyInfo?.amount !== 0 ? 
                                            <p className="is-size-6">{royaltyInfo.amount.toFixed(2)}% of every sale goes to {royaltyInfo.recipient == tokenAuthor ? 'the author' : royaltyInfo.recipient}.</p>
                                            : <Skeleton/>
                                            }
                                            <Listings
                                            readProvider={readProvider}
                                            walletProvider={walletProvider}
                                            id={id}
                                            walletAddress={walletAddress}
                                            onError={setContractError}
                                            onUpdate={onUpdate}
                                            userBalance={userBalance()}
                                            userAvailableAmount={userAvailableAmount()}
                                            listingGroups={listingGroups()}
                                            />
                                            {
                                                readProvider && walletProvider ? (
                                                    <div>
                                                        {
                                                            userBalance() ? (
                                                                <div>
                                                                    <p>Owned: {userBalance()}</p>
                                                                    { userBalance() != userAvailableAmount() ? <p>Available (not listed): {userAvailableAmount()}</p> : <></> }
                                                                    <TransferButton id={id} walletAddress={walletAddress} balance={userBalance()} availableAmount={userAvailableAmount()} onError={setContractError} onUpdate={onUpdate} />
                                                                    <BurnButton id={id} walletAddress={walletAddress} balance={userBalance()} availableAmount={userAvailableAmount()} onError={setContractError} onUpdate={onUpdate} />
                                                                </div>
                                                            ) : <></>
                                                        }
                                                        { 
                                                            tokenAuthor == walletAddress ? (
                                                                <EditRoyaltyButton id={id} walletAddress={walletAddress} currentRoyaltyPercentage={royaltyInfo?.amount} onError={setContractError} onUpdate={queryRoyaltyInfo} />
                                                            ) : <></>
                                                        }
                                                    </div>
                                                ) : <></>
                                            }
                                        </div>
                                    }
                                    
                                </div>

                                <div className="columns ml-2">
                                    <div className="column">
                                        
                                    </div>
                                </div>
                            </div>
                        ) : <p>This NFT doesn't exist.</p>
                }
        </div>
    )
}