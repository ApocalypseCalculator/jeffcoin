import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";
import { TransTable } from "../transtable/transtable";

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
                <TransTable transactions={userinfo.transactionsFrom} />
            </div>
            <div className={"container"}>
                <p>Your recent received transactions</p>
                <TransTable transactions={userinfo.transactionsTo} />
            </div>
        </div>
    )
}
