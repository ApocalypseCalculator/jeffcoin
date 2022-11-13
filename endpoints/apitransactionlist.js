const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');

module.exports.name = "/api/transaction/list";
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
        prisma.transaction.findMany({
            skip: req.query.page ? (req.query.page - 1) * 10 : 0,
            take: 10,
            orderBy: {
                createtime: 'desc'
            }
        }).then(result => {
            res.json(result);
        }).catch(() => {
            res.status(500).json({ status: 500, error: 'Internal server error' });
        })
    }
}