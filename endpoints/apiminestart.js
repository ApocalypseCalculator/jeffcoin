const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');
const nanoid = require('nanoid');

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
        prisma.block.findFirst({
            where: {
                mined: false
            },
            include: {
                transactions: true
            }
        }).then(block => {
            if (block) {
                delete block.hash;
                delete block.mined;
                delete block.minetime;
                res.json(block);
            }
            else {
                prisma.block.findFirst({ //last block
                    where: {
                        mined: true
                    },
                    orderBy: {
                        minetime: 'desc' //last block will always have most recent mine time as this is a centralized blockchain
                    }
                }).then(rcntblock => {
                    let blockid = nanoid.nanoid(16);
                    prisma.block.create({
                        data: {
                            blockid: blockid,
                            hash: "",
                            prevhash: rcntblock.hash,
                            difficulty: config.mining.difficulty,
                            proof: 0,
                            mined: false,
                            minetime: 2e14
                        }
                    }).then(() => {
                        prisma.transaction.findMany({
                            where: {
                                status: 2
                            },
                            orderBy: {
                                createtime: 'asc'
                            },
                            take: 5
                        }).then(trns => {
                            let updatelist = trns.map(e => {
                                return prisma.transaction.update({
                                    where: {
                                        id: e.id
                                    },
                                    data: {
                                        status: 1,
                                        blockid: blockid
                                    }
                                });
                            });
                            prisma.$transaction(updatelist).then(() => {
                                //admittedly, this db query is not necessary, however I am lazy
                                prisma.block.findFirst({
                                    where: {
                                        mined: false
                                    },
                                    include: {
                                        transactions: true
                                    }
                                }).then(newblock => {
                                    delete newblock.hash;
                                    delete newblock.mined;
                                    delete newblock.minetime;
                                    res.json(newblock);
                                })
                            })
                        })
                    })
                })
            }
        })
    }
}