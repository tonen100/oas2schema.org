function InvalidFormat(message) {
    this.name = "InvalidFormat";
    this.message = message;
}

function OASPathError(message) {
    this.name = "OASPathError";
    this.message = message;
}

module.exports = new Map([
    [
        'UnknownInputFormat',
        new InvalidFormat("The format of the API documentation couldnt be recognized or is not supported (or the document is invalid)")
    ], [
        'InvalidInputDocument',
        new InvalidFormat("The API documentation is incorrect")
    ], [
        'InvalidOASDocument',
        (error) => new InvalidFormat("The API documentation (or it's translation to OASv3) is incorrect for the following reasons: " + error)
    ], [
        'UnsupportedInputFormat',
        (format) => new InvalidFormat("The format " + format + "of the API documentation is not supported")
    ], [
        'UnsupportedInputFileType',
        new InvalidFormat("The type of the object that contains the API documentation is not supported (at least for this format of the API documentation)")
    ], [
        'IncorrectOASPathExpression',
        (path) => new OASPathError("The OAS path logical expression " + path + "returns values with incorrects of differents types. It's either an internal error or an incorrect OAS document definition")
    ], [
        'IncorrectSchemaOrgPathExpression',
        (path) => new SchemaOrgPath("The Schema.Org path expression " + path + " couldnt match existing array to fill values in the metadata that he is generating, check if your OAS document is not missing some required values")
    ]
])