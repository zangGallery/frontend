import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';

import { useWalletProvider } from '../common/provider';

import BurnModal from "./BurnModal";

export default function BurnButton ( { id, walletAddress, balance, availableAmount, onUpdate, onError } ) {
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
        try {
            const transaction = await contractWithSigner.burn(walletAddress, id, amount);

            if (transaction) {
                await transaction.wait(1);
                if (onUpdate) {
                    onUpdate()
                }
                console.log('Burned')
            }
        }
        catch (e) {
            console.log(e)
            onError(e);
        }
    }

    return (
        <div>
            <button className="button is-danger" onClick={() => setBurnModalOpen(true)}>Burn</button>
            <BurnModal isOpen={burnModalOpen} setIsOpen={setBurnModalOpen} onClose={burn} balance={balance} availableAmount={availableAmount} />
        </div>
    )
}