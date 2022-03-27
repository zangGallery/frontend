import React from "react";
import ReactTooltip from "react-tooltip";

export default function FulfillabilityInfo({ group }) {
    const totalListedAmount = (group) =>
        group.listings.reduce((acc, listing) => acc + listing.amount, 0);

    return (
        <div>
            {group.sellerBalance !== undefined &&
            group.sellerBalance !== null &&
            group.sellerBalance < totalListedAmount(group) ? (
                group.sellerBalance == 0 ? (
                    <span
                        className="tag is-danger"
                        data-tip="The listing is active but the seller doesn't have any token to sell."
                        data-effect="solid"
                        data-place="bottom"
                    >
                        Unfulfillable
                    </span>
                ) : (
                    <span
                        className="tag is-warning"
                        data-tip="The listing is active but the seller doesn't have enough tokens to sell."
                        data-effect="solid"
                        data-place="bottom"
                    >
                        Partially fulfillable ({group.sellerBalance} available)
                    </span>
                )
            ) : (
                <></>
            )}
            <ReactTooltip />
        </div>
    );
}
