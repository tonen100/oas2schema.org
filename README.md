# oas2schema.org (WebAPI ontology)

## Table of contents
1. [Introduction](#introduction)
2. [Use Case](#use_case)
3. [Functionality](#functionality)
4. [Output metadata structure](#structure)
4. [Version updates details](#updates)
5. [Licensing](#licensing)

## Introduction <a name="introduction"></a>

RESTfull APIs are spreading rapidly and widely, yet current standard search engines struggle to reference them, forcing APIs consumers to look for alternative platforms, although standard search engines like Google are supposed to be the perfect candidates to reference them the best way possible. Many issues can cause this problem, but the biggest one is without any doubt the lack of semantics metadata (in this case from the Schema.org ontology schema).

You have great RESTfull APIs with beautiful documentation, but you need to enrich it with semantics metadata from Schema.org (the ontology schema used by Google, Bing, Yahoo...)? You want traditionnal search engines to find it and reference it more easily? Well, this tool proposes a solution to automatize this process semantic anotation by extracting from your OAS, RAML or even API Blueprint, the metadata that can be used to describe it semantically. It use as a main ontology (altough subOntologies are used within it) the recent WebAPI ontology released by Schema.org, in order to describe any types of API (but this tool focus on RESTfull APIs).

## Use case <a name="use_case"></a>

This tool is meant to be used for the automatic generation of an instance of the Schema.Org ontology WebAPI from a RESTfull API documentation (that can be in OASv2, know as Swagger, OASv3, RAML v1 o or API Blueprint, altough OASv3 and Swagger are recommended). The output metadata are in JSON-LD.

## Functionality <a name="functionality"></a>

The core functionality of this package is accessible through the function convertToMetadata, which performs:

- The automatic recognition of the RESTfull API documentation format (if the format is not already specified)
- The conversion, if necessary, to OASv3
- The validation of the resulting OASv3 document (it needs to be valid or else it won't generate any metadata)
- The generation of the metadata in JSON-LD, according to the ontology matching between OASv3 specification and WebAPI

### Through js code

```js
var oas2SchemaOrg = require('oas2schema.org')

var metadata = oas2SchemaOrg.convertToMetadata(apiDocumentation, inputFormat, { urlAPI: URL_ROOT_OF_THE_API, urlDoc: URL_TO_YOUR_DOCUMENTATION}) 
```
or without optional parameters
```js
var metadata = oas2SchemaOrg.convertToMetadata(apiDocumentation) 
```

The urlAPI (that designate the root of the API) and urlDoc options are not mandatory but usefull to add relevant information to the metadata, altough urlAPI is only used if such URL cant be find within the description (with the servers attributes in OASv3 for example).

### Through CLI

oas2schema.org -o /path/to/outputFile.json -i format /path/to/documentation

Format is optional can be either OASv2, OASv3, RAMLv1 or Blueprint.
If the -o option is not specified, the result will be prompted to terminal.

## Output metadata structure <a name="structure"></a>

The metada this tools produced describes at the same time the main information (title, provider...) but also detailled information about every routes.

The matching described in the following diagrams has been split in three for more clarity

### For the main API:

![OAS Mappings with WebAPI ontology](hhttps://github.com/tonen100/oas2schema.org/blob/master/images/Correspondences.SchemaOrg.OAS-WebAPI.png?raw=true "OAS Submappings with WebAPI ontology")

(The aggregate rating is pending implementation and is not yet 100% sure to really be implemented)

### For each route of the API:

![OAS Submappings with ServiceChannel ontology](https://github.com/tonen100/oas2schema.org/blob/master/images/Correspondences.SchemaOrg.OAS-ServiceChannel.png?raw=true "OAS Submappings with ServiceChannel ontology")

### For each HTTP operation of each route:

![OAS Submappings with EntryPoint ontology](https://github.com/tonen100/oas2schema.org/blob/master/images/Correspondences.SchemaOrg.OAS-EntryPoint.png?raw=true "OAS Submappings with EntryPoint ontology")

### It is also possible to specify the pricing distinct offers for paying APIs

![OAS Submappings with Offer ontology](https://github.com/tonen100/oas2schema.org/blob/master/images/Correspondences.SchemaOrg.OAS-Offer.png?raw=true "OAS Submappings with Offer ontology")

## Version updates details <a name="updates"></a>

### 1.1
- Fixed linking between Service Channel and EntryPoint ontologies
- Added mappings for OAS custom extension
  - info.x-logo.url => WebAPI.logo
  - x-documentation-url => WebAPI.documentation
  - x-pricing => Offer

## Licensing <a name="licensing"></a>

This package is licensed under the GNU General Public License v3.0, making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.

The support of this package is not warranted.

If you have any ideas of improvement or adaptation to new changes, feel free to contribute by forking or opening a github issue
