import React, { useState, useEffect } from "react";
import config from "../config";

import BuyButton from "./BuyButton";
import FulfillabilityInfo from "./FulfillabilityInfo";
import EditButton from "./EditButton";
import Listing from "./Listing";

import ListButton from "./ListButton";
import DelistButton from "./DelistButton";
import Address from "../components/Address";
import { useRecoilState } from "recoil";
import { formatError, standardErrorState } from "../common/error";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { tokenAddressToId } from "../common/user";

export default function Listings({
    nftContract,
    walletProvider,
    id,
    listingGroups,
    walletAddress,
    userBalance,
    userAvailableAmount,
    onUpdate,
}) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;

    const [isApproved, setIsApproved] = useState(false);

    const userListingGroup = () =>
        listingGroups
            ? listingGroups.find((group) => group.seller === walletAddress)
            : null;
    const otherListingGroups = () =>
        listingGroups
            ? listingGroups.filter((group) => group.seller !== walletAddress)
            : null;

    const [_, setStandardError] = useRecoilState(standardErrorState);

    const checkApproval = async () => {
        if (!id || !walletAddress) return;

        try {
            const approved = await nftContract.isApprovedForAll(
                walletAddress,
                marketplaceAddress
            );
            setIsApproved(approved);
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    useEffect(checkApproval, [id, walletAddress]);

    return (
        <div>
            {userBalance ? (
                <ListButton
                    nftContract={nftContract}
                    id={id}
                    userBalance={userBalance}
                    userAvailableAmount={userAvailableAmount}
                    onUpdate={onUpdate}
                    walletAddress={walletAddress}
                />
            ) : (
                <></>
            )}
            <div>
                {userListingGroup() ? (
                    <div>
                        <h4 className="title is-4 m-0 mt-2">Your Listings</h4>
                        <div>
                            <FulfillabilityInfo group={userListingGroup()} />
                            {userListingGroup().listings.map((listing) => (
                                <div key={listing.id}>
                                    <Listing
                                        price={listing.price}
                                        amount={listing.amount}
                                    >
                                        <div
                                            className="is-flex is-justify-content-center mt-2"
                                            style={{ width: "100%" }}
                                        >
                                            <EditButton
                                                nftContract={nftContract}
                                                nftId={id}
                                                listingId={listing.id}
                                                balance={userBalance}
                                                onUpdate={onUpdate}
                                                oldAmount={listing.amount}
                                                availableAmount={
                                                    userAvailableAmount
                                                }
                                            />
                                            <DelistButton
                                                nftContract={nftContract}
                                                nftId={id}
                                                listingId={listing.id}
                                                onUpdate={onUpdate}
                                            />
                                        </div>
                                    </Listing>
                                    <hr />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <></>
                )}
                <h4 className="title is-4 mt-2">
                    {userListingGroup() ? "Other Listings" : "Listings"}
                </h4>
                {otherListingGroups() !== null ? (
                    otherListingGroups().length > 0 ? (
                        otherListingGroups().map((group, index) => (
                            <div
                                key={"group" + index}
                                className="block p-2 pb-5"
                                style={{
                                    border: "1px #eee solid",
                                    borderRadius: "0.5em",
                                }}
                            >
                                <p className="is-size-7">SELLER</p>
                                <p>
                                    <Address
                                        address={group.seller}
                                        shorten
                                        nChar={8}
                                    />
                                </p>
                                <FulfillabilityInfo group={group} />

                                <div>
                                    {group.listings.map((listing) => (
                                        <div key={listing.id}>
                                            <hr />
                                            <Listing
                                                price={listing.price}
                                                amount={listing.amount}
                                            >
                                                {walletProvider ? (
                                                    <BuyButton
                                                        nftContract={
                                                            nftContract
                                                        }
                                                        nftId={id}
                                                        listingId={listing.id}
                                                        price={listing.price}
                                                        paymentToken={
                                                            tokenAddressToId[
                                                                listing.paymentToken.toLowerCase()
                                                            ]
                                                        }
                                                        maxAmount={
                                                            listing.amount
                                                        }
                                                        sellerBalance={
                                                            group.sellerBalance
                                                        }
                                                        onUpdate={onUpdate}
                                                    />
                                                ) : (
                                                    <button
                                                        className="button is-black"
                                                        disabled
                                                    >
                                                        Connect wallet to buy
                                                    </button>
                                                )}
                                            </Listing>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No listings.</p>
                    )
                ) : (
                    <Skeleton height={180} />
                )}
            </div>
        </div>
    );
}
