const fs = require('fs');
const chai = require("chai");
const { expect } = chai;
const logicalParser = require('@jeanbenitez/logical-expression-parser');

var semanticTranslator = require("../src/semanticTranslator");

var RAWSTRINGS_NORMSTRINGS = new Map([
    ['createRawWebhookFeedData', 'Create raw webhook feed data'],
    ['findings/import', 'Findings import'],
    ['/direct_messages/destroy.json', 'Direct messages destroy (json format)'],
    ['/users/suggestions/{slug}/members.json', 'Users suggestions slug members (json format)'],
    ['accounts.update_profile_background_image', 'Accounts update profile background image']
])
var oasDoc = {
    "prop1": {
        "val1": "ab",
        "val2": "cd",
        "val3": [
            "ef",
            "gh",
            "ij"
        ]
    }, "prop2": {
        "val4": "kl",
        "val5": [{
            "subVal":"mn",
        }, {
            "subVal":"op",
        }, {
            "subVal": "qr"
        }],
        "val6":[
            "st",
            "uv"
        ],
        "prop3": {
            "val7": "wx",
            "val8": "yz",
            "val9": "/alpha/betaGamma_delta"
        }
    }, "prop4": {
        "prop5": {
            "val": "epsilon"
        }, "prop6": {
            "val": "zeta"
        }, "prop7": {
            "val": "eta"
        }
    }
};

describe('normalizeString function', () => {
    RAWSTRINGS_NORMSTRINGS.forEach((normalizedString, rawString) => {
        it('should normalize correctry the string ' + rawString, () => expect(semanticTranslator.normalizeString(rawString)).to.eql(normalizedString));
    });
});

describe('extractOASValueFromProperty function', () => {
    var oasPath1 = 'prop1.val1';
    it('should read the oasPath ' + oasPath1 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath1);
        expect(result).to.eql(oasDoc.prop1.val1);
    });
    var oasPath2 = 'prop1.val3[1]';
    it('should read the oasPath ' + oasPath2 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath2);
        expect(result).to.eql(oasDoc.prop1.val3[1]);
    });
    var oasPath3 = 'prop2.val5[].subVal';
    it('should read the oasPath ' + oasPath3 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath3);
        expect(result).to.eql([
            oasDoc.prop2.val5[0].subVal,
            oasDoc.prop2.val5[1].subVal,
            oasDoc.prop2.val5[2].subVal
        ]);
    });
    var oasPath4 = 'prop2.prop3.{}';
    it('should read the oasPath ' + oasPath4 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath4);
        expect(result).to.eql([
            "val7",
            "val8",
            "val9"
        ]);
    });
    var oasPath5 = 'prop4.{prop5|prop6|prop8}';
    it('should read the oasPath ' + oasPath5 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath5);
        expect(result).to.eql([
            "prop5",
            "prop6",
        ]);
    });
    var oasPath6 = 'prop4.{}.val';
    it('should read the oasPath ' + oasPath5 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath6);
        expect(result).to.eql([
            oasDoc.prop4.prop5.val,
            oasDoc.prop4.prop6.val,
            oasDoc.prop4.prop7.val
        ]);
    });
    var oasPath7 = 'prop2.prop3.val9~';
    it('should read the oasPath ' + oasPath6 + ' properly', () => {
        var result = semanticTranslator.extractOASValueFromProperty(oasDoc, oasPath7);
        expect(result).to.eql(semanticTranslator.normalizeString(oasDoc.prop2.prop3.val9))
    });
});

describe('readAST function', () => {
    var oasPath = '(prop1.val2 || prop1.val3)';
    parsedPath1 = oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR');
    it('should read the oasPath ' + oasPath + ' properly', () => {
        var result = semanticTranslator.readAST(logicalParser.ast(parsedPath1), oasDoc, oasPath);
        expect(result).to.eql(oasDoc.prop1.val2);
    });
    oasPath = '(prop1.val0 || prop2.val4)';
    var parsedPath2 = oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR');
    it('should read the oasPath ' + oasPath + ' properly', () => {
        var result = semanticTranslator.readAST(logicalParser.ast(parsedPath2), oasDoc, oasPath);
        expect(result).to.eql(oasDoc.prop2.val4);
    });
    oasPath = '(prop1.val2 || prop1.val3) && prop1.val3';
    var parsedPath3 = oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR');
    it('should read the oasPath ' + oasPath + ' properly', () => {
        var result = semanticTranslator.readAST(logicalParser.ast(parsedPath3), oasDoc, oasPath);
        expect(result).to.eql([
            oasDoc.prop1.val2 + oasDoc.prop1.val3[0],
            oasDoc.prop1.val2 + oasDoc.prop1.val3[1],
            oasDoc.prop1.val2 + oasDoc.prop1.val3[2],
        ]);
    });
    oasPath = 'prop1.val3 && (prop1.val0 || prop1.val3)';
    var parsedPath4 = oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR');
    it('should read the oasPath ' + oasPath + ' properly', () => {
        var result = semanticTranslator.readAST(logicalParser.ast(parsedPath4), oasDoc, oasPath);
        expect(result).to.eql([
            oasDoc.prop1.val3[0] + oasDoc.prop1.val3[0],
            oasDoc.prop1.val3[1] + oasDoc.prop1.val3[1],
            oasDoc.prop1.val3[2] + oasDoc.prop1.val3[2],
        ]);
    });
    oasPath = 'prop1.val1 && prop1.val2';
    var parsedPath5 = oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR');
    it('should read the oasPath ' + oasPath + ' properly', () => {
        var result = semanticTranslator.readAST(logicalParser.ast(parsedPath5), oasDoc, oasPath);
        expect(result).to.eql(oasDoc.prop1.val1 + oasDoc.prop1.val2)
    });
    oasPath = 'prop1.val1 && prop1.val3 && (prop1.val0 || prop2.val6)';
    var parsedPath6 = oasPath.replace(/\&\&/g, 'AND').replace(/\|\|/g, 'OR');
    it('should read the oasPath ' + oasPath + ' properly', () => {
        var result = semanticTranslator.readAST(logicalParser.ast(parsedPath6), oasDoc, oasPath);
        expect(result).to.eql([
            oasDoc.prop1.val1 + oasDoc.prop1.val3[0],
            oasDoc.prop1.val1 + oasDoc.prop1.val3[1],
            oasDoc.prop1.val1 + oasDoc.prop1.val3[2],
            oasDoc.prop1.val1 + oasDoc.prop2.val6[0],
            oasDoc.prop1.val1 + oasDoc.prop2.val6[1]
        ]);
    });
});

describe('fillSchemaOrgProperty function', () => {
    var oasPath1 = 'prop1:ontology1.prop2:ontology2.val';
    it('should read the oasPath ' + oasPath1 + ' properly', () => {
        var value = 'ab';
        var result = semanticTranslator.fillSchemaOrgProperty(value, {}, oasPath1);
        expect(result.prop1.prop2.val).to.eql(value);
        expect(result.prop1['@type']).to.eql('ontology1');
        expect(result.prop1.prop2['@type']).to.eql('ontology2');
    });
    var oasPath2 = 'prop1:ontology3.prop2:ontology4[1].val';
    it('should read the oasPath ' + oasPath2 + ' properly', () => {
        var value = 'cd';
        var result = semanticTranslator.fillSchemaOrgProperty(value, {
            prop1: { '@type': 'ontology3', prop2: [{ '@type': 'ontology4' }, { '@type': 'ontology2' }, { '@type': 'ontology2', val: 'ef' }] }
        }, oasPath2);
        expect(result.prop1.prop2[1].val).to.eql(value);
        expect(result.prop1['@type']).to.eql('ontology3');
        expect(result.prop1.prop2.length).to.eql(3);;
        expect(result.prop1.prop2[0]['@type']).to.eql('ontology4');
    });
    var oasPath3 = 'prop:ontology5[].val';
    it('should read the oasPath ' + oasPath3 + ' properly', () => {
        var value = ['gh', 'ij'];
        var result = semanticTranslator.fillSchemaOrgProperty(value, {}, oasPath3);
        expect(result.prop[0].val).to.eql(value[0]);
        expect(result.prop[1].val).to.eql(value[1]);
        expect(result.prop[0]['@type']).to.eql('ontology5');
        expect(result.prop[1]['@type']).to.eql('ontology5');
        expect(result.prop.length).to.eql(value.length);
    });
});