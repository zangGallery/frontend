import React, { useState } from "react";
import { ethers } from "ethers";
import { v1 } from "../common/abi";
import { ListModal } from ".";
import { parseEther } from "@ethersproject/units";
import config from "../config";
import { useWalletProvider } from "../common/provider";
import { useTransactionHelper } from "../common/transaction_status";

import { useRecoilState } from "recoil";
import { standardErrorState } from "../common/error";

export default function ListButton({
    id,
    userBalance,
    userAvailableAmount,
    onUpdate,
    walletAddress,
}) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();
    const handleTransaction = useTransactionHelper();

    const [listModalOpen, setListModalOpen] = useState(false);
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const list = async (amount, price) => {
        if (amount === null) {
            setStandardError("Please enter an amount.");
            return;
        }
        if (price === null) {
            setStandardError("Please enter a price.");
            return;
        }

        if (!id) {
            setStandardError("Could not determine the ID of the NFT.");
            return;
        }
        if (!walletProvider) {
            setStandardError("Please connect a wallet.");
            return;
        }

        setStandardError(null);

        const contract = new ethers.Contract(
            marketplaceAddress,
            marketplaceABI,
            walletProvider
        );
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        const transactionFunction = async () =>
            await contractWithSigner.listToken(id, parseEther(price), amount);

        const { success } = await handleTransaction(
            transactionFunction,
            `List NFT #${id}`
        );
        if (success && onUpdate) {
            onUpdate(id);
        }
    };

    return (
        <div>
            <button
                className="button is-black"
                onClick={() => setListModalOpen(true)}
            >
                List
            </button>
            <ListModal
                isOpen={listModalOpen}
                setIsOpen={setListModalOpen}
                onClose={list}
                balance={userBalance}
                availableAmount={userAvailableAmount}
                id={id}
                walletAddress={walletAddress}
                onUpdate={onUpdate}
            />
        </div>
    );
}
