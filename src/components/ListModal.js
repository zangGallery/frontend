import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";
import ValidatedInput from "./ValidatedInput";
import { schemas } from "../common";
import { useReadProvider, useWalletProvider } from "../common/provider";
import { useTransactionHelper } from "../common/transaction_status";
import { useRecoilState } from "recoil";
import { formatError, standardErrorState } from "../common/error";
import { ethers } from "ethers";
import { v1 } from "../common/abi";
import config from "../config";

const styles = {
    modalCard: {
        maxWidth: "80vw",
    },
    modalCardTitle: {
        overflowWrap: "break-word",
        maxWidth: "70vw",
    },
};

const defaultValues = {
    amount: 1,
    price: "0.1", // Important: this is a string, not a number. That's because Ether prices are strings
};

const etherValidator = (label) => (value, helpers) => {
    const joiSchema = Joi.number().positive().unsafe(true).label(label);

    try {
        Joi.assert(value, joiSchema);
    } catch (e) {
        return helpers.message(e.details[0].message);
    }

    // Check the precision
    if (value.includes(".")) {
        const digitCount = value.split(".")[1].length;
        if (digitCount > 18) {
            return helpers.message(
                `"${label}" must have at most 18 decimal places after the decimal point`
            );
        }
    }

    if (value.endsWith(".")) {
        return value.splice(-1);
    }

    return value;
};

export default function ListModal({
    isOpen,
    setIsOpen,
    onClose,
    balance,
    availableAmount,
    id,
    walletAddress,
    onUpdate,
}) {
    const zangAddress = config.contractAddresses.v1.zang;
    const zangABI = v1.zang;

    const marketplaceAddress = config.contractAddresses.v1.marketplace;
    const {
        register,
        formState: { isDirty, isValid, errors },
        handleSubmit,
        watch,
    } = useForm({
        defaultValues,
        mode: "onChange",
        resolver: joiResolver(schemas.list),
    });

    const watchAmount = watch("amount");

    const closeModal = (data) => {
        setIsOpen(false);
        if (data) {
            onClose(data.amount, data.price);
        }
    };

    const warningMessage = () => {
        let message = "";
        if (availableAmount == 0) {
            message +=
                'You don\'t have any "free" (not tied to listings) tokens. ';
        } else {
            message += `You only have ${availableAmount} "free" (not tied to listings) token${
                availableAmount == 1 ? "" : "s"
            }. `;
        }

        message += `Proceeding will use ${watchAmount - availableAmount} token${
            watchAmount - availableAmount == 1 ? "" : "s"
        } `;
        message +=
            "tied to existing listings, making some listings unfulfillable.";

        return message;
    };

    const handleTransaction = useTransactionHelper();
    const [_, setStandardError] = useRecoilState(standardErrorState);
    const [isApproved, setIsApproved] = useState(false);
    const [walletProvider, setWalletProvider] = useWalletProvider();

    const approveMarketplace = async () => {
        if (!walletProvider) {
            setStandardError("No wallet provider.");
            return;
        }
        if (!id) {
            setStandardError("No id specified.");
            return;
        }

        const contract = new ethers.Contract(
            zangAddress,
            zangABI,
            walletProvider
        );
        const contractWithSigner = contract.connect(walletProvider.getSigner());
        const transactionFunction = async () =>
            await contractWithSigner.setApprovalForAll(
                marketplaceAddress,
                true
            );

        const { success } = await handleTransaction(
            transactionFunction,
            "Approve Marketplace"
        );

        if (success) {
            setIsApproved(true);
            if (onUpdate) {
                onUpdate(id);
            }
        }
    };
    const checkApproval = async () => {
        if (!id || !walletAddress) return;

        const zangContract = new ethers.Contract(
            zangAddress,
            zangABI,
            walletProvider
        );

        try {
            const approved = await zangContract.isApprovedForAll(
                walletAddress,
                marketplaceAddress
            );
            setIsApproved(approved);
        } catch (e) {
            setStandardError(formatError(e));
        }
    };

    useEffect(checkApproval, [id, walletAddress]);

    if (!isOpen) return <></>;

    return (
        <div className="modal is-active">
            <div
                className="modal-background"
                onClick={() => closeModal(null, null)}
            />
            <div className="modal-card" style={styles.modalCard}>
                <header className="modal-card-head">
                    <p
                        className="modal-card-title"
                        style={styles.modalCardTitle}
                    >
                        List NFT
                    </p>
                </header>
                <section className="modal-card-body">
                    <p>Balance: {balance}</p>
                    {balance != availableAmount ? (
                        <p>Available (not listed) balance: {availableAmount}</p>
                    ) : (
                        <></>
                    )}
                    <ValidatedInput
                        label="Amount"
                        name="amount"
                        type="number"
                        step="1"
                        min="1"
                        errors={errors}
                        register={register}
                    />
                    <ValidatedInput
                        label="Price (MATIC)"
                        name="price"
                        type="number"
                        step="0.1"
                        min="0"
                        errors={errors}
                        register={register}
                    />

                    {watchAmount > Math.min(balance, availableAmount) ? (
                        watchAmount <= balance ? (
                            <p className="notification is-warning">
                                <b>Warning</b>: {warningMessage()}
                            </p>
                        ) : (
                            <p className="notification is-danger">
                                <b>Error</b>: Cannot list more tokens than you
                                own ({balance}).
                            </p>
                        )
                    ) : (
                        <></>
                    )}
                </section>
                <footer className="modal-card-foot">
                    {!isApproved ? (
                        <button
                            className="button is-black"
                            onClick={approveMarketplace}
                        >
                            Approve Marketplace
                        </button>
                    ) : (
                        <button
                            className="button is-black"
                            disabled={
                                (!isValid && isDirty) || watchAmount > balance
                            }
                            onClick={handleSubmit(closeModal)}
                        >
                            List
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
