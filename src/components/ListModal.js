import React, { useEffect, useState } from "react";

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

  const closeModal = (amount, price) => {
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
          <div className="field">
            <label className="label">Amount</label>
            <div className="control">
              <input className="input" type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">Price</label>
            <div className="control">
              <input className="input" type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
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