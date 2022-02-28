import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';

import { useWalletProvider } from '../common/provider';

import TransferModal from "./TransferModal";
import { useTransactionHelper } from "../common/transaction_status";
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';

export default function TransferButton ( { id, walletAddress, balance, availableAmount, onUpdate } ) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const [walletProvider, setWalletProvider] = useWalletProvider()

    const handleTransaction = useTransactionHelper()

    const [transferModalOpen, setTransferModalOpen] = useState(false);

    const [_, setStandardError] = useRecoilState(standardErrorState);

    const transfer = async (to, amount) => {
        if (to === null) {
            setStandardError('Please enter a valid address.');
            return;
        }

        if (amount === null) {
            setStandardError('Please enter an amount.');
            return;
        }

        if (!id) {
            setStandardError('Could not determine the ID of the NFT.')
            return;
        }
        if (!walletProvider) {
            setStandardError('Please connect a wallet.')
            return;
        }

        setStandardError(null);

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        const transactionFunction = async () => await contractWithSigner.safeTransferFrom(walletAddress, to, id, amount, []);
        const { success } = await handleTransaction(transactionFunction, `Transfer #${id}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <div>
            <button className="button is-black is-small mr-1" onClick={() => setTransferModalOpen(true)}>Gift</button>
            <TransferModal isOpen={transferModalOpen} setIsOpen={setTransferModalOpen} onClose={transfer} balance={balance} availableAmount={availableAmount} />
        </div>
    )
}