import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { ListModal } from '.';
import { parseEther } from '@ethersproject/units';
import config from '../config';

import BuyButton from "./BuyButton";
import FulfillabilityInfo from "./FulfillabilityInfo";
import EditButton from "./EditButton";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

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
                userBalance ? (
                    isApproved ? (
                        <button className="button is-info" onClick={() => setListModalOpen(true)}>List</button>
                    ) : (
                        <div>
                            <p>Approve the marketplace contract to list</p>
                                <button className="button is-warning" onClick={approveMarketplace}>Approve Marketplace</button>
                        </div>
                    )
                ) : <></>
            }
            <div>
                {
                    userListingGroup() ? (
                        <div>
                            <h4 className="title is-4 m-0 mt-2">Your Listings</h4>
                            <div>
                                <FulfillabilityInfo group={userListingGroup()} />
                                {
                                    userListingGroup().listings.map(listing => (
                                        <div key={listing.id} className="is-flex" >
                                            <p style={{width: '6em'}}>{listing.amount} {listing.token} @ {listing.price}Ξ</p>
                                            <EditButton nftId={id} listingId={listing.id} balance={userBalance} onError={onError} onUpdate={onUpdate} oldAmount={listing.amount} availableAmount={userAvailableAmount} />
                                            <p className="has-text-danger is-clickable"><FontAwesomeIcon icon={faTrashAlt} onClick={() => delist(listing.id)}/></p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ) : <></>
                }
                <h4 className="title is-4 mt-2">{userListingGroup() ? 'Other Listings' : 'Listings'}</h4>
                {
                    otherListingGroups().length > 0 ?
                        otherListingGroups().map((group, index) => (
                            <div key={'group' + index} className="box">
                                <p>Seller: {group.seller}</p>
                                <FulfillabilityInfo group={group} />

                                <div>
                                    {
                                        group.listings.map(listing => (
                                            <div key={listing.id}>
                                                <div className="mt-4">
                                                    <div style={{width: '5em'}}>
                                                        <p>{listing.amount} {listing.token} @ {listing.price}Ξ</p>
                                                    </div>

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
