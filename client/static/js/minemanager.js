//set to dispatch mining jobs in batches of 100k hashes each
let started = false;
var blockdata = {};
const default_workercount = 1;
let workers = [];
let curproof = 0;
let batch = 100000; //hashing will be dispatched in batches of this value (curproof * batch)

onmessage = async (e) => {
    if (e.data[0] == "start") {
        start();
    }
    else if (e.data[0] == "stop") {
        stop();
    }
    else if (e.data[0] == "destroy") {
        destroy();
    }
    else if (e.data[0] == "init") {
        init();
    }
    else if (e.data[0] == "workers") {
        //THIS SHOULD NOT BE CALLED DURING MINING
        setWorkers(e.data[1]);
    }
    else if (e.data[0] == "batch") {
        //THIS SHOULD NOT BE CALLED DURING MINING
        batch = e.data[1];
    }
    else if (e.data[0] == "data" && e.data[1]) {
        sendData(e.data[1]);
    }
}

function init() {
    for (let i = 0; i < default_workercount; i++) {
        workers.push(new Worker('/static/js/miner.js'));
    }
}

function destroy() {
    for (let i = 0; i < workers.length; i++) {
        workers[i].terminate();
    }
    workers = [];
}

function setWorkers(n) {
    if (started) {
        return;
    }
    else if (n < workers.length) {
        for (let i = n; i < workers.length; i++) {
            workers[i].terminate();
        }
    }
    else if (n > workers.length) {
        for (let i = workers.length; i < n; i++) {
            workers.push(new Worker('/static/js/miner.js'));
        }
    }
}

function start() {
    started = true;
    postMessage(["log", `Starting mining for ${blockdata.blockid}`]);
    for (let i = 0; i < workers.length; i++) {
        workers[i].onmessage = (e) => {
            threadReceiver(e, i);
        };
        workers[i].postMessage(["start", curproof * batch, (curproof + 1) * batch]);
        curproof++;
    }
}

function stop() {
    started = false;
    postMessage(["log", `Stopping workers`]);
    for (let i = 0; i < workers.length; i++) {
        workers[i].postMessage(["stop"]);
    }
}

function sendData(data) {
    blockdata = data;
    postMessage(["log", `Received mining job:\nBlock ID: ${blockdata.blockid}\nLast block: ${blockdata.prevhash}\nDifficulty: ${blockdata.difficulty}\nTransactions: ${blockdata.transactions.length}`]);
    for (let i = 0; i < workers.length; i++) {
        workers[i].postMessage(["data", blockdata]);
    }
}

function threadReceiver(event, workerID) {
    if (started) {
        if (event.data[0] == "log") {
            //blackhole this message for now
        }
        else if (event.data[0] == "proof") {
            postMessage(event.data);
            postMessage(["log", `Mining done for ${blockdata.blockid} with proof ${event.data[1]} on miner #${workerID}. Waiting on new job`]);
            stop();
        }
        else if (event.data[0] == "done") {
            postMessage(["log", `Miner #${workerID}: Calculated ${batch} hashes from ${event.data[1]} to ${event.data[2]} ${Date.now()}`]);
            workers[workerID].postMessage(["start", curproof * batch, (curproof + 1) * batch]);
            curproof++;
        }
    }
}
