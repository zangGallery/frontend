import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { ListModal } from '.';
import { parseEther } from '@ethersproject/units';
import config from '../config';

import BuyButton from "./BuyButton";
import FulfillabilityInfo from "./FulfillabilityInfo";
import EditButton from "./EditButton";

export default function Listings( { walletProvider, id, listingGroups, walletAddress, userBalance, userAvailableAmount, onError, onUpdate }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [listModalOpen, setListModalOpen] = useState(false)

    const [isApproved, setIsApproved] = useState(false);

    const userListingGroup = () => (listingGroups || []).find(group => group.seller === walletAddress);
    const otherListingGroups = () => (listingGroups || []).filter(group => group.seller !== walletAddress);

    const list = async (amount, price) => {
        console.log('Amount: ' + amount + ' Price: ' + price)
        console.log('ID: ' + id, 'Wallet: ' + walletAddress)
        if (amount === null || price === null) {
            return;
        }

        if (!id || !walletProvider) return;

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            console.log('Price:', price)
            console.log('Parsed price:', parseEther(price).toString())
            const transaction = await contractWithSigner.listToken(id, parseEther(price), amount);

            if (transaction) {
                await transaction.wait(1);
                console.log('Listed')

                if (onUpdate) {
                    onUpdate();
                }
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
                {
                    userListingGroup() ? (
                        <div>
                            <h2>Your Listings</h2>
                            <div>
                                <FulfillabilityInfo group={userListingGroup()} />
                                {
                                    userListingGroup().listings.map(listing => (
                                        <div key={listing.id}>
                                            <div>
                                                <p>{listing.amount} {listing.token} @ {listing.price}</p>
                                                <button onClick={() => delist(listing.id)}>Delist</button>
                                                <EditButton nftId={id} listingId={listing.id} balance={userBalance} onError={onError} onUpdate={onUpdate} oldAmount={listing.amount} availableAmount={userAvailableAmount} />
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ) : <></>
                }
                <h2>{userListingGroup() ? 'Other Listings' : 'Listings'}</h2>
                {
                    otherListingGroups().length > 0 ?
                        otherListingGroups().map((group, index) => (
                            <div key={'group' + index} className="box">
                                <p>{group.seller}</p>
                                <FulfillabilityInfo group={group} />

                                <div>
                                    {
                                        group.listings.map(listing => (
                                            <div key={listing.id}>
                                                <div>
                                                    <p>{listing.amount} {listing.token} @ {listing.price}</p>

                                                    { walletProvider ? (
                                                        <BuyButton nftId={id} listingId={listing.id} price={listing.price} maxAmount={listing.amount} sellerBalance={group.sellerBalance} onError={onError} onUpdate={onUpdate} />
                                                    ) : <></>
                                                    }
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )) : <></>
                }
            </div>
            
            {<ListModal isOpen={listModalOpen} setIsOpen={setListModalOpen} onClose={list} balance={userBalance} availableAmount={userAvailableAmount} />}
        </div>
    )
}
