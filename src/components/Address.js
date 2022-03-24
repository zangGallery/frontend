import React from 'react';
import config from '../config';

import { useEns } from '../common/ens';

import {shortenAddress} from '../common/utils';

export default function Address({address, shorten, nChar}) {
    const { lookupEns } = useEns();
    return (
        <span>
            <a target="_blank" rel="noopener" href={config.blockExplorer.url+'/address/'+address} style={{textDecoration: 'underline'}}>
                {lookupEns(address) || (shorten ? shortenAddress(address,nChar) : address)}
            </a>
        </span>
    )
}