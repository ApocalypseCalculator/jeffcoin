const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');

module.exports.name = "/api/user/info";
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
        prisma.user.findUnique({
            where: {
                userid: user.userid
            },
            include: {
                transactionsFrom: {
                    take: 10
                },
                transactionsTo: {
                    take: 10
                }
            }
        }).then((user) => {
            res.json({
                wallet: user.wallet,
                transactionsFrom: user.transactionsFrom,
                transactionsTo: user.transactionsTo
            });
        }).catch(err => res.status(500).json({ error: `Internal server error` }));
    }
}