import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";
import { useNavigate } from "react-router-dom";

import "./index.scss";

export const Home = () => {
    const session = React.useContext(SessionContext);
    const nav = useNavigate();

    const [sus, setSus] = React.useState("");
    React.useEffect(() => {
        axios.default.get('/api/quote/get').then(res => {
            if(res.data.quote) {
                setSus(res.data.quote);
            }
        }).catch(() => {});
    }, [])

    return (
        <div className={"home"}>
            <div id={"home-content"}>
                <div className="container pagecenter centertext">
                    <h2 className="bigtitle">JEFF COIN</h2>
                    <img className="coinimg" src="/static/images/coin.png"></img>
                    <p><br></br>{session.user.loggedin ? <>
                        <button type="button" className="btn btn-info btn-lg" onClick={(ev) => {
                            ev.preventDefault();
                            nav("/wallet");
                        }}>Go to Wallet</button>
                    </> : <>
                        <button type="button" className="btn btn-info btn-lg mx-2" onClick={(ev) => {
                            ev.preventDefault();
                            nav("/register");
                        }}>Register</button>
                        <button type="button" className="btn btn-info btn-lg mx-2" onClick={(ev) => {
                            ev.preventDefault();
                            nav("/login");
                        }}>Log in</button>
                    </>}</p>
                    <p>{sus}</p>
                </div>
            </div>
            <div className={"jumbotron text-center"} id={"home-footer"} style={{ marginBottom: 0 }}>
                <p>Jeff Coin By <a href={"https://github.com/ApocalypseCalculator/jeffcoin"} target={"_blank"} rel={"noreferrer noopener"}>ApocalypseCalculator</a></p>
            </div>
        </div>
    )
}