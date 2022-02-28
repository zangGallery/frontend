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
    const { register, formState: { isDirty, isValid, errors }, handleSubmit, watch } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(schemas.transfer)});
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
            <p className="modal-card-title" style={styles.modalCardTitle}>Gift NFT</p>
            </header>
            <section className="modal-card-body">
                <p>Balance: {balance}</p>
                { balance != availableAmount ? <p>Available (not listed) balance: {availableAmount}</p> : <></> }
                <ValidatedInput label="Amount" name="amount" type="number" step="1" min="1" errors={errors} register={register} />
                <ValidatedInput label="To" name="to" type="string" errors={errors} register={register} />
                { watchAmount > availableAmount && watchAmount <= balance ? (
                    <p className="notification is-warning">
                        <b>Warning</b>: You only have {availableAmount} "free" (not tied to listings) token{availableAmount == 1 ? '' : 's'}.
                        Proceeding will use {watchAmount - availableAmount} token{watchAmount - availableAmount == 1 ? '' : 's'} tied to existing listings,
                        making some listings unfulfillable.
                    </p>
                ) : <></>}
                {
                    watchAmount > balance ? (
                        <p className="notification is-error"><b>Error</b>: Cannot gift more tokens than you own ({balance})</p>
                    ) : <></>
                }
            </section>
            <footer className="modal-card-foot">
            <button className="button is-black" disabled={(!isValid && isDirty) || watchAmount > balance} onClick={handleSubmit(closeModal)}>Gift</button>
            </footer>
        </div>
        </div>
    )
}