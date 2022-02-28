import React from "react";

export default function Listing ({ price, amount, children }) {
    return (
        <div className="mt-4 is-flex is-flex-direction-column is-align-items-center">
            <div style={{width: "100%"}} className="is-flex is-justify-content-space-around">
                <div className="has-text-centered">
                    <p className="is-size-7">LIST PRICE</p>
                    <p className="is-size-3">{price} <object className="matic-3" type="image/svg+xml" data="https://zang.gallery/matic_logo.svg" aria-label="Matic" /></p>
                </div>
                <div className="has-text-centered">
                    <p className="is-size-7">LIST AMOUNT</p>
                    <p className="is-size-3">{amount}</p>
                </div>
            </div>
            {children}
        </div>
    )
}