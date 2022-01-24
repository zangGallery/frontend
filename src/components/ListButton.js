import React, { useState } from "react";
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { ListModal } from '.';
import { parseEther } from '@ethersproject/units';
import config from '../config';
import { useWalletProvider } from '../common/provider';

export default function ListButton ({ id, userBalance, userAvailableAmount, onError, onUpdate }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();

    const [listModalOpen, setListModalOpen] = useState(false);

    const list = async (amount, price) => {
        if (amount === null || price === null) {
            return;
        }

        if (!id || !walletProvider) return;

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        try {
            console.log('Price:', price)
            console.log('Parsed price:', parseEther(price).toString())
            const transaction = await contractWithSigner.listToken(id, parseEther(price), amount);

            if (transaction) {
                await transaction.wait(1);
                console.log('Listed')

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
            <button className="button is-info" onClick={() => setListModalOpen(true)}>List</button>
            <ListModal isOpen={listModalOpen} setIsOpen={setListModalOpen} onClose={list} balance={userBalance} availableAmount={userAvailableAmount} />
        </div>
    )
}