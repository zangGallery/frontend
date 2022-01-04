import React from "react";

export default function FulfillabilityInfo ({ group }) {
    const totalListedAmount = (group) => group.listings.reduce((acc, listing) => acc + listing.amount, 0);

    return (
        group.sellerBalance !== undefined && group.sellerBalance < totalListedAmount(group) ? (
        <p>{ group.sellerBalance == 0 ? 'Unfulfillable' : `Partially fulfillable (${group.sellerBalance} available)` }</p>
        ) : <></>
    )
}