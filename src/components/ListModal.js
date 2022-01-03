import { FixedNumber } from "@ethersproject/bignumber";
import React, { useState } from "react";

const styles = {
  modalCard: {
    maxWidth: '80vw'
  },
  modalCardTitle: {
    overflowWrap: 'break-word',
    maxWidth: '70vw'
  }
}

export default function ListModal ({ isOpen, setIsOpen, onClose }) {
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);
  const [previousPrice, setPreviousPrice] = useState('');

  const closeModal = (amount, price) => {
    setIsOpen(false);
    onClose(amount, price);
  }

  const formatPrice = (value) => {
    const originalValue = value;

    if (value === '') {
      return '';
    }
    console.log('Original value:', value)

    if (value.startsWith('-') || value.endsWith('-') || value.startsWith('+') || value.endsWith('+')) {
      return previousPrice;
    }

    let trailingDot = false;

    if (value.endsWith('.')) {
      value = value.slice(0, -1);
      trailingDot = true;
    }
    console.log('Corrected value:', value)

    try {
      
      let newPrice = FixedNumber.from(value, 'ufixed').toString()

      if (newPrice.endsWith('.0') && !originalValue.endsWith('.0')) {
        if (trailingDot) {
          newPrice = newPrice.slice(0, -1);
        } else {
          newPrice = newPrice.slice(0, -2);
        }
      }

      setPreviousPrice(newPrice);

      return newPrice;
    } catch (e) {
      console.log(e)
      return previousPrice
    }
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
          <div className="field">
            <label className="label">Amount</label>
            <div className="control">
              <input className="input" type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">Price</label>
            <div className="control">
              <input className="input" type="number" placeholder="Price" step='0.01' value={price} onChange={e => setPrice(formatPrice(e.target.value))} />
            </div>
          </div>
        </section>
        <footer className="modal-card-foot">
          <button className="button" onClick={() => closeModal(amount, price)}>List</button>
        </footer>
      </div>
    </div>
  )
}