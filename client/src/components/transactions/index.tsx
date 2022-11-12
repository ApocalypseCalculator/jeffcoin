import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import { TransTable } from "../transtable";

export const Transactions = () => {
    const session = React.useContext(SessionContext);

    return (
        <div className={"transactions"}>
            <div id={"transactions-content container"}>
                Coming soon :tm:
            </div>
        </div>
    )
}
