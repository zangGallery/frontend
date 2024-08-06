import React, { useState } from "react";
import Decimal from "decimal.js";

import { useWalletProvider } from "../common/provider";

import EditRoyaltyModal from "./EditRoyaltyModal";
import { useTransactionHelper } from "../common/transaction_status";

import { useRecoilState } from "recoil";
import { standardErrorState } from "../common/error";

export default function EditRoyaltyButton({
    nftContract,
    id,
    currentRoyaltyPercentage,
    onUpdate,
}) {
    const [walletProvider, setWalletProvider] = useWalletProvider();
    const handleTransaction = useTransactionHelper();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [_, setStandardError] = useRecoilState(standardErrorState);

    if (
        currentRoyaltyPercentage === null ||
        currentRoyaltyPercentage === undefined
    ) {
        return <></>;
    }

    const editRoyalty = async (royaltyPercentage) => {
        if (royaltyPercentage === null) {
            setStandardError("Please enter a royalty percentage.");
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

        const effectiveRoyaltyPercentage = new Decimal(royaltyPercentage)
            .mul("100")
            .toNumber();

        if (!id || !walletProvider) return;
        // setError(null);

        const contractWithSigner = nftContract.connect(
            walletProvider.getSigner()
        );
        const transactionFunction = async () =>
            await contractWithSigner.decreaseRoyaltyNumerator(
                id,
                effectiveRoyaltyPercentage
            );

        const { success } = await handleTransaction(
            transactionFunction,
            `Edit royalty for NFT #${id}`
        );
        if (success && onUpdate) {
            onUpdate(id);
        }
    };

    return (
        <div>
            <button
                className="button is-black is-small"
                onClick={() => setEditModalOpen(true)}
            >
                Edit Royalty
            </button>
            <EditRoyaltyModal
                isOpen={editModalOpen}
                setIsOpen={setEditModalOpen}
                onClose={editRoyalty}
                currentRoyaltyPercentage={currentRoyaltyPercentage}
            />
        </div>
    );
}
