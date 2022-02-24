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
import { useTransactionHelper } from '../common/transaction_status';

import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';

export default function EditButton ({ nftId, listingId, availableAmount, balance, onUpdate, oldAmount }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider()

    const handleTransaction = useTransactionHelper();

    const [buyModalOpen, setBuyModalOpen] = useState(false);
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const edit = async (newAmount, newPrice) => {
        if (newAmount === null && newPrice === null) {
            setStandardError('Please enter an amount or a price.')
            return;
        }

        if (!nftId) {
            setStandardError('Could not determine the ID of the NFT.')
            return;
        }
        if (!walletProvider) {
            setStandardError('Please connect a wallet.')
            return;
        }

        setStandardError(null);

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        let transactionFunction = null;

        if (newAmount === null && newPrice !== null) {
            // Replacing only price
            transactionFunction = async () => contractWithSigner.editListingPrice(nftId, listingId, parseEther(newPrice).toString());
        } else if (newAmount !== null && newPrice === null) {
            // Replacing only amount
            transactionFunction = async () => contractWithSigner.editListingAmount(nftId, listingId, newAmount, oldAmount);
        } else if (newAmount !== null && newPrice !== null) {
            // Replacing both
            transactionFunction = async () => await contractWithSigner.editListing(nftId, listingId, parseEther(newPrice).toString(), newAmount, oldAmount);
        }

        const { success } = await handleTransaction(transactionFunction, `Edit listing for #${nftId}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <div>
            <p className="has-text-info is-clickable"><FontAwesomeIcon icon={editIcon} onClick={() => setBuyModalOpen(true)}/></p>
            <EditModal isOpen={buyModalOpen} setIsOpen={setBuyModalOpen} onClose={edit} balance={balance} availableAmount={availableAmount} oldAmount={oldAmount} />
        </div>

    )
}
