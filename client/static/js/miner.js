//if (window.Worker) {
let start = false;
var blockdata = {};
let encoder = new TextEncoder();
onmessage = async (e) => {
    if (e.data[0] == "start") {
        start = true;
        blockdata.proof = 0;
        postMessage(["log", `Starting mining for ${blockdata.blockid}`]);
        while (start) {
            blockdata.proof++;
            let jsonobj = Object.keys(blockdata).sort().reduce((obj, key) => {
                obj[key] = blockdata[key];
                return obj;
            }, {});
            let jsonstring = JSON.stringify(jsonobj);
            let hash = await crypto.subtle.digest("SHA-256", encoder.encode(jsonstring));
            let hashhex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
            if (hashhex.startsWith("0".repeat(blockdata.difficulty))) {
                postMessage(["proof", blockdata.proof, blockdata.blockid]);
                postMessage(["log", `Mining done for ${blockdata.blockid} with proof ${blockdata.proof}. Waiting on new job`]);
                start = false;
                break;
            }
            if (blockdata.proof % 100000 == 0) {
                postMessage(["log", `Calculated ${blockdata.proof} hashes`]);
            }
        }
    }
    else if (e.data[0] == "stop") {
        start = false;
        postMessage(["log", `Stopped miner`]);
    }
    else if (e.data[0] == "data" && e.data[1]) {
        blockdata = e.data[1];
        postMessage(["log", `Received mining job:\nBlock ID: ${blockdata.blockid}\nLast block: ${blockdata.prevhash}\nDifficulty: ${blockdata.difficulty}\nTransactions: ${blockdata.transactions.length}`]);
    }
}
//}
