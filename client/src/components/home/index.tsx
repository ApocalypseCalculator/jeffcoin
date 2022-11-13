import * as React from "react";

import { SessionContext } from "../../util/session";
import { useNavigate } from "react-router-dom";

import "./index.scss";

export const Home = () => {
    const session = React.useContext(SessionContext);
    const nav = useNavigate();

    const sus = [
        "Hey @everyone! Have a paw-ssion for feet?",
        "I love Chick-fil-A",
        "Wait guys... How do I do dot product and cross product again???",
        "You are a darker shade"
    ][Math.floor(Math.random() * 4)];

    return (
        <div className={"home"}>
            <div id={"home-content"}>
                <div className="container pagecenter">
                    <h2>JEFF COIN</h2>
                    <p><br></br>{session.user.loggedin ? <>
                        <button type="button" className="btn btn-primary" onClick={(ev) => {
                            ev.preventDefault();
                            nav("/wallet");
                        }}>Go to Wallet</button>
                    </> : <>
                        <button type="button" className="btn btn-primary" onClick={(ev) => {
                            ev.preventDefault();
                            nav("/register");
                        }}>Register</button>
                        <button type="button" className="btn btn-primary" onClick={(ev) => {
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