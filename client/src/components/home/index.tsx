import * as React from "react";

import "./index.scss";

export const Home = () => {
    return (
        <div className={"home"}>
            <div className={"d-flex align-items-center"} id={"home-content"}>
                <h2>JEFF COIN</h2>
            </div>
            <div className={"jumbotron text-center"} id={"home-footer"} style={{ marginBottom: 0 }}>
                <p>Jeff Coin By <a href={"https://github.com/ApocalypseCalculator/jeffcoin"} target={"_blank"} rel={"noreferrer noopener"}>ApocalypseCalculator</a></p>
            </div>
        </div>
    )
}