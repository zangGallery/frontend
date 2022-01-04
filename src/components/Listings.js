import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { ListModal } from '.';
import { formatEther, parseEther, parseUnits } from '@ethersproject/units';
import config from '../config';

import { navigate } from 'gatsby-link';

export default function Listings( { readProvider, walletProvider, id, walletAddress, onError }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [listings, setListings] = useState([])

    const [listModalOpen, setListModalOpen] = useState(false)

    const [isApproved, setIsApproved] = useState(false);

    const [listingSellerBalances, setListingSellerBalances] = useState({});

    const activeListings = () => {
        return listings.filter(listing => parseInt(listing.seller, 16) != 0)
    }

    const sortedListings = () => {
        return [...activeListings()].sort((a, b) => a.price - b.price)
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

    const listingsWithFulfillability = () => {
        const balances = {...listingSellerBalances};

        const newListings = [];

        for (const listing of sortedListings()) {
            const balance = balances[listing.seller] || 0;
            const fulfillability = Math.max(Math.min(listing.amount, balance), 0);
            balances[listing.seller] -= listing.amount;

            const newListing = {
                ...listing,
                fulfillability
            }

            newListings.push(newListing);
        }

        return newListings;
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
            onError(e);
        }
    }

    const updateSellerBalance = (sellerAddress) => {
        if (!sellerAddress || !readProvider || !id) return;

        const contract = new ethers.Contract(zangAddress, zangABI, readProvider);

        try {
            contract.balanceOf(sellerAddress, id).then((balance) => {
                console.log('Updating balance of ' + sellerAddress + ' to ' + balance.toNumber())
                setListingSellerBalances((currentBalance) => ({...currentBalance, [sellerAddress]: balance.toNumber()}));
            })
        }
        catch (e) {
            onError(e);
        }
    }

    const queryUserBalance = () => {
        updateSellerBalance(walletAddress);
    }

    const queryListingSellerBalances = async () => {
        if (!id || !listings) return;

        console.log('Listings: ', activeListings())

        const promises = [];

        try {
            for (const listing of activeListings()) {
                if (!listingSellerBalances[listing.seller]) {
                    const promise = updateSellerBalance(listing.seller);
                    promises.push(promise);
                }
            }
        } catch (e) {
            onError(e);
        }

        await Promise.all(promises);
    }

    const list = async (amount, price) => {
        console.log('Amount: ' + amount + ' Price: ' + price)
        console.log('ID: ' + id, 'Wallet: ' + walletAddress)
        if (amount === null || price === null) {
            return;
        }

        if (!id || !walletProvider) return;
        // setError(null);

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            console.log('Price:', price)
            console.log('Parsed price:', parseEther(price).toString())
            await contractWithSigner.listToken(id, parseEther(price), amount);

            console.log('Listed')

            queryListings();
            queryUserBalance();
        }
        catch (e) {
            console.log(e)
            onError(e);
        }
    }

    const delist = async (listingId) => {
        if (!walletProvider) {
            onError('No wallet provider.')
            return;
        }
        if (!id) {
            onError('No id specified.')
            return;
        }

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        try {
            const transaction = await contractWithSigner.delistToken(id, listingId);
            
            if (transaction) {
                await transaction.wait(1);
            }

            queryListings();
            queryUserBalance();
        }
        catch (e) {
            console.log(e);
            onError(e);
        }
    }

    const buy = async (listingId, amount, price) => {
        if (!id || !readProvider) return;
        onError(null);

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        // Convert to wei
        console.log('Original price:', price)
        price = parseEther(price);
        console.log('Converted:', price.toString())

        try {
            const transaction = contractWithSigner.buyToken(id, listingId, amount, { value: price.mul(amount) });

            if (transaction) {
                await transaction.wait(1);
            }

            navigate('/vault')
        }
        catch (e) {
            onError(e);
        }
    }

    const approveMarketplace = async () => {
        if (!walletProvider) {
            onError('No wallet provider.');
            return;
        };
        if (!id) {
            onError('No id specified.');
            return;
        }

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
            onError(e);
        }
    }

    const checkApproval = async () => {
        if (!id || !walletAddress) return;

        const zangContract = new ethers.Contract(zangAddress, zangABI, walletProvider);

        try {
            const approved = await zangContract.isApprovedForAll(walletAddress, marketplaceAddress);
            setIsApproved(approved);
        } catch (e) {
            onError(e);
        }
    }

    const formatError = (e) => {
        let formatted = e.message
        
        if (e.data?.message) {
            formatted += ' - ' + e.data.message
        }

        return formatted
    }

    
    useEffect(queryListings, [id, walletAddress])
    useEffect(queryUserBalance, [id, walletAddress])
    useEffect(queryListingSellerBalances, [id, readProvider])

    useEffect(checkApproval, [id, walletAddress])

    return (
        <div>
            {
                userAvailableAmount() ? (
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
            <div>
                <h2>Listings</h2>
                {
                    listingsWithFulfillability().map((listing, index) => (
                        <div key={index} className="box">
                            <p>{listing.seller} {listing.amount} {listing.price} {listing.fulfillability}</p>
                            { walletProvider ? (
                                listing.seller == walletAddress ? (
                                    <div>

                                        <button>Edit</button>
                                        <button onClick={() => delist(listing.id)}>Delist</button>
                                    </div>
                                ) : (
                                    <button onClick={() => buy(listing.id, listing.amount, listing.price)}>Buy</button>
                                )
                                ) : <></>
                            }
                            <p>{JSON.stringify(listingSellerBalances)}</p>
                        </div>
                    ))
                }
            </div>
            
            {<ListModal isOpen={listModalOpen} setIsOpen={setListModalOpen} onClose={list} balance={userBalance()} availableAmount={userAvailableAmount()} />}
        </div>
    )
}
