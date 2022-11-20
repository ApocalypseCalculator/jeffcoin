import * as React from 'react';
import jwt_decode from "jwt-decode";
import * as axios from "axios";

export interface User {
    loggedin: boolean,
    username: string,
    userid: string,
    registertime: number
}

export interface Session {
    user: User,
    token: string,
    updateToken: (token: string) => void,
    miner: any
}

export const SessionContext = React.createContext<Session>({
    user: {
        loggedin: false,
        username: "",
        userid: "",
        registertime: 0
    },
    token: "",
    updateToken: (token: string) => { },
    miner: {}
});

export const SessionProvider = (props: { children: React.ReactNode }) => {
    let [token, setToken] = React.useState("");
    let [miner, setMiner] = React.useState({});
    let [user, setUser] = React.useState({
        loggedin: false,
        username: "",
        userid: "",
        registertime: 0
    });
    function updateToken(token: string) {
        setToken(token);
        localStorage.setItem("token", token);
        if (token !== "") {
            let decoded: any = jwt_decode(token);
            setUser({
                loggedin: true,
                username: decoded.username,
                userid: decoded.userid,
                registertime: decoded.registertime
            });
        }
        else {
            setUser({
                loggedin: false,
                username: "",
                userid: "",
                registertime: 0
            })
        }
    }
    React.useEffect(() => {
        let storagetoken = localStorage.getItem("token");
        if (storagetoken) {
            axios.default.get(`/api/ping`, {
                headers: {
                    "authorization": storagetoken
                }
            }).then((res) => {
                updateToken(storagetoken as string);
            }).catch(() => {
                localStorage.removeItem("token");
            })
        }
        setMiner(new Worker('/static/js/minemanager.js'));
    }, []);
    return (
        <SessionContext.Provider value={{ user, token, updateToken, miner }}>
            {props.children}
        </SessionContext.Provider>
    )
}
