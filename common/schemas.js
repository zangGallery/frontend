import Joi from "joi";

const mint = Joi.object().keys({
    title: Joi.string().allow(''),
    description: Joi.string().allow(''),
    editionSize: Joi.number().precision(0).min(1).empty('').required().label('Edition size'),
    royaltyPercentage: Joi.number().precision(2).min(1).max(100).empty('').required().label('Royalty percentage'),
    useCustomRecipient: Joi.boolean().required(),
    customRecipient: Joi.string(),
    textType: Joi.valid('text/plain', 'text/markdown').required()
})

export default {
    mint
}