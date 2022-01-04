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

    if (!isOpen) return <></>

    return (
        <div className="modal is-active">
        <div className="modal-background" onClick={() => closeModal(null, null)} />
        <div className="modal-card" style={styles.modalCard}>
            <header className="modal-card-head">
            <p className="modal-card-title" style={styles.modalCardTitle}>List</p>
            </header>
            <section className="modal-card-body">
            <p>Listed quantity: {maxAmount}</p>
            { sellerBalance < maxAmount ? <p>Seller's balance: {sellerBalance}</p> : <></>}
            <p>Price: {price}</p>
            <ValidatedInput label="Amount" name="amount" type="number" step="1" errors={errors} register={register} />
            <p>Total: { watchAmount && price && price > 0 ? FixedNumber.from(watchAmount).mulUnsafe(FixedNumber.from(price)).toString() : '0' } ETH</p>
            { validAmount() ? <></> : <p>
                Error:
                { watchAmount < maxAmount ? 
                    `Cannot buy more tokens than the seller's balance (${sellerBalance})` : 
                    `Cannot buy more tokens than the listed amount (${maxAmount})`
                }
                </p>
            }
            </section>
            <footer className="modal-card-foot">
            <button className="button" disabled={!isValid && isDirty && validAmount()} onClick={handleSubmit(closeModal)}>Buy</button>
            </footer>
        </div>
        </div>
    )
}