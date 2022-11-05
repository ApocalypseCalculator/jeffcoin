const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');
const nanoid = import('nanoid');

module.exports.name = "/api/transaction/new";
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
        if (req.body.toid && req.body.amount) {
            if(typeof req.body.amount == "number" && parseInt(req.body.amount) > 0) {
                let amount = parseInt(req.body.amount);
                prisma.user.findUnique({
                    where: {
                        userid: req.body.toid
                    }
                }).then(touser => {
                    if(!touser) {
                        res.status(404).json({ status: 404, error: 'Unknown user' });
                    }
                    else {
                        prisma.user.findUnique({
                            where: {
                                userid: user.userid
                            }
                        }).then(fromuser => {
                            if(fromuser.wallet >= amount) {
                                let querylist = [];
                                let trnsid = nanoid.nanoid(16);
                                querylist.push(prisma.transaction.create({
                                    data: {
                                        id: trnsid,
                                        fromid: fromuser.userid,
                                        toid: touser.userid,
                                        amount: amount,
                                        status: 2,
                                        createtime: Date.now()
                                    }
                                }));
                                querylist.push(prisma.user.update({
                                    where: {
                                        userid: fromuser.userid
                                    },
                                    data: {
                                        wallet: {
                                            decrement: amount
                                        }
                                    }
                                }));
                                prisma.$transaction(querylist).then(() => {
                                    res.json({message: 'Transaction added to queue'});
                                }).catch(() => {
                                    res.status(500).json({ status: 500, error: 'Database error' });
                                })
                            }
                            else {
                                res.status(403).json({ status: 403, error: 'Insufficient balance' });
                            }
                        })
                    }
                })
            }
            else {
                res.status(400).json({ status: 400, error: 'Invalid amount' });
            }
        }
        else {
            res.status(400).json({ status: 400, error: 'Missing destination wallet id or amount' });
        }
    }
}