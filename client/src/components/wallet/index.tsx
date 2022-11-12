import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import "./index.scss";
import { TransTable } from "../transtable";
import { TransModal } from "../transmodal";

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
                        <h4>Your wallet ID is <b>{session.user.userid}</b></h4><br></br>
                        <button type={"button"} className={"btn btn-primary"} onClick={(ev) => {
                            //@ts-ignore
                            $("#transmodal").modal('show');
                        }}>Send money</button>
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
            <TransModal />
        </div>
    )
}
