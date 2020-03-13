'use strict';

const fs = require('fs');
const jsyaml = require('js-yaml');

var errors = require('./errors');
var documentationConverter = require("./converter");

function strToObj(str) {
    try {
        return JSON.parse(str);
    } catch(err) {
        try {
            if(err == "SyntaxError") {
                return jsyaml.safeLoad(str);
            } else {
                throw errors.get('UnknownInputFormat');
            }
        } catch(err2) {
            console.log(err)
            throw errors.get('UnknownInputFormat');
        }
    }
}

async function convertToMetadata(apiDocumentation, inputFormat = null, outputFormat = "JSON-LD") {
    if(inputFormat == null)
        inputFormat = documentationConverter.extractFormat(apiDocumentation);
    if(typeof(apiDocumentation) == 'string') {
        if(inputFormat != "RAMLv1" && inputFormat != "Blueprint")
            apiDocumentation = strToObj(apiDocumentation);
    }
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
        convertToMetadata(fs.readFileSync(fileName).toString('utf-8'), inputFormat).then(
            res => console.log(res),
            (err) => console.log(err)
        );
    default:
}