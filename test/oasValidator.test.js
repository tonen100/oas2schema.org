const fs = require('fs');
const chai = require("chai");
const { expect } = chai;

var errors = require("../src/errors");
var oasConverter = require("../src/oasConverter");
var oasValidator = require("../src/oasValidator");

const FILES = [
    'AWSMigrationHub-oas.json',
    'AWSSecurityHub-oas.json',
];

const WRONG_FILES = [
    'WRONG-AWSMigrationHub-oas.json',
    'WRONG-AWSMigrationHub-oas-2.json',
    'WRONG-AWSSecurityHub-oas.json',
    'WRONG-AWSSecurityHub-oas-2.json',
];

function containsRefs(doc) {
    if(typeof(doc) != "object" || Object.keys(doc).length == 0)
        return false;
    else {
        for(var property of Object.keys(doc)) {
            if(property == "$ref") {
                return true;
            }    
            else if(containsRefs(doc[property]))
                return true;
        }
        return false;
    }
}

describe('OAS validator validate unit test', async () => {
    FILES.forEach(fileName => it('should validate'  + ' the OASv3 document ' + fileName, done => {
        var objDoc = oasConverter.strToObj(fs.readFileSync('./test/docs/' + fileName).toString());
        oasValidator.evaluateDocument(objDoc).then(_ => done()).catch(err => done(err));
    }));

    WRONG_FILES.forEach(fileName => it('should not validate'  + ' the OASv3 document ' + fileName, done => {
        var objDoc = oasConverter.strToObj(fs.readFileSync('./test/docs/' + fileName).toString());
        oasValidator.evaluateDocument(objDoc)
            .then(res => done(new Error('Shouldnt validate this document')))
            .catch(err => expect(err.name = 'InvalidFormat') && done());
    }));
});

describe('OAS validator parsed references unit test', doneAll => {
    FILES.forEach(fileName => it('should dereference all $refs pointers in the OASv3 document ' + fileName, done => {
        var objDoc = oasConverter.strToObj(fs.readFileSync('./test/docs/' + fileName).toString());
        expect(containsRefs(objDoc)).to.be.true;
        oasValidator.evaluateDocument(objDoc).then(docParsed => {
            expect(containsRefs(docParsed)).to.be.false;
            done();
        }).catch(err => done(err));
    }));
});