import React from "react";
import { useEns } from '../common/ens';
import {shortenAddress} from "../common/utils";
import Skeleton from 'react-loading-skeleton';

export default function NFTOwners({ balances }) {
    const { lookupEns } = useEns();
    return (
        <div>
            {
                balances ? (Object.keys(balances).map((owner, index) => {
                    return (
                        <div key={index}>
                            <p className="is-size-6">{balances[owner]} <span>×</span> <tt>{lookupEns(owner) || shortenAddress(owner, 8)}</tt></p>
                        </div>
                    )
                })) : <Skeleton/>
            }
        </div>
    )
}