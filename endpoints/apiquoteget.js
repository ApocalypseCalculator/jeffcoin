const config = require('../config');
const quotes = require('../quotes');

module.exports.name = "/api/quote/get";
module.exports.method = "GET";
module.exports.verify = function (req, res) {
    return true;
}

module.exports.execute = function (req, res) {
    if (quotes.on) {
        if (quotes.quotes.length == 0) {
            res.status(404).json({ status: 404, error: 'No quotes to return' });
        }
        else {
            res.json({ quote: quotes.quotes[Math.floor(Math.random() * quotes.quotes.length)] });
        }
    }
    else {
        res.status(451).json({ status: 451, error: 'Quotes have been disabled' });
    }
}
