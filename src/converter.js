var swagger2openapi = require('swagger2openapi');
var oas_raml_converter = require('oas-raml-converter');
var raml2openapi = new oas_raml_converter.Converter(oas_raml_converter.Formats.RAML, oas_raml_converter.Formats.OAS30);
var apib2swagger = require('apib2swagger');

var errors = require('./errors');

const SUPPORTED_FORMATS = ['OASv2', 'OASv3', 'RAMLv1', 'Blueprint']

function extractFormat() {
    //OASv2
    //throw errors.get('UnknownInputFormat');
}

async function convertToOASv3(documentation, inputFormat) {
    switch(inputFormat) {
        case 'OASv2':
            return await swagger2openapi.convertObj(documentation, {patch: true}).then(
                (res) => res.openapi,
                (_) => { throw errors.get('InvalidInputDocument') }
                );
        case 'OASv3':
            return documentation;
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
    convertToOASv3
}