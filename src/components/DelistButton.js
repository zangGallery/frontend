import React from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';
import { useWalletProvider } from '../common/provider';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

export default function DelistButton ({ nftId, listingId, onError, onUpdate }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();

    const delist = async () => {
        if (!walletProvider) {
            onError('No wallet provider.')
            return;
        }
        if (!nftId) {
            onError('No id specified.')
            return;
        }

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        try {
            const transaction = await contractWithSigner.delistToken(nftId, listingId);
            
            if (transaction) {
                await transaction.wait(1);
            }
            if (onUpdate) {
                onUpdate();
            }
        }
        catch (e) {
            console.log(e);
            onError(e);
        }
    }

    return (
        <p className="has-text-danger is-clickable"><FontAwesomeIcon icon={faTrashAlt} onClick={() => delist()}/></p>
    )
}