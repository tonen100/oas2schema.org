'use strict';

var errors = require('./errors');
var oasConverter = require("./oasConverter");
var oasValidator = require("./oasValidator");
var semanticTranslator = require("./semanticTranslator");

/**
 * @summary Generate Schema.Org WebAPI instance in JSON-LD from a RESTfull API documentation 
 * @description Generate Schema.Org WebAPI instance in JSON-LD from a RESTfull API documentation following these steps:
 * <ul>
 * <li>If there is no input format specified, try to detect it (not 100% guaranteed to succeed, although it should normally work in every standard cases)</li>
 * <li>Convert the API documentation in OASv3</li>
 * <li>Parse and check validty of the retrieved OASv3 document, resolving referencies if needeed</li>
 * <li>Map values between the OAS document and the WebAPI</li>
 * </ul>
 * @param {(Object|string)} apiDocumentation The documentation of the API in Swagger (OASv2), OASv3, RAML, or API Blueprint format
 * @param {('OASv2'|'OASv3'|'RAMLv1'|'Blueprint')} [inputFormat] The format of the API (If you specify it, make sure it's the right one). Can be either "OASv2", "OASv3", "RAMLv1" or "Blueprint"
 * @param {(Object)} apiDocumentation Particular behavior o optional extern values to add to the metadata
 * @returns {Object} The generate Schema.Org WebAPI instance in JSON-LD format
 * @see {@link module:SemanticTranslator#SchemaOrg_OAS_CORRESPONDENCES}
 * @throws {InvalidFormatError} if it has trouble detecting the format, if the format isn't supported or if the document in itself is somewhat invalid
 * @throws {OASPathError} if it has trouble extracting value. It can either be an internal error, or an invalidity in data types of the values extracted in the API documentation, that somehow made it through the validation
 * @alias convertToMetadata
 * @access public
 */
async function convertToMetadata(apiDocumentation, inputFormat = null, options = {}) {
    if(inputFormat == null)
        inputFormat = oasConverter.extractFormat(apiDocumentation);
    else if(typeof(apiDocumentation) != 'object' && typeof(apiDocumentation) != 'string')
        throw errors.get('InvalidInputDocument');
    var oasDocumentation = await oasConverter.convertToOASv3(apiDocumentation, inputFormat);
    var metadata = semanticTranslator.extractMetadata(await oasValidator.evaluateDocument(oasDocumentation), options.urlAPI, options.urlDoc);
    return metadata;
}

/**
 * @module
 */
module.exports = {
    /**
     * @type convertToMetadata
     * @access public
     */
    convertToMetadata,
    /**
     * @access private
     */
    oasConverter,
    /**
     * @access private
     */
    oasValidator,
    /**
     * @access private
     */
    semanticTranslator,
}