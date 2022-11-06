import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";
import { useNavigate } from "react-router-dom";

import "./index.scss";

export const Wallet = () => {
    const session = React.useContext(SessionContext);
    const nav = useNavigate();

    if (session.user.loggedin) {
        nav("/");
    }

    const [userinfo, setUserinfo] = React.useState({
        username: "",
        wallet: -1,
        registertime: 0,
        transactionsFrom: [],
        transactionsTo: []
    });

    React.useEffect(() => {
        axios.default.get('/api/user/info', {
            headers: {
                "authorization": session.token
            }
        }).then((res) => {
            if (res.data) {
                setUserinfo(res.data);
            }
        });
    }, [session.user.loggedin]);

    return (
        <div className={"wallet"}>
            <div id={"wallet-content"}>
                {
                    userinfo.wallet == -1 ? <>
                        <h3>Loading...</h3>
                    </> : <h3>Your balance is {userinfo.wallet} Jeff coins!</h3>
                }
            </div>
            <div className={"container"}>
                <p>Table of your recent transactions</p>
            </div>
        </div>
    )
}