import React from "react";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi"
import ValidatedInput from "./ValidatedInput";
import { schemas } from "../common";
import { FixedNumber } from "ethers";

const styles = {
  modalCard: {
    maxWidth: '80vw'
  },
  modalCardTitle: {
    overflowWrap: 'break-word',
    maxWidth: '70vw'
  }
}

const defaultValues = {
    amount: 1
}

export default function BuyModal ({ isOpen, setIsOpen, onClose, maxAmount, sellerBalance, price }) {
    console.log('Seller balance: ', sellerBalance);

    const { register, formState: { isDirty, isValid, errors }, handleSubmit, watch } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(schemas.buy)});

    const watchAmount = watch('amount', defaultValues.amount);

    const validAmount = () => watchAmount <= Math.min(maxAmount, sellerBalance);

    const closeModal = (data) => {
        if (data) {
            onClose(data.amount);
        }
        setIsOpen(false);
    }

    const total = () => {
        if (!watchAmount || price <= 0) {
            return undefined;
        }
        try {
            return FixedNumber.from(watchAmount).mulUnsafe(FixedNumber.from(price)).toString()
        } catch (e) {
            console.log('Error: ', e);
            return undefined;
        }
    }

    if (!isOpen) return <></>

    return (
        <div className="modal is-active">
        <div className="modal-background" onClick={() => closeModal(null, null)} />
        <div className="modal-card" style={styles.modalCard}>
            <header className="modal-card-head">
            <p className="modal-card-title" style={styles.modalCardTitle}>Buy NFT</p>
            </header>
            <section className="modal-card-body">
            <p>Listed quantity: {maxAmount}</p>
            { sellerBalance < maxAmount ? <p>Seller's balance: {sellerBalance}</p> : <></>}
            <p>Price: {price}</p>
            <ValidatedInput label="Amount" name="amount" type="number" step="1" min="1" errors={errors} register={register} />
            {
                total() && errors.amount === undefined ? (
                    <p>Total: {total()} <object className="matic-6" type="image/svg+xml" data="https://zang.gallery/matic_logo.svg" aria-label="Matic" /></p>
                ) : (
                    <p>Total: </p>
                )
            }
            { validAmount() ? <></> : <p className="notification is-danger">
                <b>Error</b>:
                { watchAmount <= maxAmount ?
                    ` Cannot buy more tokens than the seller's balance (${sellerBalance}).` :
                    ` Cannot buy more tokens than the listed amount (${maxAmount}).`
                }
                </p>
            }
            </section>
            <footer className="modal-card-foot">
            <button className="button is-black" disabled={!isValid && isDirty && validAmount()} onClick={handleSubmit(closeModal)}>Buy</button>
            </footer>
        </div>
        </div>
    )
}