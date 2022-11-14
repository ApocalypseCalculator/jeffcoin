const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('./config');

prisma.$transaction([
    prisma.user.create({
        data: {
            userid: '0',
            username: 'admin',
            password: '0',
            registertime: 0,
            wallet: 0
        }
    }),
    prisma.user.create({
        data: {
            userid: '1',
            username: 'admin2',
            password: '0',
            registertime: 0,
            wallet: 0
        }
    }),
    prisma.block.create({
        data: {
            blockid: 'genesis',
            hash: 'genesis',
            prevhash: '',
            difficulty: config.mining.difficulty,
            proof: 0,
            mined: true,
            minetime: 0
        }
    })
]).then(() => {
    console.log('Done!');
})
