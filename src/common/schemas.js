import Joi from "joi";
import { defaultSchema as rehypeDefaultSchema } from "rehype-sanitize";

const ensDomain = Joi.string().domain({ tlds: { allow: ['eth'] } });
const ethAddress = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/);

const validateCustomRecipient = (value, helpers) => {
    if (!value) {
        return helpers.error('any.required');
    }
    if (value.includes('.eth')) {
        const ensValidation = ensDomain.validate(value);
        if(ensValidation.error) {
            return helpers.error('custom.address');
        }
    } else {
        const ethValidation = ethAddress.validate(value);
        if(ethValidation.error) {
            return helpers.error('custom.address');
        }
    }
    return value;
}

const _customRecipient = Joi.when('useCustomRecipient',
    {
        is: true,
        then: Joi.string().custom(validateCustomRecipient),
        otherwise: Joi.string().empty('')
    }
).messages({
    'custom.address': '"Address" must be a valid Ethereum name or address'
})

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

const etherValidator = (label) => (value, helpers) => {
    const joiSchema = Joi.number().positive().unsafe(true).label(label);
  
    try {
        Joi.assert(value, joiSchema);
    } catch (e) {
        return helpers.message(e.details[0].message);
    }
  
    // Check the precision
    if (value.includes('.')) {
        const digitCount = value.split('.')[1].length;
        if (digitCount > 18) {
            return helpers.message(`"${label}" must have at most 18 decimal places after the decimal point`);
        }
    }
  
    if (value.endsWith('.')) {
        return value.splice(-1);
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

const transfer = Joi.object().keys({
    to: _customRecipient.label('Address'),
    amount: Joi.number().integer().min(1).empty('').required().label('Amount')
})

const buy = Joi.object().keys({
    amount: Joi.number().integer().min(1).empty('').required().label('Amount')
})

const edit = Joi.object().keys({
    amount: Joi.number().min(1).empty('').label('Amount'),
    price: Joi.string().custom(etherValidator('Price')).empty('').label('Price')
})

const list = Joi.object().keys({
    amount: Joi.number().min(1).empty('').required().label('Amount'),
    price: Joi.string().custom(etherValidator('Price')).empty('').required().label('Price')
})

const burn = Joi.object().keys({
    amount: Joi.number().integer().min(1).empty('').required().label('Amount')
})

const editRoyalty = Joi.object().keys({
    royaltyPercentage: Joi.number().custom(maxDigits(2)).min(0).max(100).empty('').required().label('Royalty percentage'),
})

const validMarkdown = {
    ...rehypeDefaultSchema,
    protocols: {
        ...rehypeDefaultSchema.protocols,
        src: [
            ...rehypeDefaultSchema.protocols.src,
            'data'
        ]
    }
};

export default {
    burn,
    buy,
    edit,
    editRoyalty,
    list,
    validMarkdown,
    mint,
    transfer
}