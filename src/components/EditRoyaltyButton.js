import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';
import Decimal from "decimal.js";

import { useWalletProvider } from '../common/provider';

import EditRoyaltyModal from "./EditRoyaltyModal";
import { useTransactionHelper } from "../common/transaction_status";

export default function EditRoyaltyButton ( { id, walletAddress, currentRoyaltyPercentage, onUpdate, onError } ) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const [walletProvider, setWalletProvider] = useWalletProvider()

    const handleTransaction = useTransactionHelper()

    const [editModalOpen, setEditModalOpen] = useState(false);

    if (currentRoyaltyPercentage === null || currentRoyaltyPercentage === undefined) {
        return <></>;
    }

    const editRoyalty = async (royaltyPercentage) => {
        if (royaltyPercentage === null) {
            return;
        }

        const effectiveRoyaltyPercentage = new Decimal(royaltyPercentage).mul('100').toNumber();

        if (!id || !walletProvider) return;
        // setError(null);

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        const transactionFunction = async () => await contractWithSigner.decreaseRoyaltyNumerator(id, effectiveRoyaltyPercentage);

        const { success } = await handleTransaction(transactionFunction, `Edit royalty for #${id}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <div>
            <button className="button is-success" onClick={() => setEditModalOpen(true)}>Edit Royalty</button>
            <EditRoyaltyModal isOpen={editModalOpen} setIsOpen={setEditModalOpen} onClose={editRoyalty} currentRoyaltyPercentage={currentRoyaltyPercentage} />
        </div>
    )
}