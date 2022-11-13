import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";
import Link from "../../util/link";

export const Mining = () => {
    const session = React.useContext(SessionContext);
    const [ready, setReady] = React.useState(false);
    const [started, setStarted] = React.useState(false);
    const [log, setLog] = React.useState("==================== START LOG ====================");
    const [block, setBlock] = React.useState({} as any);

    function getBlock() {
        return new Promise<any>((resolve) => {
            if (session.user.loggedin) {
                axios.default.post('/api/mine/start', {}, {
                    headers: {
                        "authorization": session.token
                    }
                }).then((res) => {
                    if (res.data.blockid) {
                        resolve(res.data);
                    }
                })
            }
        })
    }

    function submitBlock(proof: number, blockid: string) {
        return new Promise((resolve, reject) => {
            if (session.user.loggedin) {
                axios.default.post('/api/mine/submit', {
                    blockid: blockid,
                    proof: proof
                }, {
                    headers: {
                        "authorization": session.token,
                        "content-type": 'application/json'
                    }
                }).then((res) => {
                    if (res.data.message) {
                        resolve(res.data.message);
                    }
                    else {
                        reject();
                    }
                }).catch(err => {
                    resolve("Mining submission failed, perhaps a competitor mined the block first. Fetching new block...");
                })
            }
            else {
                reject();
            }
        })
    }

    React.useEffect(() => {
        if (session.miner instanceof Worker && session.user.loggedin) {
            getBlock().then(data => {
                setBlock(data);
                session.miner.postMessage(['data', data]);
                setLog((prevlog) => {
                    return `Sending data to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                });
                if (!ready) setReady(true);
            });
            session.miner.onmessage = (ev) => {
                if (ev.data[0] == "log") {
                    setLog((prevlog) => {
                        return `${ev.data[1]}\n${prevlog}`;
                    })
                }
                else if (ev.data[0] == "proof") {
                    submitBlock(ev.data[1], ev.data[2]).then(msg => {
                        setLog((prevlog) => {
                            return `${msg}\n${prevlog}`;
                        });
                        getBlock().then((data) => {
                            setBlock(data);
                            session.miner.postMessage(['data', data]);
                            setLog((prevlog) => {
                                return `Sending data to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                            });
                            session.miner.postMessage(["start"]);
                            setLog((prevlog) => {
                                return `Dispatched mining job to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                            });
                        })
                    }).catch(() => {
                        setLog((prevlog) => {
                            return `Error on proof submission\n${prevlog}`;
                        });
                        getBlock().then((data) => {
                            setBlock(data);
                            session.miner.postMessage(['data', data]);
                            setLog((prevlog) => {
                                return `Sending data to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                            });
                            session.miner.postMessage(["start"]);
                            setLog((prevlog) => {
                                return `Dispatched mining job to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                            });
                        })
                    })
                }
            }
            return () => {
                session.miner.onmessage = () => { };
            }
        }
    }, [session.miner, session.user.loggedin]);

    useInterval(() => {
        if (!started && ready && block.blockid) {
            getBlock().then((data) => {
                console.log(data.blockid);
                console.log(block.blockid);
                if (data.blockid !== block.blockid) {
                    session.miner.postMessage(["stop"]);
                    setLog((prevlog) => {
                        return `Received new block. Aborting mining job with block ID: ${block.blockid}\n${prevlog}`;
                    });
                    setBlock(data);
                    session.miner.postMessage(['data', data]);
                    setLog((prevlog) => {
                        return `Sending new data to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                    });
                    session.miner.postMessage(["start"]);
                    setLog((prevlog) => {
                        return `Dispatched mining job to worker thread for block ID: ${data.blockid}\n${prevlog}`;
                    });
                }
            });
        }
    }, 60 * 1000); //check every minute

    React.useEffect(() => {
        if (started && ready && block.blockid !== "") {
            session.miner.postMessage(["start"]);
            setLog((prevlog) => {
                return `Dispatched mining job to worker thread for block ID: ${block.blockid}\n${prevlog}`;
            });
        }
        else if (!started && ready) {
            session.miner.postMessage(["stop"]);
            setLog((prevlog) => {
                return `Stopping mining job for block ID: ${block.blockid}\n${prevlog}`;
            });
        }
    }, [started]);

    return (
        <div className={"mining"}>
            <div id={"mining-content"}>
                {
                    ready ? <div className={"container"}>
                        <img className="imgcenter" src={"/static/images/minejeffcoin.png"}></img>
                        <button className="btn btn-primary" type="button" onClick={() => {
                            setStarted(!started);
                        }}>
                            {started ? "Stop" : "Start"} Mining
                        </button>
                        <div className="container">
                            <div id="minelogtail">
                                {log}
                            </div>
                        </div>
                    </div> : <><h5>Loading...</h5></>
                }
            </div>
        </div>
    )
}

function useInterval(callback: any, delay: number) {
    const savedCallback = React.useRef();

    // Remember the latest callback.
    React.useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    React.useEffect(() => {
        function tick() {
            // @ts-ignore
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
