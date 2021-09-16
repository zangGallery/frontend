import Joi from "joi";

const _customRecipient = Joi.alternatives().try(
    Joi.string().domain({ tlds: { allow: ['eth'] } }).when('useCustomRecipient', { is: true, then: Joi.required() }), // (ENS) domain
    Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).when('useCustomRecipient', { is: true, then: Joi.required() }), // Address
    Joi.string().when('useCustomRecipient', {is : true, then: Joi.valid('').forbidden(''), otherwise: Joi.string().empty('')}) // Other string (when it is not required)
)

const mint = Joi.object().keys({
    title: Joi.string().allow('').label('Title'),
    description: Joi.string().allow('').label('Description'),
    editionSize: Joi.number().precision(0).min(1).empty('').required().label('Edition size'),
    royaltyPercentage: Joi.number().precision(2).min(1).max(100).empty('').required().label('Royalty percentage'),
    useCustomRecipient: Joi.boolean().required(),
    customRecipient: _customRecipient.label('Address'),
    textType: Joi.valid('text/plain', 'text/markdown').required()
})

export default {
    mint
}