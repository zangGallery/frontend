import React from 'react';
import { useState } from 'react';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';

import { parseEther } from '@ethersproject/units';

import { useReadProvider, useWalletProvider } from '../common/provider';

import EditModal from './EditModal';

export default function EditButton ({ nftId, listingId, availableAmount, balance, onError, onUpdate, oldAmount }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()

    const [buyModalOpen, setBuyModalOpen] = useState(false);

    const edit = async (newAmount, newPrice) => {
        if (newAmount === null && newPrice === null) {
            return;
        }

        if (!nftId || !walletProvider) return;

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            let transaction;

            if (newAmount === null && newPrice !== null) {
                // Replacing only price
                transaction = await contractWithSigner.editListingPrice(nftId, listingId, parseEther(newPrice).toString());
            } else if (newAmount !== null && newPrice === null) {
                // Replacing only amount
                transaction = await contractWithSigner.editListingAmount(nftId, listingId, newAmount, oldAmount);
            } else if (newAmount !== null && newPrice !== null) {
                // Replacing both
                transaction = await contractWithSigner.editListing(nftId, listingId, parseEther(newPrice).toString(), newAmount, oldAmount);
            }

            if (transaction) {
                await transaction.wait(1);
                console.log('Edited')

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

    return (
        <div>
            <button onClick={() => setBuyModalOpen(true)}>Edit</button>
            <EditModal isOpen={buyModalOpen} setIsOpen={setBuyModalOpen} onClose={edit} balance={balance} availableAmount={availableAmount} oldAmount={oldAmount} />
        </div>

    )
}