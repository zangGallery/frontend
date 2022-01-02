import React from 'react';
import { useEffect, useState } from 'react';
import { mainnetProvider, useReadProvider, useWalletProvider } from '../common/provider';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import rehypeSanitize from "rehype-sanitize";
import * as queryString from "query-string";

import MDEditor from "@uiw/react-md-editor"
import { navigate } from 'gatsby-link';
import { Helmet } from 'react-helmet';
import { Header, ListModal } from '../components';

import "bulma/css/bulma.min.css";
import '../styles/globals.css'

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
    const { id } = queryString.parse(location.search);
    const [tokenURI, setTokenURI] = useState(null)
    const [tokenData, setTokenData] = useState(null)
    const [tokenType, setTokenType] = useState(null)
    const [tokenContent, setTokenContent] = useState(null)
    const [tokenAuthor, setTokenAuthor] = useState(null)
    const [royaltyInfo, setRoyaltyInfo] = useState(null)
    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()
    const [lastNFTId, setLastNFTId] = useState(null)

    const [listings, setListings] = useState([])

    const [contractError, setContractError] = useState(null);
    const [listingError, setListingError] = useState(null);

    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletAddress, setWalletAddress] = useState(null);

    const [listModalOpen, setListModalOpen] = useState(false)

    const [isApproved, setIsApproved] = useState(false);

    useEffect(async () => {
        if (walletProvider) {
            setWalletAddress(await walletProvider.getSigner().getAddress())
        }
    }, [walletProvider])

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

            const ensAddress = await mainnetProvider.lookupAddress(author);

            if (ensAddress) {
                setTokenAuthor(ensAddress);
            } else {
                setTokenAuthor(author);
            }
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
        const response = await fetch(parsedTextURI);
        const parsedText = await response.text()
        console.log("content: "+parsedTextURI)
        setTokenType(response.headers.get("content-type"))
        setTokenContent(parsedText)
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

    const queryListings = async () => {
        if (!id || !readProvider) return;
        
        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, readProvider);

        const listingCount = (await contract.listingCount(id)).toNumber();

        const newListings = [];
        const promises = [];

        for (let i = 0; i < listingCount; i++) {
            promises.push(
                contract.listings(id, i)
                    .then((listing) => newListings.push({
                        amount: listing.amount.toNumber(),
                        price: listing.price.toNumber(),
                        seller: listing.seller,
                        id: i
                    }))
                    .catch((e) => console.log(e))
            )
        }

        await Promise.all(promises);

        // If a listing has seller 0x0000... it has been delisted
        setListings(newListings);
    }

    const activeListings = () => {
        return listings.filter(listing => parseInt(listing.seller, 16) != 0)
    }

    const changeId = (right) => () => {
        if (right) {
            navigate('/nft?id=' + (parseInt(id) + 1));
        }
        else {
            navigate('/nft?id=' + (parseInt(id) - 1));
        }
    }

    const buy = async (listingId, amount, price) => {
        if (!id || !readProvider) return;
        setListingError(null);

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, readProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        try {
            // TODO: Convert into the correct amount
            await contractWithSigner.buyToken(id, listingId, amount, { value: amount * price });

            navigate('/vault')
        }
        catch (e) {
            setListingError(e);
        }
    }

    const list = async (amount, price) => {
        console.log('Amount: ' + amount + ' Price: ' + price)
        console.log('ID: ' + id, 'Wallet: ' + walletAddress)
        if (amount === null || price === null) {
            return;
        }

        if (!id || !walletProvider) return;
        // setListingError(null);

        console.log('Preparing contract')

        const zangContract = new ethers.Contract(zangAddress, zangABI, walletProvider);

        console.log('Contract prepared')

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            // TODO: Convert to Gwei
            console.log(await contractWithSigner.platformFeePercentage())
            console.log(await contractWithSigner.ZangNFTAddress())
            await contractWithSigner.listToken(id, price, amount);

            console.log('Listed')
        }
        catch (e) {
            console.log(e)
            setListingError(e);
        }
    }

    const approveMarketplace = async () => {
        if (!id || !walletProvider) {
            setListingError('No wallet provider');
        };

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        try {
            const transaction = await contractWithSigner.setApprovalForAll(marketplaceAddress, true);
            
            if (transaction) {
                await transaction.wait(1);
                setIsApproved(true);
            }
        }
        catch (e) {
            console.log(e);
            setListingError(e);
        }

        // TODO: wait for confirmation
    }

    const checkApproval = async () => {
        if (!id || !walletAddress) return;

        const zangContract = new ethers.Contract(zangAddress, zangABI, walletProvider);

        try {
            const approved = await zangContract.isApprovedForAll(walletAddress, marketplaceAddress);
            setIsApproved(approved);
        } catch (e) {
            setContractError(e);
        }
    }

    const formatError = (e) => {
        let formatted = e.message
        
        if (e.data?.message) {
            formatted += ' - ' + e.data.message
        }

        return formatted
    }

    useEffect(() => {
        if (!id) {
            navigate('/');
        }
    }, [id])

    useEffect(() => {
        setContractError(null);
        queryListings();
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

    useEffect(() => queryTokenURI(), [id, readProvider])
    useEffect(() => queryTokenData(), [tokenURI])
    useEffect(() => queryTokenContent(), [tokenData])

    useEffect(() => queryTokenAuthor(), [id, readProvider])
    useEffect(() => queryRoyaltyInfo(), [id, readProvider])

    useEffect(checkApproval, [id, walletAddress])

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
                <div className="column">
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
                    contractError ? <></> : (
                    <div className="column">
                        <h1 className="title">{tokenData?.name || ''}</h1>
                        <p className="subtitle">{tokenAuthor ? `by ${tokenAuthor}` : ''}</p>
                        <p className="is-italic">{tokenData?.description || ''}</p>
                        {royaltyInfo && tokenAuthor && royaltyInfo?.amount !== 0 ? 
                        <p>{royaltyInfo.amount.toFixed(2)}% of every sale goes to {royaltyInfo.recipient == tokenAuthor ? 'the author' : royaltyInfo.recipient}.</p>
                        : <></>
                        }
                    </div>
                    )
                }
                {
                    walletAddress && tokenAuthor && walletAddress == tokenAuthor ? (
                        isApproved ? (
                            <button onClick={() => setListModalOpen(true)}>List</button>
                        ) : (
                            <div>
                                <p>Approve the marketplace contract to list</p>
                                    <button onClick={approveMarketplace}>Approve Marketplace</button>
                            </div>
                        )
                    ) : <></>
                }
                {<div>
                    <h2>Listings</h2>
                    { listingError ? <p>{formatError(listingError)}</p> : <></> }
                    {activeListings().map((listing, index) => (
                        <div key={index} className="box">
                            <p>{listing.seller} {listing.amount} {listing.price}</p>
                            { walletProvider ? (
                                    <button onClick={() => buy(listing.id, listing.amount, listing.price)}>Buy</button>
                                ) : <></>
                            }
                        </div>
                    ))}
                    </div>}
            </div>
            {<ListModal isOpen={listModalOpen} setIsOpen={setListModalOpen} onClose={list} />}
        </div>
    )
}