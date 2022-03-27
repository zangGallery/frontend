import React, { useEffect } from "react";
import { useTransactionStatus } from "../common/transaction_status";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import config from "../config";
import ViewOnExplorer from "./ViewOnExplorer";

export default function TransactionNotifications() {
    const { register } = useTransactionStatus();

    const createNotification = (transactionId) => {
        toast.loading(<></>, {
            autoClose: false,
            draggable: false,
            pauseOnHover: false,
            progress: undefined,
            closeButton: (
                <p>
                    <span onClick={() => toast.dismiss(transactionId)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </span>
                </p>
            ),
            position: "bottom-right",
            returns: false,
            toastId: transactionId,
        });
    };

    const maybeCreate = (transactionId) => {
        if (!toast.isActive(transactionId)) {
            createNotification(transactionId);
        }
    };

    const onTransaction = (transactionId, status) => {
        const defaultTitle = (
            <h1 className="is-size-5 has-text-black">{status.name}</h1>
        );
        const viewOnExplorer = status.hash ? (
            <p>
                <ViewOnExplorer hash={status.hash} />
            </p>
        ) : (
            <></>
        );

        maybeCreate(transactionId);

        if (status.status === "pending") {
            toast.update(transactionId, {
                render: (
                    <div>
                        {defaultTitle}
                        {status.content || <p>Waiting for approval</p>}
                    </div>
                ),
            });
        } else if (status.status === "approved") {
            toast.update(transactionId, {
                render: (
                    <div>
                        {defaultTitle}
                        {status.content || (
                            <div>
                                <p>Transaction approved</p>
                                {viewOnExplorer}
                            </div>
                        )}
                    </div>
                ),
            });
        } else if (status.status === "success") {
            toast.update(transactionId, {
                render: (
                    <div>
                        {defaultTitle}
                        {status.content || (
                            <div>
                                <p>Transaction mined</p>
                                {viewOnExplorer}
                            </div>
                        )}
                    </div>
                ),
                type: "success",
                isLoading: false,
            });
        } else if (status.status === "error") {
            toast.update(transactionId, {
                render: (
                    <div>
                        {defaultTitle}
                        {status.content || (
                            <div>
                                <p>Transaction failed</p>
                                <p>{status.errorMessage}</p>
                                {viewOnExplorer}
                            </div>
                        )}
                    </div>
                ),
                type: "error",
                isLoading: false,
            });
        }
    };

    useEffect(() => {
        register(onTransaction);
    }, []);

    return (
        <ToastContainer
            position="top-right"
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
    );
}
