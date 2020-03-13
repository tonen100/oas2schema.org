function InvalidFormat(message) {
    this.name = "InvalidFormat";
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
        'UnsupportedInputFormat',
        (format) => new InvalidFormat("The format " + format + "of the API documentation is not supported")
    ]
])