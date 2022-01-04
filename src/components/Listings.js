import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { ListModal } from '.';
import { parseEther } from '@ethersproject/units';
import config from '../config';

import { navigate } from 'gatsby-link';
import BuyButton from "./BuyButton";

export default function Listings( { readProvider, walletProvider, id, listingsWithFulfillability, walletAddress, userBalance, userAvailableAmount, onError, onUpdate }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;


    const [listModalOpen, setListModalOpen] = useState(false)

    const [isApproved, setIsApproved] = useState(false);

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

            // queryListings();
            // queryUserBalance();
            if (onUpdate) {
                onUpdate();
            }
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

            // queryListings();
            // queryUserBalance();
            if (onUpdate) {
                onUpdate();
            }
        }
        catch (e) {
            console.log(e);
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

    useEffect(checkApproval, [id, walletAddress])

    return (
        <div>
            {
                userAvailableAmount ? (
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
                    listingsWithFulfillability.map((listing, index) => (
                        <div key={index} className="box">
                            <p>{listing.seller} {listing.amount} {listing.price} {listing.fulfillability}</p>
                            { walletProvider ? (
                                listing.seller == walletAddress ? (
                                    <div>

                                        <button>Edit</button>
                                        <button onClick={() => delist(listing.id)}>Delist</button>
                                    </div>
                                ) : (
                                    <BuyButton nftId={id} listingId={listing.id} price={listing.price} maxAmount={listing.amount} fulfillability={listing.fulfillability} onError={onError} />
                                )
                                ) : <></>
                            }
                        </div>
                    ))
                }
            </div>
            
            {<ListModal isOpen={listModalOpen} setIsOpen={setListModalOpen} onClose={list} balance={userBalance} availableAmount={userAvailableAmount} />}
        </div>
    )
}
