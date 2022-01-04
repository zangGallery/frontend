import React from "react";
import { useForm } from "react-hook-form";
import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi"
import ValidatedInput from "./ValidatedInput";

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
  amount: 1,
  price: '0.1' // Important: this is a string, not a number. That's because Ether prices are strings
}

const etherValidator = (label) => (value, helpers) => {
  const joiSchema = Joi.number().positive().unsafe(true).label(label);

  try {
    Joi.assert(value, joiSchema);
  } catch (e) {
    return helpers.message(e.details[0].message);
  }

  // Check the precision
  if (value.includes('.')) {
    const digitCount = value.split('.')[1].length;
    if (digitCount > 18) {
      return helpers.message(`"${label}" must have at most 18 decimal places after the decimal point`);
    }
  }

  if (value.endsWith('.')) {
    return value.splice(-1);
  }

  return value;
}

export default function ListModal ({ isOpen, setIsOpen, onClose, balance, availableAmount }) {
  const schema = Joi.object().keys({
    amount: Joi.number().required().min(1).max(availableAmount).label('Amount').messages({
      "number.max": `"Amount" must be at most the available balance (${availableAmount})`
    }),
    price: Joi.string().custom(etherValidator('Price')).required().label('Price')
  })

  const { register, formState: { isDirty, isValid, errors }, handleSubmit } = useForm({ defaultValues, mode: 'onChange', resolver: joiResolver(schema)});

  const closeModal = ({amount, price}) => {
    setIsOpen(false);
    onClose(amount, price);
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
          <ValidatedInput label="Price" name="price" type="number" step="0.1" errors={errors} register={register} />
        </section>
        <footer className="modal-card-foot">
          <button className="button" disabled={!isValid && isDirty} onClick={handleSubmit(closeModal)}>List</button>
        </footer>
      </div>
    </div>
  )
}