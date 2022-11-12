const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');

module.exports.name = "/api/block/get";
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
    else if (!req.query.blockid && !req.query.hash) {
        res.status(400).json({ status: 400, error: 'Missing block ID/hash' });
    }
    else {
        let query = {};
        if(req.query.blockid) {
            query.blockid = req.query.blockid;
        }
        else {
            query.hash = req.query.hash;
        }
        prisma.block.findUnique({
            where: query,
            include: {
                transactions: true
            }
        }).then(block => {
            if (block) {
                res.json(block);
            }
            else {
                res.status(404).json({ status: 404, error: 'Block not found' });
            }
        })
    }
}
