import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";
import Link from "../../util/link";

export const Wallet = () => {
    const session = React.useContext(SessionContext);

    const [userinfo, setUserinfo] = React.useState({
        username: "",
        wallet: -1,
        registertime: 0,
        transactionsFrom: [],
        transactionsTo: []
    });

    React.useEffect(() => {
        if (session.user.loggedin) {
            axios.default.get('/api/user/info', {
                headers: {
                    "authorization": session.token
                }
            }).then((res) => {
                if (res.data) {
                    setUserinfo(res.data);
                }
            });
        }
    }, [session.user.loggedin]);

    return (
        <div className={"wallet"}>
            <div id={"wallet-content"}>
                {
                    userinfo.wallet == -1 ? <>
                        <h3>Loading...</h3>
                    </> : <>
                        <h3>Your balance is {userinfo.wallet} Jeff coins!</h3>
                        <h4>Your wallet ID is <b>{session.user.userid}</b></h4>
                    </>
                }
            </div>
            <div className={"container"}>
                <p>Your recent sent transactions</p>
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
                        {
                            userinfo.wallet == -1 ?
                                <tr id={"status"}>
                                    <td>Loading...</td>
                                </tr>
                                :
                                <GenerateTable transactions={userinfo.transactionsFrom} />
                        }
                    </table>
                </div>
            </div>
            <div className={"container"}>
                <p>Your recent received transactions</p>
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
                        {
                            userinfo.wallet == -1 ?
                                <tr id={"status"}>
                                    <td>Loading...</td>
                                </tr>
                                :
                                <GenerateTable transactions={userinfo.transactionsTo} />
                        }
                    </table>
                </div>
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
                        trans.status > 1 ? "-" : <Link class="breakname" href={`/block?blockid=${trans.blockid}`} text={trans.blockid} />
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