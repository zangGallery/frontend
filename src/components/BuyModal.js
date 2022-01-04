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

export default function TransferModal ({ isOpen, setIsOpen, onClose, maxAmount, fulfillability, price }) {
    const buySchema = schemas.buy(Math.min(maxAmount, fulfillability)).messages({
        "number.max": `"Amount" must be at most the ${fulfillability == maxAmount ? 'listed' : 'fulfillable'} amount (${maxAmount})`
    })

    const { register, formState: { isDirty, isValid, errors }, handleSubmit, watch } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(buySchema)});

    const watchAmount = watch('amount', defaultValues.amount);

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
            { fulfillability != maxAmount ? <p>Fulfillable quantity: {fulfillability}</p> : <></>}
            <p>Price: {price}</p>
            <ValidatedInput label="Amount" name="amount" type="number" step="1" errors={errors} register={register} />
            <p>Total: { FixedNumber.from(watchAmount).mulUnsafe(FixedNumber.from(price)).toString() } ETH</p>
            </section>
            <footer className="modal-card-foot">
            <button className="button" disabled={!isValid && isDirty} onClick={handleSubmit(closeModal)}>List</button>
            </footer>
        </div>
        </div>
    )
}