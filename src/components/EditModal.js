import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Joi from "joi";
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
  amount: '',
  price: ''
}

export default function EditModal ({ isOpen, setIsOpen, onClose, balance, availableAmount, oldAmount }) {
  const effectiveAvailableAmount = Math.min(availableAmount + oldAmount, balance);

  const [editAmount, setEditAmount] = useState(false);
  const [editPrice, setEditPrice] = useState(false);

  const { register, formState: { isDirty, isValid, errors }, handleSubmit, watch } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(schemas.edit)});

  const watchAmount = watch('amount');
  const watchPrice = watch('price');

  const closeModal = (data) => {
    setIsOpen(false);
    if (data) {
      const amount = editAmount ? data.amount : null;
      const price = editPrice ? data.price : null;
      onClose(amount, price);
    }
  }

  const warningMessage = () => {
    let message = '';
    if (effectiveAvailableAmount == 0) {
        message += 'You don\'t have any "free" (not tied to listings) tokens. ';
    } else {
      message += `You only have ${effectiveAvailableAmount} "free" (not tied to listings) token${effectiveAvailableAmount == 1 ? '' : 's'}. `;
    }

    message += `Proceeding will use ${watchAmount - effectiveAvailableAmount} token${watchAmount - effectiveAvailableAmount == 1 ? '' : 's'} `
    message += 'tied to existing listings, making some listings unfulfillable.';

    return message;
  }

  const validCheckboxes = () => (editAmount || editPrice) && !(editAmount && watchAmount === '') && !(editPrice && watchPrice === '');

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
          { balance != effectiveAvailableAmount ? <p>Available (not listed) balance: {effectiveAvailableAmount}</p> : <></> }

          <div className="field">
            <label className="checkbox label">
              <input type="checkbox" checked={editAmount} className="mr-1" onChange={(e) => setEditAmount(e.target.checked)} />
              Amount
            </label>

            { editAmount ? <p> Test</p> : <p>Test 2</p>}

            { editAmount ? (

              <div className="control">
                <input className={"input" + (errors.amount ? ' is-danger' : '')} type="number" min="1" step="1" {...(register('amount'))} />
                { errors.amount ? <p className="help is-danger">{errors.amount.message}</p> : <></> }
              </div>
            ) : <></> }
          </div>

          <div className="field">
            <label className="checkbox label">
              <input type="checkbox" checked={editPrice} className="mr-1" onChange={(e) => setEditPrice(e.target.checked)} />
              Price
            </label>

            { editPrice ? (
              <div className="control">
                <input className={"input" + (errors.price ? ' is-danger' : '')} type="number" min="0" step="0.1" {...(register('price'))} />
                { errors.price ? <p className="help is-danger">{errors.price.message}</p> : <></> }
              </div>
            ) : <></> }
          </div>

          { editAmount && watchAmount > Math.min(balance, effectiveAvailableAmount) ? (
              <p>
              { watchAmount <= balance ? (
                  'Warning: ' + warningMessage()
              ) : (
                `Error: Cannot list more tokens than you own (${balance}).`
              )}
              </p>) : <></>
          }
        </section>
        <footer className="modal-card-foot">
          <button className="button" disabled={(!isValid && isDirty) || !validCheckboxes() || watchAmount > balance} onClick={handleSubmit(closeModal)}>Edit</button>
        </footer>
      </div>
    </div>
  )
}