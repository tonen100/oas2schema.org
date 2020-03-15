var external_values = {};
const EXTERNAL_VALUES = (urlAPI, urlDoc) => { return {
    URL_API: urlAPI,
    URL_DOC: urlDoc
} };

const OAS_SchemaOrg_CORRESPONDENCES = new Map([
    ['info.title', 'title'],
    ['info.description', 'description'],
    ['info.termsOfService', 'termsOfService'],
    ['info.contact.name', 'brand:Organisation.name'],
    ['info.contact.name', 'provider:Organisation.name'],
    ['info.contact.url', 'brand:Organisation.url'],
    ['info.contact.url', 'provider:Organisation.url'],
    ['info.contact.email', 'brand:Organisation.email'],
    ['info.contact.email', 'provider:Organisation.email'],
    ['tags[].name~', 'category[]'],
    ['URL_DOC', 'documentation'],
    ['info.termsOfService', 'termsOfService'],
    ['paths.{}~', 'availableChannel:ServiceChannel[].name'],
    ['paths.{}.description', 'availableChannel:ServiceChannel[].description'],
    ['paths.{}.summary', 'availableChannel:ServiceChannel[].disambiguatingDescription'],
    //['(||servers[].url||_URL_API)&&paths.{}', 'availableChannel:ServiceChannel[].serviceUrl[]'],
    ['paths.{}.{get|post|put|delete|options|head|patch|trace}', 'availableChannel:ServiceChannel[].providesService:EntryPoint[].httpMethod'],
    ['paths.{}.{get|post|put|delete|options|head|patch|trace}.operationId~', 'availableChannel:ServiceChannel[].providesService:EntryPoint[].name'],
    ['paths.{}.{get|post|put|delete|options|head|patch|trace}.description', 'availableChannel:ServiceChannel[].providesService:EntryPoint[].description'],
    ['paths.{}.{get|post|put|delete|options|head|patch|trace}.summary', 'availableChannel:ServiceChannel[].providesService:EntryPoint[].disambiguatingDescription'],
    ['paths.{}.{get|post|put|delete|options|head|patch|trace}.requestBody.content.encoding.contentType', 'availableChannel:ServiceChannel[].providesService:EntryPoint[].contentType'],
    ['paths.{}.{get|post|put|delete|options|head|patch|trace}.responses.content.encoding.contentType', 'availableChannel:ServiceChannel[].providesService:EntryPoint[].encodingType'],
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

// [] list of values
// {} object keys as list (properties names)
// ~ Normalize string (de-CamelCase...)
// :OntologyType specify the type of the declared ontology
function extractOASvalue(oasDocument, oasPath) {
    if(oasDocument == null) {
        return null;
    } else if(Object.keys(external_values).includes(oasPath)) {
        return external_values[property];
    } else {
        var oasValue = oasDocument;
        var to_normalize_value = false;
        const lengthPath = oasPath.split('.').length;
        for(var [index, property] of oasPath.split('.').entries()) {
            if(property.endsWith('~')) { // ~ cases
                to_normalize_value = true;
                property = property.slice(0, property.length - 1);
            }
            if(property.match(/^\{.*\}$/)) { // {} and {val1|val2} cases
                var subProperties = Object.keys(oasValue);
                if(property.match(/^\{.+\}$/)) {
                    var relevantValues = property.slice(0, property.length - 1).slice(1).split('|');
                    subProperties.filter(subProperty => relevantValues.find(relevantValue => relevantValue == subProperty))
                }
                if(lengthPath == index + 1) { // Last
                    oasValue = subProperties;
                } else {
                    oasValue = Object.keys(oasValue).map(
                        subProperty =>  extractOASvalue(oasValue[subProperty], oasPath.split('.').filter((_, i) => i > index).join('.'))
                    );
                    break;
                }
            } else { // Normal cases
                if(property.endsWith('[]') && index + 1 < lengthPath) { // [] cases
                    property = property.slice(0, property.length - 2);
                    oasValue = oasValue[property] != null ? oasValue[property].map(
                        element =>  extractOASvalue(element, oasPath.split('.').filter((pathVal, i) => i > index).join('.'))
                    ) : null;
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
                        //throw error
                }
            }
        }
        return oasValue;
    }
}

function extractMetadata(oasDocument, urlAPI, urlDoc) {
    var metadata = {};
    external_values = EXTERNAL_VALUES(urlAPI, urlDoc);
    OAS_SchemaOrg_CORRESPONDENCES.forEach((schemOrgPath, oasPath) => {
        oasValue = extractOASvalue(oasDocument, oasPath);
        //console.log(oasValue);
        //fillSchemaOrgProperty(oasValue, metadata, schemOrgPath);
    });
    return true;
}

module.exports = {
    extractMetadata
}