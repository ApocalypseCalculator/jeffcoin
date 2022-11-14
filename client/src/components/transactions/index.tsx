import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

import { useNavigate } from "react-router-dom";

import { TransTable } from "../transtable";

export const Transactions = () => {
    const nav = useNavigate();
    const session = React.useContext(SessionContext);

    const [transactions, setTransactions] = React.useState([]);
    const [loaded, setLoaded] = React.useState(false);
    const [page, setPage] = React.useState(0);

    function getTransactions() {
        axios.default.get(`/api/transaction/list${page ? `?page=${page}` : ''}`, {
            headers: {
                "authorization": session.token
            }
        }).then((res) => {
            if (res.data) {
                setTransactions(res.data);
            }
            setLoaded(true);
        });
    }

    React.useEffect(() => {
        if (session.user.loggedin) {
            let pageval = new URLSearchParams(window.location.search).get("page");
            if (pageval && !isNaN(parseInt(pageval)) && parseInt(pageval) > 0) {
                setPage(parseInt(pageval));
            }
            else {
                setPage(1);
            }
        }
    }, [session.user.loggedin]);

    React.useEffect(() => {
        if (page >= 1 && session.user.loggedin) {
            getTransactions();
        }
    }, [page]);

    return (
        <div className={"transactions"}>
            <div id={"transactions-content container"}>
                {
                    !loaded ? <>
                        <h3>Loading...</h3>
                    </> : <>
                        {
                            <div className={"container"}>
                                <p>Transaction List - Page {page}</p>
                                <nav aria-label="Page navigation example">
                                    <ul className="pagination">
                                        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}><a className="page-link" href={`/blocks?page=${page - 1}`} onClick={(ev) => {
                                            ev.preventDefault();
                                            if (page > 1) {
                                                nav(`/transactions?page=${page - 1}`);
                                                setPage((pageval) => {
                                                    return pageval - 1;
                                                })
                                            }
                                        }}>Previous</a></li>
                                        <li className="page-item"><a className="page-link" href={`/blocks?page=${page + 1}`} onClick={(ev) => {
                                            ev.preventDefault();
                                            nav(`/transactions?page=${page + 1}`);
                                            setPage((pageval) => {
                                                return pageval + 1;
                                            })
                                        }}>Next</a></li>
                                    </ul>
                                </nav>
                                <div className={"container"}>
                                    <TransTable transactions={transactions} />
                                </div>
                            </div>
                        }
                    </>
                }
            </div>
        </div>
    )
}