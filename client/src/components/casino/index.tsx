import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

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
    let optionscol = [0, 1, 2, 3, 4, 5, 6, 7];
    let optionsrow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const [selected, setSelected] = React.useState(new Map());
    return (
        <table className="kenotable">
            {
                optionscol.map((rowval) => {
                    return (
                        <tr className="kenotablerow" key={rowval}>
                            {
                                optionsrow.map((colval) => {
                                    return (
                                        <td className={`centertext kenobtn${selected.has(rowval * 10 + colval) ? " selected" : ""}`} key={rowval * 10 + colval} onClick={() => {
                                            setSelected((sel) => {
                                                if (sel.size >= 10 || sel.has(rowval * 10 + colval)) {
                                                    return sel;
                                                }
                                                else {
                                                    console.log(rowval * 10 + colval);
                                                    return sel.set(rowval * 10 + colval, true);
                                                }
                                            })
                                        }}>
                                            {rowval * 10 + colval}
                                        </td>
                                    )
                                })
                            }
                        </tr>
                    )
                })
            }
        </table>
    )
}
