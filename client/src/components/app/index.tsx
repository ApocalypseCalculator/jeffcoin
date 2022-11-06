import * as React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Link from '../../util/link';

export const _App = () => {
    return (
        <div className="page">
            <nav className={"navbar navbar-expand-lg navbar-dark bg-dark"}>
                <Link class="nav-link" href="/" text="Home"></Link>
                <button className={"navbar-toggler navbar-toggler-right"} type={"button"} data-toggle={"collapse"} data-target={"#navb"}>
                    <span className={"navbar-toggler-icon"}></span>
                </button>
                <div className={"collapse navbar-collapse"} id={"navb"}>
                    <ul className={"navbar-nav mr-auto"}>
                        <li className={"nav-item"}>
                            <Link class="nav-link" href="/mining" text="Mine Jeffcoin"></Link>
                        </li>
                        <li className={"nav-item"}>
                            <Link class="nav-link" href="/transactions" text="Transactions"></Link>
                        </li>
                        <li className={"nav-item"}>
                            <Link class="nav-link" href="/wallet" text="Wallet"></Link>
                        </li>
                    </ul>
                    <ul className={"navbar-nav ml-auto"}>
                        <li className={"nav-item"}>
                            <span id={"navbaruser"}>

                            </span>
                        </li>
                    </ul>
                </div>
            </nav>
            <div className="page-content">
                <Routes>
                </Routes>
            </div>
        </div>
    );
}

export const App = () => {
    return (
        <BrowserRouter>
            <_App />
        </BrowserRouter>
    );
}