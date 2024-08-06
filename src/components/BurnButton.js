import React, { useState } from "react";
import { useRecoilState } from "recoil";

import { useWalletProvider } from "../common/provider";

import BurnModal from "./BurnModal";
import { useTransactionHelper } from "../common/transaction_status";
import { standardErrorState } from "../common/error";

export default function BurnButton({
    nftContract,
    id,
    walletAddress,
    balance,
    availableAmount,
    onUpdate,
}) {
    const handleTransaction = useTransactionHelper();
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const [walletProvider, setWalletProvider] = useWalletProvider();

    const [burnModalOpen, setBurnModalOpen] = useState(false);

    const burn = async (amount) => {
        if (amount === null) {
            setStandardError("Please enter an amount.");
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

        const contractWithSigner = nftContract.connect(
            walletProvider.getSigner()
        );
        const transactionFunction = async () =>
            await contractWithSigner.burn(walletAddress, id, amount);
        const { success } = await handleTransaction(
            transactionFunction,
            `Burn NFT #${id}`
        );
        if (success && onUpdate) {
            onUpdate(id);
        }
    };

    return (
        <div>
            <button
                className="button is-black is-small"
                onClick={() => setBurnModalOpen(true)}
            >
                Burn
            </button>
            <BurnModal
                isOpen={burnModalOpen}
                setIsOpen={setBurnModalOpen}
                onClose={burn}
                balance={balance}
                availableAmount={availableAmount}
            />
        </div>
    );
}
