import React from 'react';
import { useEffect, useState } from 'react';
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

const styles = {
    arrowContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '1em'
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

    const { id } = queryString.parse(location.search);
    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()
    const { getEns } = useEns()

    // === NFT Info ===

    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [lastNFTId, setLastNFTId] = useState(null)

    const [contractError, setContractError] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);

    const queryTokenURI = async () => {
        if (!id || !readProvider) return;
        
        try {
            const contract = new ethers.Contract(zangAddress, zangABI, readProvider);
            const tURI = await contract.uri(id);
      
            setTokenURI(tURI);
        }
        catch (e) {
            setContractError(e);
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
            setContractError(e);
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
        if (!tokenData?.textURI) return;
        var parsedTextURI = tokenData.textURI.replaceAll("#", "%23") //TODO: workaround, togliere con nuovo deploy
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
            const [recipient, amount] = await contract.royaltyInfo(id, 10000);
            setRoyaltyInfo({
                recipient,
                amount: amount.div(100).toNumber()
            })
        } catch (e) {
            setContractError(e);
        }
    }

    const changeId = (right) => () => {
        if (right) {
            navigate('/nft?id=' + (parseInt(id) + 1));
        }
        else {
            navigate('/nft?id=' + (parseInt(id) - 1));
        }
    }

    useEffect(() => {
        if (!id) {
            navigate('/');
        }
    }, [id])

    useEffect(async () => {
        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            const newLastNFTId = (await contract.lastTokenId());
            setLastNFTId(newLastNFTId.toNumber());
        } catch (e) {
            setContractError(e);
        }

    }, [])

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

    useEffect(() => queryTokenURI(), [id, readProvider])
    useEffect(() => queryTokenData(), [tokenURI])
    useEffect(() => queryTokenContent(), [tokenData])

    useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryRoyaltyInfo(), [id, readProvider])

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
    }

    useEffect(queryListings, [id, walletAddress])
    useEffect(queryUserBalance, [id, walletAddress])
    useEffect(queryListingSellerBalances, [id, readProvider, listings])

    return (
        <div>
            <Helmet>
                <meta charSet="utf-8" />
                <title>zang</title>
                <meta name="icon" href="/public/favicon.ico" />
            </Helmet>
            <Header />
            <div style={styles.arrowContainer}>
                { id == 1 ? <></> : <a style={styles.arrow} className="icon" role="button" onClick={changeId(false)}>{'\u25c0'}</a>}
                { lastNFTId && id == lastNFTId ? <></> : <a style={styles.arrow} className="icon" role="button" onClick={changeId(true)}>{'\u25b6'}</a> }
            </div>
            <div className="columns m-4">
                <div className="column" style={{overflow: 'hidden'}}>
                    { readProvider ? (
                        contractError ? <p>Could not retrieve contract info : {contractError.message}.</p> : (
                            <div>
                                <div className="box">
                                    {tokenType && tokenContent ? (
                                        tokenType == 'text/markdown' ? (
                                            <MDEditor.Markdown source={tokenContent} rehypePlugins={[rehypeSanitize]} />
                                        ) : <pre className="nft-plain">{tokenContent}</pre>
                                    ) : <></>}
                                </div>
                            </div>
                        )
                    )
                    : <p>Connect a wallet to view this NFT</p>
                    }
                </div>
                { 
                    <div className="column">
                        <h1 className="title">{tokenData?.name || ''}</h1>
                        <p className="subtitle">{tokenAuthor ? `by ${getEns(tokenAuthor) || tokenAuthor}` : ''}</p>
                        <p className="is-italic">{tokenData?.description || ''}</p>
                        {royaltyInfo && tokenAuthor && royaltyInfo?.amount !== 0 ? 
                        <p>{royaltyInfo.amount.toFixed(2)}% of every sale goes to {royaltyInfo.recipient == tokenAuthor ? 'the author' : royaltyInfo.recipient}.</p>
                        : <></>
                        }
                    </div>
                }
                
            </div>

            <div className="columns ml-2">
                <div className="column">
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
                        readProvider && walletProvider && userBalance() ? (
                            <div>
                                <p>Owned: {userBalance()}</p>
                                { userBalance() != userAvailableAmount() ? <p>Available (not listed): {userAvailableAmount()}</p> : <></> }
                                <TransferButton id={id} walletAddress={walletAddress} balance={userBalance()} availableAmount={userAvailableAmount()} onError={setContractError} onUpdate={onUpdate} />
                            </div>
                        ) : <></>
                    }
                </div>
            </div>
        </div>
    )
}