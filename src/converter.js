var swagger2openapi = require('swagger2openapi');
var oas_raml_converter = require('oas-raml-converter');
var raml2openapi = new oas_raml_converter.Converter(oas_raml_converter.Formats.RAML, oas_raml_converter.Formats.OAS30);
var apib2swagger = require('apib2swagger');
const jsyaml = require('js-yaml');

var errors = require('./errors');

const SUPPORTED_FORMATS_REGEX = new Map([
    ['OASv2', /[\"|\']?swagger[\"|\']?[ |\t|\n]*:[ |\t|\n]*[\"|\']?2(\.[0-9])?[\"|\']?/],
    ['OASv3', /[\"|\']?openapi[\"|\']?[ |\t|\n]*:[ |\t|\n]*[\"|\']?3(\.[0-9])?(\.[0-9])?[\"|\']?/],
    ['RAMLv1', /#%RAML[ |\t|\n]*1(\.[0-9])?/],
    [ 'Blueprint', /FORMAT[ |\t]*:[ |\t]1A/]
]);

function extractFormat(documentation) {
    switch(typeof(documentation)) {
        case 'object':
            documentation = JSON.stringify(documentation);
        case 'string':
            for(let regex of SUPPORTED_FORMATS_REGEX.entries()) {
                if(documentation.match(regex[1])) {
                    return regex[0];
                }
            }
            throw errors.get('UnknownInputFormat');
        default:
            throw errors.get('UnsupportedInputFileType');
    }
}


function strToObj(str) {
    try {
        return JSON.parse(str);
    } catch(err) {
        try {
            return jsyaml.safeLoad(str);
        } catch(err2) {
            throw errors.get('UnknownInputFormat');
        }
    }
}

async function convertToOASv3(documentation, inputFormat) {
    switch(inputFormat) {
        case 'OASv2':
            if(typeof(documentation) == 'string')
                documentation = strToObj(documentation);
            return await swagger2openapi.convertObj(documentation, {patch: true}).then(
                (res) => res.openapi,
                (_) => { throw errors.get('InvalidInputDocument') }
                );
        case 'OASv3':
            return typeof(documentation) == 'string' ? strToObj(documentation) : documentation;
        case 'RAMLv1':
            try {
                return await raml2openapi.convertData(documentation);
            } catch(err) {
                throw errors.get('InvalidInputDocument');
            }
        case 'Blueprint':
            return await apib2swagger.convert(
                documentation,
                { preferReference: true, bearerAsApikey: false },
                async (error, result) => {
                    if (error) throw errors.get('InvalidInputDocument');
                    else return await convertToOASv3(result.swagger, "OASv2");
                }
            );
        default:
            throw errors.get('UnsupportedInputFormat')(inputFormat);      
    }
}

module.exports = {
    extractFormat,
    convertToOASv3
}