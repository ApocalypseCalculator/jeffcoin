const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../config');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nanoid = require('nanoid');

module.exports.name = "/api/casino/bet";
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
        if (!req.body.amount || isNaN(parseInt(req.body.amount)) || parseInt(req.body.amount) % 2 == 1 || parseInt(req.body.amount) / 2 < 1) {
            res.status(400).json({ status: 400, error: 'You must bet an even number greater than or equal to 2' });
        }
        else if (!Array.isArray(req.body.chosen) || req.body.chosen.length != 10) {
            res.status(400).json({ status: 400, error: 'Invalid chosen values' });
        }
        else {
            let amt = parseInt(req.body.amount);
            prisma.user.findUnique({
                where: {
                    userid: user.userid
                }
            }).then(usr => {
                if (amt > usr.wallet) {
                    res.status(403).json({ status: 403, error: 'You are too broke' });
                }
                else {
                    let reject = false;
                    let choicemap = new Map();
                    req.body.chosen.forEach(val => {
                        if (isNaN(parseInt(val)) || parseInt(val) < 1 || parseInt(val) > 80) {
                            reject = true;
                        }
                        else if (choicemap.has(parseInt(val))) {
                            reject = true;
                        }
                        else {
                            choicemap.set(parseInt(val), true);
                        }
                    });
                    if (reject) {
                        res.status(400).json({ status: 400, error: 'Invalid chosen values' });
                    }
                    else {
                        let winmap = rng10();
                        let winarr = Array.from(winmap.keys()).sort((a, b) => a - b);
                        let count = 0;
                        winmap.forEach((v, k) => {
                            if (choicemap.has(k)) {
                                count++;
                            }
                        });
                        let payout = payouts[count] * amt;
                        prisma.$transaction([
                            prisma.bet.create({
                                data: {
                                    betid: nanoid.nanoid(16),
                                    chosen: JSON.stringify(req.body.chosen),
                                    winning: JSON.stringify(winarr),
                                    amount: amt,
                                    payout: payout,
                                    userid: user.userid,
                                    time: Date.now()
                                }
                            }),
                            prisma.user.update({
                                where: {
                                    userid: user.userid
                                },
                                data: {
                                    wallet: {
                                        decrement: amt
                                    }
                                }
                            }),
                            prisma.transaction.create({
                                data: {
                                    id: nanoid.nanoid(16),
                                    fromid: user.userid,
                                    toid: "1",
                                    amount: amt,
                                    status: 2,
                                    createtime: Date.now()
                                }
                            }),
                            prisma.transaction.create({
                                data: {
                                    id: nanoid.nanoid(16),
                                    fromid: "1",
                                    toid: user.userid,
                                    amount: payout,
                                    status: 2,
                                    createtime: Date.now()
                                }
                            })
                        ]).then(() => {
                            res.json({ message: `Success`, amt: amt, payout: payout, winning: winarr });
                        }).catch(() => {
                            res.status(500).json({ status: 500, error: 'Internal database error' });
                        });
                    }
                }
            })
        }
    }
}

function rng10() { //generate 10 unique numbers, no params to prevent potential fuckery
    let resultmap = new Map();
    while (resultmap.size < 10) {
        let rnd = crypto.randomInt(1, 80);
        if (!resultmap.has(rnd)) {
            resultmap.set(rnd, true);
        }
    }
    return resultmap;
}

const payouts = {
    0: 1,
    1: 0,
    2: 0,
    3: 0.5,
    4: 2,
    5: 5,
    6: 10,
    7: 25,
    8: 500,
    9: 2000,
    10: 10000
}
