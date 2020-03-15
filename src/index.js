'use strict';

const fs = require('fs');

var errors = require('./errors');
var oasConverter = require("./oasConverter");
var oasValidator = require("./oasValidator");
var semanticTranslator = require("./semanticTranslator");

async function convertToMetadata(apiDocumentation, inputFormat = null, outputFormat = "JSON-LD") {
    if(inputFormat == null)
        inputFormat = oasConverter.extractFormat(apiDocumentation);
    else if(typeof(apiDocumentation) != 'object')
        throw errors.get('InvalidInputDocument');
    var oasDocumentation = await oasConverter.convertToOASv3(apiDocumentation, inputFormat);
    var metadata = semanticTranslator.extractMetadata(await oasValidator.evaluateDocument(oasDocumentation));
    return metadata;
}

module.exports = {
    convertToMetadata
}

switch(process.argv.length) {
    case 3:
    case 4:
        var fileName = process.argv[2];
        var inputFormat = process.argv.length == 4 ? process.argv[3] : null;
        convertToMetadata(fs.readFileSync(fileName).toString(), inputFormat).then(
            res => console.log(res),
            (err) => console.log(err)
        );
    default:
}