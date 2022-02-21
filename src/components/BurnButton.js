import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';

import { useWalletProvider } from '../common/provider';

import BurnModal from "./BurnModal";
import { useTransactionHelper } from "../common/transaction_status";

export default function BurnButton ( { id, walletAddress, balance, availableAmount, onUpdate, onError } ) {
    const handleTransaction = useTransactionHelper();
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const [walletProvider, setWalletProvider] = useWalletProvider()

    const [burnModalOpen, setBurnModalOpen] = useState(false);

    const burn = async (amount) => {
        if (amount === null) {
            return;
        }

        if (!id || !walletProvider) return;
        // setError(null);

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        const transactionFunction = async () => await contractWithSigner.burn(walletAddress, id, amount);
        const { success } = await handleTransaction(transactionFunction, `Burn #${id}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <div>
            <button className="button is-danger" onClick={() => setBurnModalOpen(true)}>Burn</button>
            <BurnModal isOpen={burnModalOpen} setIsOpen={setBurnModalOpen} onClose={burn} balance={balance} availableAmount={availableAmount} />
        </div>
    )
}