import * as React from "react";

import { SessionContext } from "../../util/session";
import { useNavigate } from "react-router-dom";

import "./index.scss";

export const Home = () => {
    const session = React.useContext(SessionContext);
    const nav = useNavigate();

    return (
        <div className={"home"}>
            <div id={"home-content"}>
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
                <p>I can't make these buttons go down... just like how I don't know how to make &#91;redacted&#93; go down after seeing this background</p>
            </div>
            <div className={"jumbotron text-center"} id={"home-footer"} style={{ marginBottom: 0 }}>
                <p>Jeff Coin By <a href={"https://github.com/ApocalypseCalculator/jeffcoin"} target={"_blank"} rel={"noreferrer noopener"}>ApocalypseCalculator</a></p>
            </div>
        </div>
    )
}