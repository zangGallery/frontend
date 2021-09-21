import React, { useEffect } from "react";

export default function MintConfirmModal ({ isOpen, setIsOpen, onClose }) {
  const closeModal = (confirmed) => {
    setIsOpen(false);
    onClose(confirmed);
  }

  useEffect(() => {
    console.log(isOpen)
  })

  if (!isOpen) return <></>

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={() => closeModal(false)} />
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">Some fields are empty. Mint anyway?</p>
          <button className="delete" onClick={() => closeModal(false)} />
        </header>
        <footer className="modal-card-foot">
          <button className="button" onClick={() => closeModal(true)}>Yes</button>
          <button className="button" onClick={() => closeModal(false)}>No</button>
        </footer>
      </div>
    </div>
  )
}