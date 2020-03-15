'use strict';

var errors = require('./errors');
var Enforcer = require('openapi-enforcer');
const SwaggerParser = require("@apidevtools/swagger-parser");

var IRRELEVANTS_WARN_CODES = ['WPAR001']

async function evaluateDocument(document) {
    try {
        return await SwaggerParser.validate(document);
    } catch(err) {
        throw errors.get('InvalidOASDocument')(err);
    }
    // return await Enforcer(document, {
    //     fullResult: true,
    //     componentOptions: { exceptionSkipCodes:  IRRELEVANTS_WARN_CODES }
    // }).then(function ({ error, warning }) {
    //     if (!error) {
    //         console.log('No errors with your document')
    //         console.log(warning.header);
    //         console.log(Object.keys(warning.children));
    //         if (warning) console.warn(warning);
    //         return true;
    //     } else {
    //         throw errors.get('InvalidOASDocument')(error);
    //     }
    // })
}

module.exports = {
    evaluateDocument
}