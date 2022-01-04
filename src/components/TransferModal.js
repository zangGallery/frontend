import React from "react";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi"
import ValidatedInput from "./ValidatedInput";
import { schemas } from "../common";

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
  to: '',
  amount: 1
}

export default function TransferModal ({ isOpen, setIsOpen, onClose, balance, availableAmount }) {
    const transferSchema = schemas.transfer(balance).messages({
        "number.max": `"Amount" must be at most the available balance (${availableAmount})`
    });
    const { register, formState: { isDirty, isValid, errors }, handleSubmit, watch } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(transferSchema)});
    const watchAmount = watch('amount');

    const closeModal = (data) => {
        console.log('Data: ', data);
        if (data) {
            onClose(data.to, data.amount);
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
                <p>Balance: {balance}</p>
                { balance != availableAmount ? <p>Available (not listed) balance: {availableAmount}</p> : <></> }
                <ValidatedInput label="Amount" name="amount" type="number" step="1" errors={errors} register={register} />
                <ValidatedInput label="To" name="to" type="string" errors={errors} register={register} />
                { watchAmount > availableAmount && watchAmount <= balance ? (
                    <p>
                        Warning: You only have {availableAmount} "free" (not tied to listings) token{availableAmount > 1 ? 's' : ''} to gift.
                        Proceeding will use {watchAmount - availableAmount} token{watchAmount - availableAmount > 1 ? 's' : ''} tied to existing listings,
                        making some listings unfulfillable.
                    </p>
                ) : <></>}
            </section>
            <footer className="modal-card-foot">
            <button className="button" disabled={!isValid && isDirty} onClick={handleSubmit(closeModal)}>Gift</button>
            </footer>
        </div>
        </div>
    )
}