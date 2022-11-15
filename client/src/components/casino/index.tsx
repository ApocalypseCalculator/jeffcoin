import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";

export const Casino = () => {
    const session = React.useContext(SessionContext);

    const [stats, setStats] = React.useState({} as any);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        if (session.user.loggedin) {
            axios.default.get(`/api/casino/stats`, {
                headers: {
                    "authorization": session.token
                }
            }).then((res) => {
                if (res.data) {
                    setStats(res.data);
                    setReady(true);
                }
            });
        }
    }, [session.user.loggedin]);

    return (
        <div className={"casino"}>
            <div id={"casino-content container"}>
                {
                    !ready ? <>
                        <h3>Loading...</h3>
                    </> : <>
                        <div className="container">
                            <div className="row">
                                <div className="container col-10">
                                    <h3>Global Stats  - Last 100</h3>
                                    <table className={"table table-bordered"}>
                                        <tbody>
                                            <tr>
                                                <th scope="row">Total Payout</th>
                                                <td>
                                                    {stats.aggregation._sum.payout}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Total Bet</th>
                                                <td>
                                                    {stats.aggregation._sum.amount}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Total Plays</th>
                                                <td>{stats.aggregation._count}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Highest Payout</th>
                                                <td>{stats.aggregation._max.payout}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Highest Bet</th>
                                                <td>{stats.aggregation._max.amount}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Average Payout</th>
                                                <td>{stats.aggregation._avg.payout}</td>
                                            </tr>
                                            <tr>
                                                <th scope="row">Average Bet</th>
                                                <td>{stats.aggregation._avg.amount}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="container col-2">
                                    <img className="img-fluid" src={"/static/images/jeffhodl.png"}></img>
                                </div>
                            </div>
                        </div>
                        <div className="container">
                            <GuessTable />
                        </div>
                    </>
                }
            </div>
        </div>
    )
}

function GuessTable(props: any) {
    const session = React.useContext(SessionContext);

    let optionscol = [0, 1, 2, 3, 4, 5, 6, 7];
    let optionsrow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [selected, setSelected] = React.useState(new Array(80).fill(false));
    const [betamt, setBetamt] = React.useState(2);
    const [res, setRes] = React.useState({
        payout: 0,
        winning: []
    } as any);
    const [err, setErr] = React.useState("");
    const [sending, setSending] = React.useState(false);

    function sendBet() {
        setSending(true);
        if (session.user.loggedin) {
            let chosen = [];
            for (let i = 0; i < selected.length; i++) {
                if (selected[i]) chosen.push(i);
            }
            axios.default.post(`/api/casino/bet`, {
                amount: betamt,
                chosen: chosen,
            }, {
                headers: {
                    "authorization": session.token
                }
            }).then((res) => {
                setErr("");
                if (res.data) {
                    setRes(res.data);
                }
                setSending(false);
            }).catch(err => {
                setErr(err.response.data.error);
                setSending(false);
            })
        }
    }

    return (
        <div className="row">
            <div className="col-8">
                <table className="kenotable table table-bordered">
                    <thead>
                        <tr>
                            <th colSpan={10}>
                                {
                                    selected.filter(e => e).length == 10 ? "Keno - Good Selection!" : `Keno - Select ${10 - selected.filter(e => e).length}`
                                }
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            optionscol.map((rowval) => {
                                return (
                                    <tr className="kenotablerow" key={rowval}>
                                        {
                                            optionsrow.map((colval) => {
                                                let curval = rowval * 10 + colval;
                                                let classVal = "";
                                                if (selected[curval] && res.winning.includes(curval)) {
                                                    classVal = "won";
                                                }
                                                else if (res.winning.includes(curval)) {
                                                    classVal = "winning";
                                                }
                                                else if (selected[curval]) {
                                                    classVal = "selected";
                                                }
                                                return (
                                                    <td className={`centertext kenobtn ${classVal}`} key={curval} onClick={() => {
                                                        if (selected[curval]) {
                                                            let newsel = selected.slice();
                                                            newsel[curval] = false;
                                                            setSelected(newsel);
                                                        }
                                                        else if (selected.filter(e => e).length < 10) {
                                                            let newsel = selected.slice();
                                                            newsel[curval] = true;
                                                            setSelected(newsel);
                                                        }
                                                    }}>
                                                        {curval}
                                                    </td>
                                                )
                                            })
                                        }
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                <div className="container">
                    <div className="input-group mb-3">
                        <input type={"number"} className="form-control betinput" placeholder="2" value={betamt} step={2} onChange={text => {
                            let val = parseInt(text.target.value);
                            if (val && !isNaN(val) && val % 2 == 0 && val / 2 >= 1) {
                                setBetamt(val);
                            }
                        }}></input>
                        <button className={`btn btn-primary ${sending ? "disabled" : ''}`} type="button" onClick={() => {
                            if (selected.filter(e => e).length != 10) {
                                setErr("You need to select 10 values!");
                            }
                            else if (!sending) {
                                sendBet();
                            }
                        }}>Bet!</button>
                    </div>
                    <div className="container kenotable">
                        {sending ? <></> : <>
                            {
                                err === "" ? <>
                                    <p>Payout: {res.payout}</p>
                                </> : <>
                                    <p>{err}</p>
                                </>
                            }
                        </>}
                    </div>
                </div>
            </div>
            <div className="col-4">
                <table className="kenotable table table-bordered">
                    <thead>
                        <tr>
                            <th>Matches</th>
                            <th>Probability</th>
                            <th>Rate</th>
                            <th>Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td >0</td>
                            <td >4.57907%</td>
                            <td >1X</td>
                            <td>{betamt}</td>
                        </tr>
                        <tr>
                            <td >1</td>
                            <td >17.95713%</td>
                            <td >-</td>
                            <td >0</td>
                        </tr>
                        <tr>
                            <td >2</td>
                            <td >29.52567%</td>
                            <td >-</td>
                            <td >0</td>
                        </tr>
                        <tr>
                            <td >3</td>
                            <td >26.74023%</td>
                            <td >0.5X</td>
                            <td >{betamt / 2}</td>
                        </tr>
                        <tr>
                            <td >4</td>
                            <td >14.73188%</td>
                            <td >2X</td>
                            <td >{betamt * 2}</td>
                        </tr>
                        <tr>
                            <td >5</td>
                            <td >5.14276%</td>
                            <td >5X</td>
                            <td >{betamt * 5}</td>
                        </tr>
                        <tr>
                            <td >6</td>
                            <td >1.14793%</td>
                            <td >10X</td>
                            <td >{betamt * 10}</td>
                        </tr>
                        <tr>
                            <td >7</td>
                            <td >0.16111%</td>
                            <td >25X</td>
                            <td >{betamt * 25}</td>
                        </tr>
                        <tr>
                            <td >8</td>
                            <td >0.01354%</td>
                            <td >500X</td>
                            <td >{betamt * 500}</td>
                        </tr>
                        <tr>
                            <td >9</td>
                            <td >0.00061%</td>
                            <td >2,000X</td>
                            <td >{betamt * 2000}</td>
                        </tr>
                        <tr>
                            <td >10</td>
                            <td >0.00001%</td>
                            <td >10,000X</td>
                            <td >{betamt * 10000}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
