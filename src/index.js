'use strict';

const fs = require('fs');

var errors = require('./errors');
var documentationConverter = require("./converter");

async function convertToMetadata(apiDocumentation, inputFormat = null, outputFormat = "JSON-LD") {
    if(inputFormat == null)
        inputFormat = documentationConverter.extractFormat(apiDocumentation);
    else if(typeof(apiDocumentation) != 'object')
        throw errors.get('InvalidInputDocument');
    apiDocumentation = await documentationConverter.convertToOASv3(apiDocumentation, inputFormat);
    return apiDocumentation;
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