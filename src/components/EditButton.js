import React from "react";
import { useState } from "react";
import config from "../config";
import { ethers } from "ethers";
import { v1 } from "../common/abi";

import { useWalletProvider } from "../common/provider";

import EditModal from "./EditModal";

import { useTransactionHelper } from "../common/transaction_status";

import { useRecoilState } from "recoil";
import { standardErrorState } from "../common/error";
import { formatTokenAmount, parseTokenAmount } from "../common/utils";

export default function EditButton({
    nftContract,
    nftId,
    listingId,
    availableAmount,
    balance,
    onUpdate,
    oldAmount,
}) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();

    const handleTransaction = useTransactionHelper();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const edit = async (newAmount, newPrice) => {
        if (newAmount === null && newPrice === null) {
            setStandardError("Please enter an amount or a price.");
            return;
        }

        if (!nftId) {
            setStandardError("Could not determine the ID of the NFT.");
            return;
        }
        if (!walletProvider) {
            setStandardError("Please connect a wallet.");
            return;
        }

        setStandardError(null);

        const marketplaceContract = new ethers.Contract(
            marketplaceAddress,
            marketplaceABI,
            walletProvider
        );

        const listingInfo = await marketplaceContract.getListing(
            nftContract.address,
            nftId,
            listingId
        );

        const paymentToken = listingInfo.paymentToken;

        if (newPrice === null) {
            newPrice = formatTokenAmount(
                listingInfo.price,
                listingInfo.paymentToken
            );
        }

        const contractWithSigner = marketplaceContract.connect(
            walletProvider.getSigner()
        );

        // If we update the amount, we do not want the amount to change in the middle of the transaction
        const expectedAmount = newAmount === null ? -1 : oldAmount;

        if (newAmount === null) {
            newAmount = -1;
        }

        async function edit() {
            return await contractWithSigner.editListing(
                nftContract.address,
                nftId,
                listingId,
                parseTokenAmount(newPrice, paymentToken).toString(),
                newAmount,
                expectedAmount
            );
        }

        const { success } = await handleTransaction(
            edit,
            `Edit listing for NFT #${nftId}`
        );
        if (success && onUpdate) {
            onUpdate(nftId);
        }
    };

    return (
        <div>
            <button
                style={{ width: "7ch" }}
                className="button is-black is-small mr-1"
                onClick={() => setEditModalOpen(true)}
            >
                Edit
            </button>
            <EditModal
                isOpen={editModalOpen}
                setIsOpen={setEditModalOpen}
                onClose={edit}
                balance={balance}
                availableAmount={availableAmount}
                oldAmount={oldAmount}
            />
        </div>
    );
}
