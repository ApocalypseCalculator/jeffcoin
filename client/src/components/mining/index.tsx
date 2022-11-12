import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";
import Link from "../../util/link";

export const Mining = () => {
    const session = React.useContext(SessionContext);
    const [ready, setReady] = React.useState(false);
    const [started, setStarted] = React.useState(false);
    const [log, setLog] = React.useState("");
    const [block, setBlock] = React.useState({
        blockid: '',
        difficulty: 0,
        prevhash: '',
        proof: 0,
        transactions: []
    });

    function getBlock() {
        if (session.user.loggedin) {
            axios.default.post('/api/mine/start', {}, {
                headers: {
                    "authorization": session.token
                }
            }).then((res) => {
                if (res.data.blockid) {
                    setBlock(res.data);
                    session.miner.postMessage(['data', res.data]);
                    console.log(`Sending data to worker thread for block ID: ${res.data.blockid}`);
                    if(!ready) setReady(true);
                }
            });
        }
    }

    React.useEffect(() => {
        getBlock();
    }, [session.user.loggedin]);

    React.useEffect(() => {
        if (started && ready && block.blockid !== "") {
            session.miner.postMessage(["start"]);
            console.log(`Dispatched mining job to worker thread for block ID: ${block.blockid}`);
        }
        else if (!started && ready) {
            session.miner.postMessage(["stop"]);
            console.log(`Stopped mining job for block ID: ${block.blockid}`);
        }
    }, [started]);

    return (
        <div className={"mining"}>
            <div id={"mining-content"}>
                {
                    ready ? <div className={"container"}>
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
