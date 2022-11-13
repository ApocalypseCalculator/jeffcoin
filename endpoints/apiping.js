const config = require('../config');
const jwt = require('jsonwebtoken');

module.exports.name = "/api/ping";
module.exports.method = "GET";
module.exports.verify = function (req, res) {
    return true;
}

module.exports.execute = function (req, res) {
    let user = null;
    try {
        user = jwt.verify(req.headers.authorization, config.secrets.jwt);
    }
    catch { }
    if (!user) {
        res.status(401).json({ status: 401, error: 'Unauthorized' });
    }
    else {
        res.json({ message: "Pong" });
    }
}
