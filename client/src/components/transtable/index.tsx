import * as React from "react";
import Link from "../../util/link";

export const TransTable = (props: any) => {
    return (<div className={"container"}>
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
            <GenerateTable transactions={props.transactions} />
        </table>
    </div>)
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
