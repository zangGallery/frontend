import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';

import { useWalletProvider } from '../common/provider';

import TransferModal from "./TransferModal";

export default function TransferButton ( { id, walletAddress, balance, availableAmount, onUpdate, onError } ) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const [walletProvider, setWalletProvider] = useWalletProvider()

    const [transferModalOpen, setTransferModalOpen] = useState(false);

    const transfer = async (to, amount) => {
        console.log('Amount: ' + amount + ' To: ' + to + ' ID: ' + id + ' Wallet: ' + walletAddress)
        if (to === null || amount === null) {
            return;
        }

        if (!id || !walletProvider) return;
        // setError(null);

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            const transaction = await contractWithSigner.safeTransferFrom(walletAddress, to, id, amount, []);

            if (transaction) {
                await transaction.wait(1);
                if (onUpdate) {
                    onUpdate()
                }
                console.log('Listed')
            }
        }
        catch (e) {
            console.log(e)
            onError(e);
        }
    }

    return (
        <div>
            <button onClick={() => setTransferModalOpen(true)}>Gift</button>
            <TransferModal isOpen={transferModalOpen} setIsOpen={setTransferModalOpen} onClose={transfer} balance={balance} availableAmount={availableAmount} />
        </div>
    )
}