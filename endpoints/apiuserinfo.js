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
    else if (req.query.userid && req.query.userid !== user.userid) {
        prisma.user.findUnique({
            where: {
                userid: req.query.userid
            }
        }).then(usr => {
            res.json({
                username: usr.username,
                registertime: usr.registertime
            });
        })
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
        }).then((usr) => {
            res.json({
                wallet: usr.wallet,
                transactionsFrom: usr.transactionsFrom,
                transactionsTo: usr.transactionsTo
            });
        }).catch(err => res.status(500).json({ error: `Internal server error` }));
    }
}