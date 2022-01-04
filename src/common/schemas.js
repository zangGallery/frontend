import Joi from "joi";

const _alwaysInvalid = (value, helpers) => {
    helpers.error('any.only')
}

const _customRecipient = Joi.alternatives().try(
    Joi.string().domain({ tlds: { allow: ['eth'] } }).when('useCustomRecipient', { is: true, then: Joi.required() }), // (ENS) domain
    Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).when('useCustomRecipient', { is: true, then: Joi.required() }), // Address
    Joi.string().when('useCustomRecipient', {is : true, then: Joi.custom(_alwaysInvalid), otherwise: Joi.string().empty('')}) // Other string (when it is not required)
)

const maxDigits = (max) => (value, helpers) => {
    const convertedValue = helpers.original + '';
    if (convertedValue.includes('.')) {
        const digitCount = convertedValue.split('.')[1].length;
        if (digitCount > max) {
            return helpers.error('number.precision', { limit: max})
        }
    }

    return value;
}

const mint = Joi.object().keys({
    title: Joi.string().allow('').label('Title'),
    description: Joi.string().allow('').label('Description'),
    editionSize: Joi.number().integer().min(1).empty('').required().label('Edition size'),
    royaltyPercentage: Joi.number().custom(maxDigits(2)).min(0).max(100).empty('').required().label('Royalty percentage'),
    useCustomRecipient: Joi.boolean().required(),
    customRecipient: _customRecipient.label('Address'),
    textType: Joi.valid('text/plain', 'text/markdown').required()
})

const transfer = (max) => Joi.object().keys({
    to: _customRecipient.label('Address'),
    amount: Joi.number().integer().min(1).max(max).empty('').required().label('Amount')
})

const buy = (max) => Joi.object().keys({
    amount: Joi.number().integer().min(1).max(max).empty('').required().label('Amount')
})

export default {
    buy,
    mint,
    transfer
}