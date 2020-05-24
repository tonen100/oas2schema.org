var errors = require('./errors');
const logicalParser = require('@jeanbenitez/logical-expression-parser');

/**
 * Mapper between valid OASv3 document and Schema.Org WebAPI ontology
 * @alias module:SemanticTranslator
 * @class
 */
class SemanticTranslator {
    /**
     * @access private
     */
    external_values = {};
    /**
     * Const values, externals to the OAS, that can be optionnaly specified
     * @param {string} [urlAPI] URL of the documented API
     * @param {string} [urlDoc] URL of the OAS document
     * @returns {object}
     * @access private
     */
    EXTERNAL_VALUES = (urlAPI, urlDoc) => { return {
        URL_API: urlAPI,
        URL_DOC: urlDoc
    } };

    /**
     * @summary Mappings bewteen OAS and Schema.org WebAPI ontology
     * @description <p>Define the mappings that needs to be made for the conversion from an OAS document to the WebAPI Schema.Org ontology.
     * In order to change those mappings, in futures versions, it is necessary but sufficient to change this Map Object.
     * The correspondences are defined in the following schema:
     * ['schemaOrgPath', 'oasPath']
     * </p>
     * <p>The schema.org paths consist in properties, subproperties... of the WebAPI ontology, with a dot '.' as a separator.
     * The following symbols can be used at the end of each property except the last one:</p>
     * <ul>
     * <li> [] for a list of values (con contain a number to specify a specific index, that will be considered like a simple value in that case instead of a list, but not a range)</li>
     * <li>  : followed by the name of a schema.org ontology in order to to specify the type of the ontology that contains the value that follows.</li>
     * </ul>
     * The OAS paths consist in properties, subproperties... of the OAS document, with a dot '.' as a separator.
     * The OAS paths supports logical operations:
     * <ul>
     * <li> If several OAS paths are possible for a schema.org path, the operator || can be used (takes the first non-null one).</li>
     * <li> If values of several OAS paths needs to be concatened in a specific order, the operator && can be used. Support concatenation for strings, strings and lists, lists of the same length (element-wise), lists of distincts lengths (merge lists instead))</li>
     * <li> Parenthesis can be used to isolate || operations from && operations (like in any mathematical and logical operation).</li>
     * </ul>
     * This symbol can be used at the end of each property except the last one:
     * <ul><li> [] for a list of values (can contains a number to specify a specific index, that will be considered like a simple value in that case instead of a list, but not a range)</li></ul>
     * This symbol can be used INSTEAD of a property name
     * <ul><li> {} for an object keys (property names) that will be transformed into a list (the keys can be specified within the brackets to include only the values of these keys into the list, separated with the operator |)</li></ul>
     * This symbol can be used at the end of the last property
     * <ul><li> ~ for to transform the retrieved value string into a normal sentence (replaces slashes, dots, camelCase, Snakecase...  with the required spaces)</li>
     * <li> ~U which the same but with the result uppercased </li></ul>
     * Constants names defined in EXTERNAL_VALUES can be used INSTEAD of a path
     * <p>Here are the currents mappings beeing made:</p>
     * <ul>
     * <li>['name', 'info.title']</li>
     * <li>['description', 'info.description']</li>
     * <li>['termsOfService', 'info.termsOfService']</li>
     * <li>['brand:Organization.name', 'info.contact.name']</li>
     * <li>['provider:Organization.name', 'info.contact.name']</li>
     * <li>['brand:Organization.url', 'info.contact.url']</li>
     * <li>['provider:Organization.url', 'info.contact.url']</li>
     * <li>['brand:Organization.email', 'info.contact.email']</li>
     * <li>['provider:Organization.email', 'info.contact.email']</li>
     * <li>['category', 'tags[].name~']</li>
     * <li>['url', 'URL_API || servers[].url']</li>
     * <li>['termsOfService', 'info.termsOfService']</li>
     * <li>['logo', 'x-logo.url']</li>
     * <li>['documentation', 'URL_DOC || x-documentation.url']</li>
     * <li>['offers:Offer[].name', 'x-princing[].name']</li>
     * <li>['offers:Offer[].category', 'x-princing[].type']</li>
     * <li>['offers:Offer[].price', 'x-princing[].price']</li>
     * <li>['offers:Offer[].priceCurrency', 'x-princing[].currency']</li>
     * <li>['offers:Offer[].description', 'x-princing[].description']</li>
     * <li>['availableChannel:ServiceChannel[].name', 'paths.{}~']</li>
     * <li>['availableChannel:ServiceChannel[].description', 'paths.{}.description']</li>
     * <li>['availableChannel:ServiceChannel[].disambiguatingDescription', 'paths.{}.summary']</li>
     * <li>['availableChannel:ServiceChannel[].serviceUrl', '(paths.{}.servers[0].url || servers[0].url || URL_API) && paths.{}']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.httpMethod', 'paths.{}.{get|post|put|delete|options|head|patch|trace}^U']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.name', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.operationId~']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.url', '(paths.{}.servers[0].url || servers[0].url || URL_API) && paths.{}']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.description', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.description']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.disambiguatingDescription', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.summary']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.contentType', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.requestBody.content.encoding.contentType']</li>
     * <li>['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.encodingType', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.responses.content.encoding.contentType']</li>
     * </ul>
     * @constant
     * @type {Map<string, string>}
     * @default
     * @see {@link EXTERNAL_VALUES}
     * @access public
     */
    SchemaOrg_OAS_CORRESPONDENCES = new Map([
        ['name', 'info.title'],
        ['description', 'info.description'],
        ['termsOfService', 'info.termsOfService'],
        ['brand:Organization.name', 'info.contact.name'],
        ['provider:Organization.name', 'info.contact.name'],
        ['brand:Organization.url', 'info.contact.url'],
        ['provider:Organization.url', 'info.contact.url'],
        ['brand:Organization.email', 'info.contact.email'],
        ['provider:Organization.email', 'info.contact.email'],
        ['category', 'tags[].name~'],
        ['url', 'URL_API || servers[].url'],
        ['termsOfService', 'info.termsOfService'],
        ['logo', 'info.x-logo.url'],
        ['documentation', 'URL_DOC || x-documentation-url'],
        ['offers:Offer[].name', 'x-princing[].name'],
        ['offers:Offer[].category', 'x-princing[].type'],
        ['offers:Offer[].price', 'x-princing[].price'],
        ['offers:Offer[].priceCurrency', 'x-princing[].currency'],
        ['offers:Offer[].description', 'x-princing[].description'],
        ['availableChannel:ServiceChannel[].name', 'paths.{}~'],
        ['availableChannel:ServiceChannel[].description', 'paths.{}.description'],
        ['availableChannel:ServiceChannel[].disambiguatingDescription', 'paths.{}.summary'],
        ['availableChannel:ServiceChannel[].serviceUrl', '(paths.{}.servers[0].url || servers[0].url || URL_API) && paths.{}'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.httpMethod', 'paths.{}.{get|post|put|delete|options|head|patch|trace}^U'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.name', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.operationId~'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.url', '(paths.{}.servers[0].url || servers[0].url || URL_API) && paths.{}'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.description', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.description'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.disambiguatingDescription', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.summary'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.contentType', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.requestBody.content.encoding.contentType'],
        ['availableChannel:ServiceChannel[].potentialAction:Action[].target:EntryPoint.encodingType', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.responses.content.encoding.contentType'],
    ]);

    /**
     * @summary Transform a string into a normal sentence
     * @description <p>Transform a string into a normal sentence:
     * Replaces slashes, dots, camelCase, Snakecase...  with the required spaces, and adjust lower/uppercases</p>
     * @param {string} value
     * @returns {string} The transformed string
     * @access private
     */
    normalizeString(value) {
        return value
        // Replaces file extension e by a "(e format)"
        .replace(/^\/(.*)[.]([A-z]*)$/ig, '$1 ($2 format)')
        // Removes first slash 
        .replace(/^\/(.*)$/ig, '$1')
        // Removes brackets
        .replace(/\{([A-z]*)\}/g, '$1')
        // Replaces all slashes by a space
        .replace(/\//ig, ' ')
        // Replaces all underscores by a space (for snake_case strings)
        .replace(/_/g, ' ')
        // Inserts a space before all caps (for camelCase strings)
        .replace(/([A-Z][a-z]+)/g, ' $1')
        // Lowercases all characters (for camelCase strings)
        .toLowerCase()
        // Uppercases the first character (for camelCase strings)
        .replace(/^./, function(str){ return str.toUpperCase(); })
        // Replaces all dots left by a space
        .replace(/\./ig, ' ');
    }

    /**
     * @summary Retrieve the value contained at path of anOAS document
     * @description Parse an OAS document or subdocument object to retrieve the value or a list of values contained at a specific path.
     * @param {(Object|string|string[])} oasValue The OAS document or subdocument that will be parsed
     * @param {string} oasPath The path to follow in order to parse the OAS document
     * @returns {(string|string[])} The extracted value as a string or list of strings
     * @see {@link SchemaOrg_OAS_CORRESPONDENCES}
     * @access private
     */
    extractOASValueFromProperty(oasValue, oasPath) {
        if(oasValue == null) {
            return null;
        } else if(Object.keys(this.external_values).includes(oasPath)) {
            return this.external_values[oasPath];
        } else {
            var to_normalize_value = false;
            var to_uppercase_value = false;
            const lengthPath = oasPath.split('.').length;
            //iterates on properties of the path
            for(var [index, property] of oasPath.split('.').entries()) {
                if(property.endsWith('~')) { // ~ cases
                    to_normalize_value = true;
                    property = property.slice(0, property.length - 1);
                }  else if(property.endsWith('~^U')) { // ~U cases
                    to_normalize_value = true;
                    to_uppercase_value = true;
                    property = property.slice(0, property.length - 3);
                } else if(property.endsWith('^U')) { // ~U cases
                    to_uppercase_value = true;
                    property = property.slice(0, property.length - 2);
                }
                if(property.match(/^\{.*\}$/)) { // {} and {val1|val2} cases
                    var subProperties = Object.keys(oasValue);
                    if(property.match(/^\{.+\}$/)) { // {val1|val2} cases
                        var relevantValues = property.slice(0, property.length - 1).slice(1).split('|');
                        subProperties = subProperties.filter(subProperty => relevantValues.find(relevantValue => relevantValue == subProperty))
                    }
                    if(lengthPath == index + 1) { // Last
                        oasValue = subProperties;
                    } else {
                        oasValue = subProperties.map(
                            subProperty =>  this.extractOASValueFromProperty(oasValue[subProperty], oasPath.split('.').filter((_, i) => i > index).join('.'))
                        );
                        break;
                    }
                } else { // Normal cases
                    if(property.endsWith('[]') && index + 1 < lengthPath) { // [] cases
                        property = property.slice(0, property.length - 2);
                        oasValue = oasValue[property] != null ? oasValue[property].map(
                            element =>  this.extractOASValueFromProperty(element, oasPath.split('.').filter((pathVal, i) => i > index).join('.'))
                        ) : null;
                        break;
                    } else if(property.match(/^.*\[[0-9]*\]$/)) {
                        var index = parseInt(property.replace(/^.*\[([0-9]*)\]$/, '$1'));
                        property = property.replace(/^(.*)\[[0-9]*\]$/, '$1');
                        oasValue = oasValue[property] != null ? oasValue[property][index] : null;
                    } else { // Simple property cases
                        oasValue = oasValue[property];
                    }
                }
                if(oasValue == null) {
                    break;
                } else {
                    if(to_normalize_value) {
                        switch(typeof(oasValue)) {
                            case 'object': // array
                                oasValue = oasValue.map(value => this.normalizeString(value));
                                break;
                            case 'string':
                                oasValue = this.normalizeString(oasValue);
                                break;
                        }
                    }
                    if(to_uppercase_value) {
                        switch(typeof(oasValue)) {
                            case 'object': // array
                                oasValue = oasValue.map(value => value.toUpperCase());
                                break;
                            case 'string':
                                oasValue = oasValue.toUpperCase();
                                break;
                        }
                    }
                }
                if(typeof(oasValue) == 'string') oasValue = oasValue.replace(/\n/g, ' ');
            }
            return oasValue;
        }
    }

    /**
     * @summary Parse AST of logical operations on OAS paths
     * @description Read a binary tree to apply logical operations on the OAS to schema.org mappings and return the final value.
     * @param {Object} ast The binary tree to parse (for more details see {@link https://www.npmjs.com/package/@jeanbenitez/logical-expression-parser}) 
     * @param {Object} oasDocument The OAS document that will parsed
     * @param {string} oasPath The path or a logical operation on several paths to follow in order to parse the OAS document (only usefull here for error messages)
     * @returns {(string|string[])} The extracted value as a string or list of strings
     * @throws {OASPathError} if types of the distincts extrated values that needs to be concatened are not string or string arrays
     * @access private
     */
    readAST(ast, oasDocument, oasPath) {
        switch(ast.op) {
            case 'AND': // We need to concatenate operands values
                var leftValue = this.readAST(ast.left, oasDocument, oasPath);
                var rightValue = this.readAST(ast.right, oasDocument, oasPath);
                if(typeof(leftValue) == null || typeof(rightValue) == null) return null;
                if(typeof(leftValue) == 'string') {
                    if(typeof(rightValue) == 'string') return leftValue + rightValue;
                    else if(typeof(rightValue) == 'object') return rightValue.map(right => leftValue + right);
                    else throw errors.get('IncorrectOASPathExpression')(oasPath);
                } else if(typeof(leftValue) == 'object') {
                    if(typeof(rightValue) == 'string') return leftValue.map(left => left + rightValue);
                    else if(typeof(rightValue) == 'object' && leftValue.length == rightValue.length) return leftValue.map((left, index) => left + rightValue[index]);
                    else if(typeof(rightValue) == 'object') return leftValue.concat(rightValue);
                    else throw errors.get('IncorrectOASPathExpression')(oasPath);
                } else {
                    throw errors.get('IncorrectOASPathExpression')(oasPath);
                }
            case 'OR': // We need to extracts operands values in a specific order until we found a non-null one
                leftValue = this.readAST(ast.left, oasDocument, oasPath);
                if(leftValue != null && typeof(leftValue) == 'object') {
                    return leftValue.map(val => val != null ? val : this.readAST(ast.right, oasDocument, oasPath));
                } else if(leftValue != null) {
                    return leftValue;
                } else {
                    return this.readAST(ast.right, oasDocument, oasPath)
                }
            case 'LITERAL': // Extract operand value
                return this.extractOASValueFromProperty(oasDocument, ast.literal);
        }
    }

    /**
     * @summary Extract an OAS value
     * @description Parse an OAS document or subdocument object to retrieve the value or a list of values contained at a specific path.
     * @param {(object|string|string[])} oasDocument The OAS document or subdocument that will be parsed
     * @param {string} oasPath The path or a logical operation on several paths to follow in order to parse the OAS document
     * @returns {(string|string[])} The extracted value as a string or list of strings
     * @see {@link SchemaOrg_OAS_CORRESPONDENCES}
     * @access private
     */
    extractOASvalue(oasDocument, oasPath) {
        return this.readAST(logicalParser.ast(oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR')), oasDocument, oasPath);
    }

    /**
     * @summary Retrieve the value contained at path of an OAS document
     * @description Fill a Schema.Org document or subdocument in the JSON-LD format, stored as an object with a value, according to a schema.org path
     * @param {(string|string[])} oasValue The value that needs to be inserted in the document
     * @param {object} metadata The object containing the Schema.Org document in JSON-LD format
     * @param {string} schemaOrgPath The path that will be parsed to know where to put the oasValue
     * @returns {(string|string[])} The Schema.Org document filled with the value
     * @throws {OASPathError} if type of the value is not the one expected for this property
     * @see {@link SchemaOrg_OAS_CORRESPONDENCES}
     * @access private
     */
    fillSchemaOrgProperty(oasValue, metadata, schemaOrgPath) {
        var subSchemaMetadata = metadata;
        if(oasValue != null) {
            const lengthPath = schemaOrgPath.split('.').length;
            for(var [index, property] of schemaOrgPath.split('.').entries()) {
                var [ nameProperty, type ] = property.split(':');
                if(property.endsWith('[]') && index + 1 < lengthPath) { // [] cases
                    type = type.slice(0, type.length - 2);
                    if(subSchemaMetadata[nameProperty] == null) {
                        subSchemaMetadata[nameProperty] = oasValue.map(value => { return {
                            "@type": type,
                        } });
                    }
                    subSchemaMetadata[nameProperty] = subSchemaMetadata[nameProperty].map((val, iProperty) =>
                        this.fillSchemaOrgProperty(
                            typeof(oasValue) == 'object' ? oasValue[iProperty] : oasValue,
                            val,
                            schemaOrgPath.split('.').filter((pathVal, i) => i > index).join('.')
                        )
                    );
                    return metadata;
                } else if(property.match(/^.*\[[0-9]*\]$/) && index + 1 < lengthPath) {
                    var indexArray = parseInt(property.replace(/^.*\[([0-9]*)\]$/, '$1'));
                    type = type != null ? type.replace(/^(.*)\[[0-9]*\]$/, '$1') : null;
                    if(type != null) {
                        if(subSchemaMetadata[nameProperty] == null) {
                            if(indexArray == 0) {
                                subSchemaMetadata[nameProperty] = [{
                                    "@type": type
                                }];
                            } else throw errors.get('IncorrectSchemaOrgPathExpression');
                        }
                        if(subSchemaMetadata[nameProperty][indexArray] == null) throw errors.get('IncorrectSchemaOrgPathExpression');
                        subSchemaMetadata = subSchemaMetadata[nameProperty][indexArray];
                    } else {
                        subSchemaMetadata[nameProperty] = oasValue;
                    }
                } else { // Simple property cases
                    if(type != null) {
                        if(subSchemaMetadata[nameProperty] == null) {
                            subSchemaMetadata[nameProperty] = {
                                "@type": type
                            }
                        }
                        subSchemaMetadata = subSchemaMetadata[nameProperty];
                    } else {
                        subSchemaMetadata[nameProperty] = typeof(oasValue) == 'object' && oasValue.length == 1 ? oasValue[0] : oasValue;
                    }
                }
            }
        }
        return metadata;
    }

    /**
     * @summary Generate Schema.Org WepAPI instance in JSON-LD from OAS document
     * @description Generate a Schema.Org document in a JSON-LD format containing an instance of the WebAPI ontology using a valid OAS document according to the mappings declared in this file
     * @param {(object|string|string[])} oasDocument The full OAS document that will be parsed
     * @param {string} [urlAPI] URL of the documented API (entry point root)
     * @param {string} [urlDoc] URL of the OAS document
     * @returns  {(string|string[])} The full Schema.Org document
     * @see {@link SchemaOrg_OAS_CORRESPONDENCES}
     * @access public
     */
    extractMetadata(oasDocument, urlAPI, urlDoc) {
        var oasValue;
        var metadata = {
            "@context": "http://schema.org",
            "@type": "WebAPI"
        };
        this.external_values = this.EXTERNAL_VALUES(urlAPI, urlDoc);
        this.SchemaOrg_OAS_CORRESPONDENCES.forEach((oasPath, schemaOrgPath) => {
            oasValue = this.extractOASvalue(oasDocument, oasPath);
            metadata = this.fillSchemaOrgProperty(oasValue, metadata, schemaOrgPath);
        
        });
        return metadata;
    }
}

module.exports = new SemanticTranslator()