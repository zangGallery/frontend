import React from "react";

export default function ValidatedInput(props) {
    const relevantProps = { ...props };
    delete relevantProps.label;
    delete relevantProps.name;
    delete relevantProps.errors;
    delete relevantProps.register;

    const error = props.errors[props.name];

    return (
        <div className="field">
            <label className="label">{props.label}</label>
            <div className="control">
                <input
                    className={"input" + (error ? " is-danger" : "")}
                    {...relevantProps}
                    {...props.register(props.name)}
                />
            </div>
            {error ? <p className="help is-danger">{error.message}</p> : <></>}
        </div>
    );
}
