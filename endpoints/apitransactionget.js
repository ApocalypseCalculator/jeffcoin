const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');

module.exports.name = "/api/transaction/get";
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
    else if (!req.query.transactionid) {
        res.status(400).json({ status: 400, error: 'Missing transaction ID' });
    }
    else {
        prisma.transaction.findUnique({
            where: {
                id: req.query.transactionid
            },
            include: {
                block: true
            }
        }).then(trns => {
            if (trns) {
                res.json(trns);
            }
            else {
                res.status(404).json({ status: 404, error: 'Transaction not found' });
            }
        })
    }
}