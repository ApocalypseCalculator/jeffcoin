const { createHash } = require('node:crypto');

module.exports.calculateHash = (blockobj) => {
    let jsonobj = Object.keys(blockobj).sort().reduce((obj, key) => {
        obj[key] = blockobj[key];
        return obj;
    }, {});
    let jsonstring = JSON.stringify(jsonobj);
    let hash = createHash("sha256");
    hash.update(jsonstring);
    return hash.digest('hex');
}
