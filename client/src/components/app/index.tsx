import * as React from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import Link from '../../util/link';

import { SessionProvider, SessionContext } from "../../util/session";

import { Home } from "../home";
import { Wallet } from "../wallet";
import { Block } from "../block";
import { Blocks } from "../blocks";
import { Mining } from "../mining";
import { Casino } from "../casino";
import { Transactions } from "../transactions";
import { Login } from "../login";
import { Register } from "../register";

export const _App = () => {
    const session = React.useContext(SessionContext);

    return (
        <div className="page">
            <nav className={"navbar navbar-expand-lg navbar-dark bg-dark"}>
                <Link class="nav-link" href="/" text="Home"></Link>
                <button className={"navbar-toggler navbar-toggler-right"} type={"button"} data-toggle={"collapse"} data-target={"#navb"}>
                    <span className={"navbar-toggler-icon"}></span>
                </button>
                <div className={"collapse navbar-collapse"} id={"navb"}>
                    <ul className={"navbar-nav mr-auto"}>
                        {
                            session.user.loggedin ? <>
                                <li className={"nav-item"}>
                                    <Link class="nav-link" href="/mining" text="Mine Jeffcoin"></Link>
                                </li>
                                <li className={"nav-item"}>
                                    <Link class="nav-link" href="/blocks" text="Blocks"></Link>
                                </li>
                                <li className={"nav-item"}>
                                    <Link class="nav-link" href="/transactions" text="Transactions"></Link>
                                </li>
                                <li className={"nav-item"}>
                                    <Link class="nav-link" href="/wallet" text="Wallet"></Link>
                                </li>
                                <li className={"nav-item"}>
                                    <Link class="nav-link" href="/casino" text="Casino"></Link>
                                </li>
                            </> : <></>
                        }
                    </ul>
                    <ul className={"navbar-nav ml-auto"}>
                        <li className={"nav-item"}>
                            <span id={"navbaruser"}>
                                {
                                    session.user.loggedin ? <>
                                        <a className={"nav-link dropdown-toggle"} href={"#"} data-toggle={"dropdown"}>
                                            Hello, <b>{session.user.username}</b>
                                        </a>
                                        <div className={"dropdown-menu dropdown-menu-right"}>
                                            <a className={"dropdown-item"} href={"#"} onClick={(ev) => {
                                                ev.preventDefault();
                                                session.updateToken("");
                                                window.location.reload();
                                            }}>Logout</a>
                                        </div>
                                    </> :
                                        <>
                                            <Link class="" href="/login" text="Log in" bold={true}></Link>
                                            &nbsp;or&nbsp;
                                            <Link class="" href="/register" text="Register" bold={true}></Link>
                                        </>
                                }
                            </span>
                        </li>
                    </ul>
                </div>
            </nav>
            <div className="page-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/block" element={<Block />} />
                    <Route path="/blocks" element={<Blocks />} />
                    <Route path="/mining" element={<Mining />} />
                    <Route path="/casino" element={<Casino />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<>
                        <div className="container pagecenter">
                            <h1>Oops...</h1><br /><h4>We couldn't find what you were looking for</h4>
                        </div>
                    </>}></Route>
                </Routes>
            </div>
        </div>
    );
}

export const App = () => {
    return (
        <BrowserRouter>
            <SessionProvider>
                <_App />
            </SessionProvider>
        </BrowserRouter>
    );
}