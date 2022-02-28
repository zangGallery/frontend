import { atom, useRecoilState } from 'recoil'

const transactionCountState = atom({
    key: 'transactionCount',
    default: 0
});

const transactionStatusState = atom({
    key: 'transactionStatus',
    default: {},
});

const transactionListenersState = atom({
    key: 'transactionListeners',
    default: []
});

// Transaction status schema:
/*
{
    status: 'pending' | 'approved' | 'success' | 'error',
    name: string,
    content [optional]: any,
    url [optional]: string,
    hash: string,
    errorMessage [only if status == 'error']: string
}
*/
// Pending = not approved yet
// Approved = Approved, not inserted yet


const useTransactionStatus = () => {
    const [transactionsStatus, setTransactionsStatus] = useRecoilState(transactionStatusState);

    const [transactionListeners, setTransactionListeners] = useRecoilState(transactionListenersState);

    const register = (listener) => {
        setTransactionListeners((transactionListeners) => {
            if (transactionListeners.includes(listener)) {
                return transactionListeners;
            }
            return [...transactionListeners, listener];
        });
    }

    const updateTransactionStatus = async (transactionId, status) => {
        setTransactionsStatus((currentTransactionStatus) => ({
            ...currentTransactionStatus,
            [transactionId]: status,
        }));

        for (const listener of transactionListeners) {
            listener(transactionId, status);
        }
    }

    const getTransactionStatus = (transactionId) => {
        return transactionsStatus[transactionId];
    }

    const getTransactions = () => {
        return transactionsStatus;
    }

    return {
        getTransactionStatus,
        transactions: transactionsStatus,
        updateTransactionStatus,
        register
    };
}

const useTransactionHelper = () => {
    const { updateTransactionStatus } = useTransactionStatus();
    const [transactionCount, setTransactionCount] = useRecoilState(transactionCountState);

    const newId = () => {
        setTransactionCount((transactionCount) => transactionCount + 1);
        return transactionCount;
    }

    const handleTransaction = async (transactionFunction, transactionName, contentFunction, rethrow) => {
        const transactionId = newId();
        let transaction;
        try {
            updateTransactionStatus(transactionId, {
                status: 'pending',
                name: transactionName,
                content: contentFunction ? await contentFunction('pending') : null
            });
            transaction = await transactionFunction();
            updateTransactionStatus(transactionId, {
                status: 'approved',
                name: transactionName,
                hash: transaction.hash,
                content: contentFunction ? await contentFunction('approved', transaction) : null
            });

            const receipt = await transaction.wait(1);

            updateTransactionStatus(transactionId, {
                status: 'success',
                name: transactionName,
                hash: transaction.hash,
                content: contentFunction ? await contentFunction('success', transaction, true, receipt) : null
            });

            return {
                transaction,
                receipt,
                success: true
            };
        }
        catch (e) {
            console.log(e);
            updateTransactionStatus(transactionId, {
                'status': 'error',
                'name': transactionName,
                'hash': transaction?.hash,
                'errorMessage': e.message,
                content: contentFunction ? await contentFunction('success', transaction, false) : null
            });
            
            if (rethrow) {
                throw e;
            }

            return {
                error: e,
                success: false
            }
        }
    }
    return handleTransaction;
}

export {
    useTransactionStatus,
    useTransactionHelper
}