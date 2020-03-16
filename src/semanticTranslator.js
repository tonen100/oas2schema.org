var errors = require('./errors');
const logicalParser = require('@jeanbenitez/logical-expression-parser');

var external_values = {};
const EXTERNAL_VALUES = (urlAPI, urlDoc) => { return {
    URL_API: urlAPI,
    URL_DOC: urlDoc
} };

// [] list of values
// {} object keys as list (properties names)
// ~ Normalize string (de-CamelCase...)
// :OntologyType specify the type of the declared ontology
const SchemaOrg_OAS_CORRESPONDENCES = new Map([
    ['title', 'info.title'],
    ['description', 'info.description'],
    ['termsOfService', 'info.termsOfService'],
    ['brand:Organisation.name', 'info.contact.name'],
    ['provider:Organisation.name', 'info.contact.name'],
    ['brand:Organisation.url', 'info.contact.url'],
    ['provider:Organisation.url', 'info.contact.url'],
    ['brand:Organisation.email', 'info.contact.email'],
    ['provider:Organisation.email', 'info.contact.email'],
    ['category', 'tags[].name~'],
    ['documentation', 'URL_DOC'],
    ['termsOfService', 'info.termsOfService'],
    ['availableChannel:ServiceChannel[].name', 'paths.{}~'],
    ['availableChannel:ServiceChannel[].description', 'paths.{}.description'],
    ['availableChannel:ServiceChannel[].disambiguatingDescription', 'paths.{}.summary'],
    ['availableChannel:ServiceChannel[].serviceUrl', '(paths.{}.servers[0].url || servers[0].url || URL_API) && paths.{}'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].httpMethod', 'paths.{}.{get|post|put|delete|options|head|patch|trace}'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].name', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.operationId~'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].url', '(paths.{}.servers[0].url || servers[0].url || URL_API) && paths.{}'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].description', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.description'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].disambiguatingDescription', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.summary'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].contentType', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.requestBody.content.encoding.contentType'],
    ['availableChannel:ServiceChannel[].providesService:EntryPoint[].encodingType', 'paths.{}.{get|post|put|delete|options|head|patch|trace}.responses.content.encoding.contentType'],
])

function normalizeString(value) {
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
    .replace(/([A-Z])/g, ' $1')
    // Lowercases all characters (for camelCase strings)
    .toLowerCase()
    // Uppercases the first character (for camelCase strings)
    .replace(/^./, function(str){ return str.toUpperCase(); })
    // Replaces all dots left by a space
    .replace(/\./ig, ' ');
}

function extractOASValueFromProperty(oasValue, oasPath) {
    if(oasValue == null) {
        return null;
    } else if(Object.keys(external_values).includes(oasPath)) {
        return external_values[oasPath];
    } else {
        var to_normalize_value = false;
        const lengthPath = oasPath.split('.').length;
        for(var [index, property] of oasPath.split('.').entries()) {
            if(property.endsWith('~')) { // ~ cases
                to_normalize_value = true;
                property = property.slice(0, property.length - 1);
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
                        subProperty =>  extractOASValueFromProperty(oasValue[subProperty], oasPath.split('.').filter((_, i) => i > index).join('.'))
                    );
                    break;
                }
            } else { // Normal cases
                if(property.endsWith('[]') && index + 1 < lengthPath) { // [] cases
                    property = property.slice(0, property.length - 2);
                    oasValue = oasValue[property] != null ? oasValue[property].map(
                        element =>  extractOASValueFromProperty(element, oasPath.split('.').filter((pathVal, i) => i > index).join('.'))
                    ) : null;
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
            } else if(to_normalize_value) {
                switch(typeof(oasValue)) {
                    case 'object': // array
                        oasValue = oasValue.map(value => normalizeString(value));
                        break;
                    case 'string':
                        oasValue = normalizeString(oasValue);
                        break;
                    //default:
                        //throw errorURL_API
                }
            }
            if(typeof(oasValue) == 'string') oasValue = oasValue.replace(/\n/g, ' ');
        }
        return oasValue;
    }
}

function readAST(ast, oasDocument, oasPath) {
    switch(ast.op) {
        case 'AND':
            leftValue = readAST(ast.left, oasDocument, oasPath);
            rightValue = readAST(ast.right, oasDocument, oasPath);
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
        case 'OR':
            leftValue = readAST(ast.left, oasDocument, oasPath);
            if(leftValue != null && typeof(leftValue) == 'object') {
                return leftValue.map(val => val != null ? val : readAST(ast.right, oasDocument, oasPath));
            } else if(leftValue != null) {
                return leftValue;
            } else {
                return readAST(ast.right, oasDocument, oasPath)
            }
        case 'LITERAL':
            return extractOASValueFromProperty(oasDocument, ast.literal);
    }
}

function extractOASvalue(oasDocument, oasPath) {
    return readAST(logicalParser.ast(oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR')), oasDocument, oasPath);
}

function fillSchemaOrgProperty(oasValue, metadata, schemaOrgPath) {
    var subSchemaMetadata = metadata;
    if(oasValue != null) {
        const lengthPath = schemaOrgPath.split('.').length;
        for(var [index, property] of schemaOrgPath.split('.').entries()) {
            [ nameProperty, type ] = property.split(':');
            if(property.endsWith('[]') && index + 1 < lengthPath) { // [] cases
                type = type.slice(0, type.length - 2);
                if(subSchemaMetadata[nameProperty] == null) {
                    subSchemaMetadata[nameProperty] = oasValue.map(value => { return {
                        "@type": type,
                    } });
                }
                subSchemaMetadata[nameProperty] = subSchemaMetadata[nameProperty].map((val, iProperty) =>
                    fillSchemaOrgProperty(
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

function extractMetadata(oasDocument, urlAPI, urlDoc) {
    var metadata = {
        "@context": "http://schema.org",
        "@type": "WebAPI"
    };
    external_values = EXTERNAL_VALUES(urlAPI, urlDoc);
    SchemaOrg_OAS_CORRESPONDENCES.forEach((oasPath, schemaOrgPath) => {
        oasValue = extractOASvalue(oasDocument, oasPath);
        metadata = fillSchemaOrgProperty(oasValue, metadata, schemaOrgPath);
       
    });
    //console.log(metadata);
    //metadata = clearNullValues(metadata)
    return metadata;
}

module.exports = {
    extractMetadata
}