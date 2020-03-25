const fs = require('fs');
const chai = require("chai");
const { expect } = chai;

var oasConverter = require("../src/oasConverter");
var oasValidator = require("../src/oasValidator");

const FORMATS_FILES = new Map([
    ['twitter-swagger.json', 'OASv2'],
    ['twitter-swagger.yaml', 'OASv2'],
    ['adafruit-swagger.yaml', 'OASv2'],
    ['AWSMigrationHub-oas.json', 'OASv3'],
    ['AWSSecurityHub-oas.json', 'OASv3'],
    ['twitter-raml.yaml', 'RAMLv1'],
    ['type-example-complex-raml.yaml', 'RAMLv1'],
    ['alpha-blueprint.md', 'Blueprint'],
    ['gist-fox-blueprint.md', 'Blueprint'],
    ['polls-hypermedia-blueprint.md', 'Blueprint']
]);

describe('OAS converter extract format unit test', doneAll => {
    FORMATS_FILES.forEach((format, fileName) => it('should detect ' + format + ' format of ' + fileName, () => {
        var extractedFormat = oasConverter.extractFormat(fs.readFileSync('./test/docs/' + fileName).toString());
        expect(extractedFormat).to.eql(format);
    }));
});

describe('OAS converter convert to OASv3 unit test', doneAll => {
    FORMATS_FILES.forEach((format, fileName) => it('should convert ' + fileName + ' to valid OASv3 document', done => {
        oasConverter.convertToOASv3(fs.readFileSync('./test/docs/' + fileName).toString(), format).then(oasDoc => {
            expect(oasConverter.extractFormat(oasDoc)).to.eql('OASv3');
            oasValidator.evaluateDocument(oasDoc)
                .then(parsedDoc => done())
                .catch(err => done(err));
        }).catch(err => { done(err); });

    }));
});
