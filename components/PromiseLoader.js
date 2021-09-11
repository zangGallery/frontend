import { useEffect, useState } from "react";

export default function PromiseLoader({ promise, render, loading, error, deps }) {
    const [state, setState] = useState({ status: 'promised'})

    useEffect(() => {
        promise()
            .then((result) => setState({ status: 'loaded', result: result }))
            .catch((error) => setState({ status: 'error', error: error }))
    }, deps)

    switch(state.status) {
        case 'loaded': {
            return render(state.result);
        }
        case 'promised': {
            return loading || null;
        }
        case 'error' : {
            return error(state.error)
        }
    }
    return null;
}