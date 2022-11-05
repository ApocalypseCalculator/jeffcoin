const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');
const nanoid = import('nanoid');
const hash = require('../lib/hash');

module.exports.name = "/api/mine/start";
module.exports.method = "POST";
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
        if (req.body.proof && typeof req.body.proof == "number" && req.body.blockid) {
            prisma.block.findUnique({
                where: {
                    blockid: req.body.blockid,
                },
                include: {
                    transactions: true
                }
            }).then(block => {
                if(!block || block.mined) {
                    res.status(404).json({ status: 404, error: 'Unknown block or block already mined' });
                }
                else {
                    delete block.hash;
                    delete block.mined;
                    delete block.minetime;
                    block.proof = req.body.proof;
                    let hashval = hash.calculateHash(block);
                    if(hashval.startsWith("0".repeat(block.difficulty))) {
                        let querylist = [];
                        querylist.push(prisma.block.update({
                            where: {
                                blockid: block.blockid
                            },
                            data: {
                                hash: hashval,
                                proof: req.body.proof,
                                mined: true,
                                minetime: Date.now()
                            }
                        }));
                        block.transactions.forEach(e => {
                            querylist.push(prisma.transaction.update({
                                where: {
                                    id: e.id
                                },
                                data: {
                                    status: 0
                                }
                            }));
                            querylist.push(prisma.user.update({
                                where: {
                                    userid: e.toid
                                },
                                data: {
                                    wallet: {
                                        increment: e.amount
                                    }
                                }
                            }));
                        })
                        let rewardtrnsid = nanoid.nanoid(16);
                        querylist.push(prisma.transaction.create({
                            data: {
                                id: rewardtrnsid,
                                fromid: "0", //make sure to seed DB with site root user
                                toid: user.userid,
                                amount: config.mining.reward,
                                status: 2,
                                createtime: Date.now()
                            }
                        }));
                        prisma.$transaction(querylist).then(() => {
                            res.json({message: `Success! You have been awarded ${config.mining.reward} jeffcoins. The reward transaction is added to the queue.`});
                        }).catch(() => {
                            res.status(500).json({ status: 500, error: 'Database query error' });
                        });
                    }
                    else {
                        res.status(403).json({ status: 403, error: 'Proof rejected' });
                    }
                }
            })
        }
        else {
            res.status(400).json({ status: 400, error: 'Missing/invalid proof or blockid' });
        }
    }
}