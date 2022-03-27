import React, { useEffect } from "react";

const styles = {
    modalCard: {
        maxWidth: "80vw",
    },
    modalCardTitle: {
        overflowWrap: "break-word",
        maxWidth: "70vw",
    },
};

export default function MintConfirmModal({ isOpen, setIsOpen, onClose }) {
    const closeModal = (confirmed) => {
        setIsOpen(false);
        onClose(confirmed);
    };

    if (!isOpen) return <></>;

    return (
        <div className="modal is-active">
            <div
                className="modal-background"
                onClick={() => closeModal(false)}
            />
            <div className="modal-card" style={styles.modalCard}>
                <header className="modal-card-head">
                    <p
                        className="modal-card-title"
                        style={styles.modalCardTitle}
                    >
                        Some fields are empty. Mint anyway?
                    </p>
                </header>
                <footer className="modal-card-foot">
                    <button
                        className="button is-black"
                        onClick={() => closeModal(true)}
                    >
                        Yes
                    </button>
                    <button
                        className="button is-black"
                        onClick={() => closeModal(false)}
                    >
                        No
                    </button>
                </footer>
            </div>
        </div>
    );
}
