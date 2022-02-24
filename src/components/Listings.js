import React, { useState, useEffect } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';

import BuyButton from "./BuyButton";
import FulfillabilityInfo from "./FulfillabilityInfo";
import EditButton from "./EditButton";

import { useEns } from "../common/ens";
import ListButton from "./ListButton";
import DelistButton from "./DelistButton";
import { useTransactionHelper } from "../common/transaction_status";
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';

export default function Listings( { walletProvider, id, listingGroups, walletAddress, userBalance, userAvailableAmount, onUpdate }) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;

    const { lookupEns } = useEns();

    const [isApproved, setIsApproved] = useState(false);

    const userListingGroup = () => (listingGroups || []).find(group => group.seller === walletAddress);
    const otherListingGroups = () => (listingGroups || []).filter(group => group.seller !== walletAddress);

    const handleTransaction = useTransactionHelper();
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const approveMarketplace = async () => {
        if (!walletProvider) {
            setStandardError('No wallet provider.');
            return;
        };
        if (!id) {
            setStandardError('No id specified.');
            return;
        }

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        const transactionFunction = async () => await contractWithSigner.setApprovalForAll(marketplaceAddress, true);

        const { success } = await handleTransaction(transactionFunction, 'Approve Marketplace');

        if (success) {
            setIsApproved(true);
            if (onUpdate) {
                onUpdate();
            }
        }
    }

    const checkApproval = async () => {
        if (!id || !walletAddress) return;

        const zangContract = new ethers.Contract(zangAddress, zangABI, walletProvider);

        try {
            const approved = await zangContract.isApprovedForAll(walletAddress, marketplaceAddress);
            setIsApproved(approved);
        } catch (e) {
            setStandardError(e.message);
        }
    }

    useEffect(checkApproval, [id, walletAddress])

    return (
        <div>
            {
                userBalance ? (
                    isApproved ? (
                        <ListButton id={id} userBalance={userBalance} userAvailableAmount={userAvailableAmount} onUpdate={onUpdate} />
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
                                            <EditButton nftId={id} listingId={listing.id} balance={userBalance} onUpdate={onUpdate} oldAmount={listing.amount} availableAmount={userAvailableAmount} />
                                            <DelistButton nftId={id} listingId={listing.id} onUpdate={onUpdate} />
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
                                <p>Seller: { lookupEns(group.seller) || group.seller}</p>
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
                                                        <BuyButton nftId={id} listingId={listing.id} price={listing.price} maxAmount={listing.amount} sellerBalance={group.sellerBalance} onUpdate={onUpdate} />
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
        </div>
    )
}
