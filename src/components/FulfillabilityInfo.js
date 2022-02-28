import React from "react";

export default function FulfillabilityInfo ({ group }) {
    const totalListedAmount = (group) => group.listings.reduce((acc, listing) => acc + listing.amount, 0);

    return (
        group.sellerBalance !== undefined && group.sellerBalance !== null && group.sellerBalance < totalListedAmount(group) ? (
        group.sellerBalance == 0 ? <span className="tag is-danger">Unfulfillable</span> : <span className="tag is-warning">Partially fulfillable (${group.sellerBalance} available)</span> 
        ) : <></>
    )
}