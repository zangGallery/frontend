import React from "react";
import { ethers } from "ethers";
import { v1 } from "../common/abi";
import config from "../config";
import { useWalletProvider } from "../common/provider";
import { useRecoilState } from "recoil";
import { standardErrorState } from "../common/error";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { useTransactionHelper } from "../common/transaction_status";

export default function DelistButton({ nftId, listingId, onUpdate }) {
    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const marketplaceABI = v1.marketplace;

    const [walletProvider, setWalletProvider] = useWalletProvider();
    const [_, setStandardError] = useRecoilState(standardErrorState);

    const handleTransaction = useTransactionHelper();

    const delist = async () => {
        if (!nftId) {
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
            await contractWithSigner.delistToken(nftId, listingId);

        const { success } = await handleTransaction(
            transactionFunction,
            `Delist NFT #${nftId}`
        );
        if (success && onUpdate) {
            onUpdate(nftId);
        }
    };

    return (
        <button className="button is-black is-small" onClick={() => delist()}>
            Delist
        </button>
    );
}
