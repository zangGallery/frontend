import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import config from '../config';
import Decimal from "decimal.js";

import { useWalletProvider } from '../common/provider';

import EditRoyaltyModal from "./EditRoyaltyModal";

export default function EditRoyaltyButton ( { id, walletAddress, currentRoyaltyPercentage, onUpdate, onError } ) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const [walletProvider, setWalletProvider] = useWalletProvider()

    const [editModalOpen, setEditModalOpen] = useState(false);

    const editRoyalty = async (royaltyPercentage) => {
        if (royaltyPercentage === null) {
            return;
        }

        const effectiveRoyaltyPercentage = new Decimal(royaltyPercentage).mul('100').toNumber();

        if (!id || !walletProvider) return;
        // setError(null);

        const contract = new ethers.Contract(zangAddress, zangABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            const transaction = await contractWithSigner.decreaseRoyaltyNumerator(id, effectiveRoyaltyPercentage);

            if (transaction) {
                await transaction.wait(1);
                if (onUpdate) {
                    onUpdate()
                }
                console.log('Royalty numerator decreased')
            }
        }
        catch (e) {
            console.log(e)
            onError(e);
        }
    }

    return (
        <div>
            <button className="button is-success" onClick={() => setEditModalOpen(true)}>Edit Royalty</button>
            <EditRoyaltyModal isOpen={editModalOpen} setIsOpen={setEditModalOpen} onClose={editRoyalty} currentRoyaltyPercentage={currentRoyaltyPercentage} />
        </div>
    )
}