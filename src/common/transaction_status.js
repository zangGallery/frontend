import { atom, useRecoilState } from 'recoil'

const transactionCountState = atom({
    key: 'transactionCount',
    default: 0
});

const transactionStatusState = atom({
    key: 'transactionStatus',
    default: {},
});

// Transaction status schema:
/*
{
    status: 'pending' | 'approved' | 'success' | 'error',
    name: string,
    hash: string,
    errorMessage [only if status == 'error']: string
}
*/
// Pending = not approved yet
// Approved = Approved, not inserted yet


const useTransactionStatus = () => {
    const [transactionsStatus, setTransactionsStatus] = useRecoilState(transactionStatusState);

    const updateTransactionStatus = async (transactionHash, status) => {
        setTransactionsStatus((currentTransactionStatus) => ({
            ...currentTransactionStatus,
            [transactionHash]: status,
        }));
    }

    const getTransactionStatus = (transactionHash) => {
        return transactionsStatus[transactionHash];
    }

    const getTransactions = () => {
        return transactionsStatus;
    }

    return {
        getTransactionStatus,
        transactions: transactionsStatus,
        updateTransactionStatus
    };
}

const useTransactionHelper = () => {
    const { updateTransactionStatus } = useTransactionStatus();
    const [transactionCount, setTransactionCount] = useRecoilState(transactionCountState);

    const newId = () => {
        setTransactionCount((transactionCount) => transactionCount + 1);
        return transactionCount;
    }

    const handleTransaction = async (transactionFunction, transactionName) => {
        const transactionId = newId();
        let transaction;
        try {
            updateTransactionStatus(transactionId, {
                'status': 'pending',
                'name': transactionName
            });
            transaction = await transactionFunction();
            updateTransactionStatus(transactionId, {
                'status': 'approved',
                'name': transactionName,
                'hash': transaction.hash
            });

            await transaction.wait(1);

            updateTransactionStatus(transactionId, {
                'status': 'success',
                'name': transactionName,
                'hash': transaction.hash
            });
        }
        catch (e) {
            console.log(e);
            updateTransactionStatus(transactionId, {
                'status': 'error',
                'name': transactionName,
                'hash': transaction.hash,
                'errorMessage': e.message
            });
        }
    }
    return handleTransaction;
}

export {
    useTransactionStatus,
    useTransactionHelper
}