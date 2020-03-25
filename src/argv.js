'use strict';

var path = require('path');
var fs = require('fs');
var yargs = require('yargs');

var argv = yargs
    .option('format', {
        alias: 'f',
        description: 'Format of input file, can be either OASv2 (for Swagger), OASv3, RAMLv1 or Blueprint (for API Blueprint)',
        type: 'string',
        choices: [
            'OASv2',
            'OASv3',
            'RAMLv1',
            'Blueprint'
        ]
    })
    .option('output', {
        alias: 'o',
        description: 'Path of output metadata file',
        type: 'string'
    })
    .option('api-url', {
        alias: 'api',
        description: 'URL to the root of the API',
        type: 'string'
    })
    .option('documentation-url', {
        alias: 'doc',
        description: 'URL to the documentation file or web page of the API',
        type: 'string'
    })
    .help()
    .alias('help', 'h')
    .argv;

var metadataGenerator = require('./index');

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

if (argv._.length == 1) {
    var fileName = argv._[0];
    var inputFormat = argv.format;
    var outputFile = argv.output;
    metadataGenerator.convertToMetadata(fs.readFileSync(fileName).toString(), inputFormat).then(
        res => outputFile != null ? ensureDirectoryExistence(outputFile) && fs.writeFileSync(outputFile, JSON.stringify(res, null, '\t')) : console.log(JSON.stringify(res, null, '\t')),
        err => console.log(err)
    );
}