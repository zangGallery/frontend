import React from 'react';
import { useState } from 'react';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';

import { parseEther } from '@ethersproject/units';

import { useReadProvider, useWalletProvider } from '../common/provider';

import BuyModal from './BuyModal';
import { useTransactionHelper } from '../common/transaction_status';

export default function BuyButton ({ nftId, listingId, price, maxAmount, sellerBalance, onUpdate }) {
    sellerBalance = sellerBalance || 0;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const handleTransaction = useTransactionHelper();

    const [buyModalOpen, setBuyModalOpen] = useState(false);

    const buy = async (amount) => {
        if (amount === null) {
            setStandardError('Please enter an amount.');
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

        // Convert to wei
        console.log('Original price:', price)
        price = parseEther(price);
        console.log('Converted:', price.toString())

        const transactionFunction = async () => await contractWithSigner.buyToken(nftId, listingId, amount, { value: price.mul(amount) });
        const { success } = await handleTransaction(transactionFunction, `Buy NFTs #${nftId}`);
        if (success && onUpdate) {
            onUpdate();
        }
    }

    return (
        <div>
            <button className="button is-black" onClick={() => setBuyModalOpen(true)}>Buy</button>
            <BuyModal isOpen={buyModalOpen} setIsOpen={setBuyModalOpen} onClose={buy} maxAmount={maxAmount} sellerBalance={sellerBalance} price={price} />
        </div>
        
    )
}