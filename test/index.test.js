const fs = require('fs');
const chai = require("chai");
const { expect } = chai;

var generator = require('../src/oasConverter');
var generator = require('../src/index');

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

describe('generate metadata', () => {
    FORMATS_FILES.forEach((_, fileName) => it('should generate the right metadata for file ' + fileName, done => {
        generator.convertToMetadata(fs.readFileSync('./test/docs/' + fileName).toString()).then(res => {
            expect(JSON.stringify(res, null, '\t')).to.eql(fs.readFileSync('./test/metadata/' + fileName.slice(0, fileName.lastIndexOf('.')) + '.json').toString());
            done();
        }). catch(err => done(err));
    }));
});
