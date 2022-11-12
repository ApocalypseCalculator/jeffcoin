import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";
import Link from "../../util/link";

export const Block = () => {
    const session = React.useContext(SessionContext);

    const [block, setBlock] = React.useState({} as any);

    React.useEffect(() => {
        if (session.user.loggedin) {
            axios.default.get(`/api/block/get${window.location.search}`, {
                headers: {
                    "authorization": session.token
                }
            }).then((res) => {
                if (res.data) {
                    setBlock(res.data);
                }
                else {
                    setBlock({
                        blockid: "Unknown",
                        prevhash: "Unknown",
                        difficulty: "Unknown",
                        mined: false,
                        minetime: -1,
                        transactions: []
                    });
                }
            });
        }
    }, [session.user.loggedin]);

    return (
        <div className={"block"}>
            <div id={"block-content container"}>
                {
                    block.blockid === "" ? <>
                        <h3>Loading...</h3>
                    </> : <>
                        <div className="container">
                            <table className={"table table-bordered"}>
                                <tbody>
                                    <tr>
                                        <th scope="row">Block ID</th>
                                        <td>
                                            {block.blockid}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Hash</th>
                                        <td>
                                            {block.mined ? "Unknown" : block.hash}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Last Block Hash</th>
                                        <td>{block.prevhash}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Difficulty</th>
                                        <td>{block.difficulty}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Proof</th>
                                        <td>{block.mined ? "Unknown" : block.prevhash}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Date Mined</th>
                                        <td>{block.mined ? "Unknown" : new Date(block.minetime).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={"container"}>
                            <p>Block's Transactions</p>
                            <div className={"container"}>
                                <table id={"myTable"}>
                                    <tr className={"header"}>
                                        <th>ID</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Time</th>
                                        <th>Block ID</th>
                                    </tr>
                                    <GenerateTable transactions={block.transactions} />
                                </table>
                            </div>
                        </div>
                    </>
                }
            </div>
        </div>
    )
}

function GenerateTable(props: any) {
    let table = props.transactions.map((trans: any) => {
        return (<>
            <tr>
                <td className="breakname">{trans.id}</td>
                <td className="breakname">{(trans.fromid === "0") ? "Mining Rewards" : trans.fromid}</td>
                <td className="breakname">{trans.toid}</td>
                <td className="breakname">{trans.amount}</td>
                <td className="breakname">{
                    ["Success", "Mining in progress", "Queued", "Failed"][trans.status]
                }</td>
                <td>{new Date(trans.createtime).toLocaleString()}</td>
                <td>
                    {
                        trans.status > 1 ? "-" : <Link class="breakname" href={`/block?id=${trans.blockid}`} text={trans.blockid} />
                    }
                </td>
            </tr>
        </>);
    });
    table = table.filter((t: any) => t);
    if (table.length == 0) {
        return (<tr><td>No transactions to display</td></tr>);
    }
    else {
        return (<>{table}</>);
    }
}
