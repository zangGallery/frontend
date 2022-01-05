import React from 'react';
import { useState } from 'react';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';

import { parseEther } from '@ethersproject/units';

import { useWalletProvider } from '../common/provider';

import EditModal from './EditModal';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit as editIcon } from '@fortawesome/free-solid-svg-icons';

export default function EditButton ({ nftId, listingId, availableAmount, balance, onError, onUpdate, oldAmount }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

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
            <p className="has-text-info is-clickable"><FontAwesomeIcon icon={editIcon} prefix onClick={() => setBuyModalOpen(true)}/></p>
            <EditModal isOpen={buyModalOpen} setIsOpen={setBuyModalOpen} onClose={edit} balance={balance} availableAmount={availableAmount} oldAmount={oldAmount} />
        </div>

    )
}
