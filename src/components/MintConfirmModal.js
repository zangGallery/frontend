import React from "react";
import Modal from 'react-modal';

export default function MintConfirmModal ({ isOpen, setIsOpen, onClose }) {
  const closeModal = (confirmed) => {
    setIsOpen(false);
    onClose(confirmed);
  }

  return (
    <div>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => closeModal(false)}
        contentLabel="Empty fields"
        className="modal"
      >
        <div className="modal-content">
          <h2>Some fields are empty. Mint anyway?</h2>
          <button className="" onClick={() => closeModal(true)}>Yes</button>
          <button className="" onClick={() => closeModal(false)}>No</button>
        </div>
      </Modal>
    </div>
  )
}