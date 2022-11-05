const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nanoid = import('nanoid');
const bcrypt = require('bcrypt');

module.exports.name = "/api/user/register";
module.exports.method = "POST";
module.exports.verify = function (req, res) {
    return true;
}


module.exports.execute = function (req, res) {
    if (req.body.username && req.body.password) {
        prisma.user.findUnique({
            where: {
                username: req.body.username
            }
        }).then((usr) => {
            if (usr) {
                res.status(400).json({ status: 400, error: 'Username taken' });
            }
            else {
                bcrypt.hash(req.body.password, 10, function (err, pwdhash) {
                    if (err) {
                        res.status(500).json({ status: 500, error: `Internal server error` });
                    }
                    else {
                        let userid = nanoid.nanoid(16);
                        prisma.user.create({
                            data: {
                                userid: userid,
                                username: req.body.username,
                                password: pwdhash,
                                registertime: Date.now(),
                                wallet: 0
                            }
                        }).then(() => {
                            res.json({ message: 'Success!' });
                        }).catch(() => res.status(500).json({ error: "Internal server error" }));
                    }
                });
            }
        }).catch(() => {
            res.status(500).json({ status: 500, error: `Database error` });
        })
    }
    else {
        res.status(400).json({ status: 400, error: 'Missing username or password' });
    }
}