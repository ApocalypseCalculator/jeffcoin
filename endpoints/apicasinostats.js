const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');

module.exports.name = "/api/casino/stats";
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
        prisma.bet.aggregate({
            _sum: {
                amount: true,
                payout: true
            },
            _count: true,
            _avg: {
                amount: true,
                payout: true
            },
            _max: {
                amount: true,
                payout: true
            }
        }).then(aggr => {
            res.json(aggr);
        })
    }
}
