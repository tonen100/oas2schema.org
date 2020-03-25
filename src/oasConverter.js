var swagger2openapi = require('swagger2openapi');
var oas_raml_converter = require('oas-raml-converter');
var raml2openapi = new oas_raml_converter.Converter(oas_raml_converter.Formats.RAML, oas_raml_converter.Formats.OAS20);
var apib2swagger = require('apib2swagger');
const jsyaml = require('js-yaml');

var errors = require('./errors');

/**
 * Converter used to convert from either Swagger (OASv2), RAML or API Blueprint to OASv3
 * @class 
 */
class OASConverter {

    /**
     * The supported formats associated with the regexes that can identify each from a string containing documents in those formats
     * @access private
     */
    SUPPORTED_FORMATS_REGEX = new Map([
        ['OASv2', /[\"|\']?swagger[\"|\']?[ |\t|\n]*:[ |\t|\n]*[\"|\']?2(\.[0-9])?[\"|\']?/],
        ['OASv3', /[\"|\']?openapi[\"|\']?[ |\t|\n]*:[ |\t|\n]*[\"|\']?3(\.[0-9])?(\.[0-9])?[\"|\']?/],
        ['RAMLv1', /#%RAML[ |\t|\n]*1(\.[0-9])?/],
        ['Blueprint', /FORMAT[ |\t]*:[ |\t]1A/]
    ]);
    
    /**
     * @summary Identify the format of a document
     * @description Identify the format of a document. Supported formats are Swagger (OASv2), OASv3, RAML and API Blueprint.
     * @param {(Object|string)} documentation The document to identify the forma
     * @throws {InvalidFormatError} if the format is not supported or if it fail to identify the format
     */
    extractFormat(documentation) {
        switch(typeof(documentation)) {
            case 'object':
                documentation = JSON.stringify(documentation);
            case 'string':
                for(let regex of this.SUPPORTED_FORMATS_REGEX.entries()) {
                    if(documentation.match(regex[1])) {
                        return regex[0];
                    }
                }
                throw errors.get('UnknownInputFormat');
            default:
                throw errors.get('UnsupportedInputFileType');
        }
    }
    
    /**
     * @summary JSON or YAML string to object
     * @description Convert a string containing a JSON or YAML document to an object
     * @param {*} str
     * @access private 
     */
    strToObj(str) {
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
    
    /**
     * @description Convert a Swagger (OASv2), OASv3, RAML or API Blueprint document in a string or and object to an OASv3 object
     * @param {(Object|string)} documentation 
     * @param {string} inputFormat 
     * @access public
     */
    async convertToOASv3(documentation, inputFormat) {
        switch(inputFormat) {
            case 'OASv2':
                if(typeof(documentation) == 'string')
                    documentation = this.strToObj(documentation);
                return await swagger2openapi.convertObj(documentation, {patch: true}).then(
                    (res) => res.openapi,
                    (_) => { throw errors.get('InvalidInputDocument') }
                    );
            case 'OASv3':
                return typeof(documentation) == 'string' ? this.strToObj(documentation) : documentation;
            case 'RAMLv1':
                try {
                    return await raml2openapi.convertData(documentation).then(res => this.convertToOASv3(res, "OASv2"));
                } catch(err) {
                    console.log(err);
                    throw errors.get('InvalidInputDocument');
                }
            case 'Blueprint':
                return await apib2swagger.convert(
                    documentation,
                    { preferReference: true, bearerAsApikey: false },
                    async (error, result) => {
                        if (error) throw errors.get('InvalidInputDocument');
                        else return await this.convertToOASv3(result.swagger, "OASv2");
                    }
                );
            default:
                throw errors.get('UnsupportedInputFormat')(inputFormat);      
        }
    }
}

module.exports = new OASConverter();