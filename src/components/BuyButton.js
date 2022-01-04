import React from 'react';
import { useState } from 'react';
import config from '../config';
import { ethers } from 'ethers';
import { v1 } from '../common/abi';
import rehypeSanitize from "rehype-sanitize";
import * as queryString from "query-string";

import { navigate } from 'gatsby-link';

import { parseEther } from '@ethersproject/units';

import { useReadProvider, useWalletProvider } from '../common/provider';

import BuyModal from './BuyModal';

export default function BuyButton ({ nftId, listingId, price, maxAmount, fulfillability, onError }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [readProvider, setReadProvider] = useReadProvider()
    const [walletProvider, setWalletProvider] = useWalletProvider()

    const [buyModalOpen, setBuyModalOpen] = useState(false);

    const buy = async (amount) => {
        if (!nftId || !readProvider) return;

        const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, walletProvider);
        const contractWithSigner = contract.connect(walletProvider.getSigner());

        // Convert to wei
        console.log('Original price:', price)
        price = parseEther(price);
        console.log('Converted:', price.toString())

        try {
            const transaction = contractWithSigner.buyToken(nftId, listingId, amount, { value: price.mul(amount) });

            if (transaction) {
                await transaction.wait(1);
            }

            navigate('/vault')
        }
        catch (e) {
            onError(e);
        }
    }

    return (
        <div>
            <button onClick={() => setBuyModalOpen(true)}>Buy</button>
            <BuyModal isOpen={buyModalOpen} setIsOpen={setBuyModalOpen} onClose={buy} maxAmount={maxAmount} fulfillability={fulfillability} price={price} />
        </div>
        
    )
}