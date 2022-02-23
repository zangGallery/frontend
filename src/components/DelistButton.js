import React from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';
import { useWalletProvider } from '../common/provider';
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { useTransactionHelper } from "../common/transaction_status";

export default function DelistButton ({ nftId, listingId, onUpdate }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const handleTransaction = useTransactionHelper();

    const delist = async () => {
        if (!walletProvider) {
            setStandardError('Please connect a wallet.')
            return;
        }
        if (!nftId) {
            setStandardError('No id specified.')
            return;
        }

        setStandardError(null);

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        const transactionFunction = async () => await contractWithSigner.delistToken(nftId, listingId);

        const { success } = await handleTransaction(transactionFunction, `Delist #${nftId}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <p className="has-text-danger is-clickable"><FontAwesomeIcon icon={faTrashAlt} onClick={() => delist()}/></p>
    )
}