'use strict';

var errors = require('./errors');
const SwaggerParser = require("@apidevtools/swagger-parser");

/**
 * OAS validator and parser
 * @class
 */
class OASValidator {
    /**
     * @summary Parse and check and OAS document
     * @description Parse an OAS document stored as an object and check his validity (resolves any types of referencies in the document, like "$ref" por example)
     * @param {object} document The document to parse and check
     * @returns The parsed document
     * @throws {InvalidFormatError} if the parser detects error in the document
     */
    async evaluateDocument(document) {
        try {
            return await SwaggerParser.validate(document);
        } catch(err) {
            throw errors.get('InvalidOASDocument')(err);
        }
    }
}

module.exports = new OASValidator();