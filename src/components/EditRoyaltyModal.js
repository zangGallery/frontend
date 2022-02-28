import React, { useEffect } from "react";
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
  royaltyPercentage: 1
}

export default function EditRoyaltyModal ({ isOpen, setIsOpen, onClose, currentRoyaltyPercentage }) {
    const { register, formState: { isDirty, isValid, errors }, handleSubmit, setValue, watch } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(schemas.editRoyalty)});
    const watchRoyaltyPercentage = watch('royaltyPercentage');

    useEffect(() => {
        setValue('royaltyPercentage', currentRoyaltyPercentage - 0.01);
    }, [currentRoyaltyPercentage]);

    const closeModal = (data) => {
        if (data) {
            onClose(data.royaltyPercentage);
        }
        setIsOpen(false);
    }

    if (!isOpen) return <></>

    return (
        <div className="modal is-active">
        <div className="modal-background" onClick={() => closeModal(null, null)} />
        <div className="modal-card" style={styles.modalCard}>
            <header className="modal-card-head">
            <p className="modal-card-title" style={styles.modalCardTitle}>Edit Royalty Percentage</p>
            </header>
            <section className="modal-card-body">
                <p>Current royalty percentage: {currentRoyaltyPercentage.toFixed(2)}%</p>
                <ValidatedInput label="Royalty percentage" name="royaltyPercentage" type="number" defaultValue={currentRoyaltyPercentage - 0.01} min="0" max={currentRoyaltyPercentage - 0.01} step="0.01" errors={errors} register={register} />
                { watchRoyaltyPercentage >= currentRoyaltyPercentage ? (
                    <p className="notification is-danger">
                        <b>Error</b>: The royalty percentage can only be decreased.
                    </p>
                ) : <></>}
            </section>
            <footer className="modal-card-foot">
            <button className="button" disabled={(!isValid && isDirty) || watchRoyaltyPercentage >= currentRoyaltyPercentage} onClick={handleSubmit(closeModal)}>Edit Royalty</button>
            </footer>
        </div>
        </div>
    )
}