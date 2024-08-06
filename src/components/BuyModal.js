import React from "react";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import ValidatedInput from "./ValidatedInput";
import { schemas } from "../common";
import { FixedNumber, ethers } from "ethers";
import { useWalletProvider } from "../common/provider";
import { useRecoilState } from "recoil";
import { tokenAllowancesState } from "../common/user";
import config from "../config";
import { useTransactionHelper } from "../common/transaction_status";
import { parseTokenAmount } from "../common/utils";

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
};

export default function BuyModal({
    nftId,
    isOpen,
    setIsOpen,
    onClose,
    maxAmount,
    sellerBalance,
    price,
    paymentToken,
    onUpdate,
}) {
    const [walletProvider, setWalletProvider] = useWalletProvider();
    const [tokenAllowances, setTokenAllowances] =
        useRecoilState(tokenAllowancesState);
    const handleTransaction = useTransactionHelper();

    const allowance = tokenAllowances[paymentToken];

    const {
        register,
        formState: { isDirty, isValid, errors },
        handleSubmit,
        watch,
    } = useForm({
        defaultValues,
        mode: "onChange",
        resolver: joiResolver(schemas.buy),
    });

    const watchAmount = watch("amount", defaultValues.amount);

    const validAmount = () => watchAmount <= Math.min(maxAmount, sellerBalance);

    const closeModal = (data) => {
        if (data) {
            onClose(data.amount);
        }
        setIsOpen(false);
    };

    const total = () => {
        if (!watchAmount || price <= 0) {
            return undefined;
        }
        try {
            return FixedNumber.from(watchAmount)
                .mulUnsafe(FixedNumber.from(price))
                .toString();
        } catch (e) {
            console.log("Error: ", e);
            return undefined;
        }
    };

    async function approve() {
        const tokenContract = new ethers.Contract(
            config.tokens[paymentToken].address,
            ["function approve(address,uint256)"],
            walletProvider
        );

        async function doApproval() {
            return await tokenContract
                .connect(walletProvider.getSigner())
                .approve(
                    config.contractAddresses.v1.marketplace,
                    parseTokenAmount(total(), paymentToken)
                );
        }

        console.log("Approving...");

        const { success } = await handleTransaction(
            doApproval,
            `Approve ${total()} ${config.tokens[paymentToken].symbol}`
        );
        if (success && onUpdate) {
            onUpdate(nftId);
        }
    }

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
                        Buy NFT
                    </p>
                </header>
                <section className="modal-card-body">
                    <p>Listed quantity: {maxAmount}</p>
                    {sellerBalance < maxAmount ? (
                        <p>Seller's balance: {sellerBalance}</p>
                    ) : (
                        <></>
                    )}
                    <p>Price: {price}</p>
                    <ValidatedInput
                        label="Amount"
                        name="amount"
                        type="number"
                        step="1"
                        min="1"
                        errors={errors}
                        register={register}
                    />
                    {total() && errors.amount === undefined ? (
                        <p>
                            Total: {total()}{" "}
                            <object
                                className="matic-6"
                                type="image/svg+xml"
                                data="https://zang.gallery/matic_logo.svg"
                                aria-label="Matic"
                            />
                        </p>
                    ) : (
                        <p>Total: </p>
                    )}
                    {validAmount() ? (
                        <></>
                    ) : (
                        <p className="notification is-danger">
                            <b>Error</b>:
                            {watchAmount <= maxAmount
                                ? ` Cannot buy more tokens than the seller's balance (${sellerBalance}).`
                                : ` Cannot buy more tokens than the listed amount (${maxAmount}).`}
                        </p>
                    )}
                </section>
                <footer className="modal-card-foot">
                    {allowance &&
                    allowance.gte(parseTokenAmount(total(), paymentToken)) ? (
                        <button
                            className="button is-black"
                            disabled={(!isValid && isDirty) || !validAmount()}
                            onClick={handleSubmit(closeModal)}
                        >
                            Buy
                        </button>
                    ) : (
                        <button
                            className="button is-black"
                            disabled={(!isValid && isDirty) || !validAmount()}
                            onClick={approve}
                        >
                            Approve {total()}{" "}
                            {config.tokens[paymentToken].symbol}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
