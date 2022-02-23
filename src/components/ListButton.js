import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { ListModal } from '.';
import { parseEther } from '@ethersproject/units';
import config from '../config';
import { useWalletProvider } from '../common/provider';
import { useTransactionHelper } from "../common/transaction_status";

export default function ListButton ({ id, userBalance, userAvailableAmount, onError, onUpdate }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();
    const handleTransaction = useTransactionHelper()

    const [listModalOpen, setListModalOpen] = useState(false);

    const list = async (amount, price) => {
        if (amount === null || price === null) {
            return;
        }

        if (!id || !walletProvider) return;

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        const transactionFunction = async () => await contractWithSigner.listToken(id, parseEther(price), amount);

        const { success } = await handleTransaction(transactionFunction, `List #${id}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <div>
            <button className="button is-info" onClick={() => setListModalOpen(true)}>List</button>
            <ListModal isOpen={listModalOpen} setIsOpen={setListModalOpen} onClose={list} balance={userBalance} availableAmount={userAvailableAmount} />
        </div>
    )
}