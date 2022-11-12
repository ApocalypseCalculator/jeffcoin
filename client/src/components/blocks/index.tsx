import * as React from "react";
import * as axios from "axios";

import { useNavigate } from "react-router-dom";

import { SessionContext } from "../../util/session";
import Link from "../../util/link";

export const Blocks = () => {
    const nav = useNavigate();
    const session = React.useContext(SessionContext);

    const [blocks, setBlocks] = React.useState([]);
    const [loaded, setLoaded] = React.useState(false);
    const [page, setPage] = React.useState(0);

    function getBlocks() {
        axios.default.get(`/api/block/list${page ? `?page=${page}` : ''}`, {
            headers: {
                "authorization": session.token
            }
        }).then((res) => {
            if (res.data) {
                setBlocks(res.data);
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
            getBlocks();
        }
    }, [page]);

    return (
        <div className={"blocks"}>
            <div id={"blocks-content container"}>
                {
                    !loaded ? <>
                        <h3>Loading...</h3>
                    </> : <>
                        {
                            <div className={"container"}>
                                <p>Block List - Page {page}</p>
                                <nav aria-label="Page navigation example">
                                    <ul className="pagination">
                                        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}><a className="page-link" href={`/blocks?page=${page - 1}`} onClick={(ev) => {
                                            ev.preventDefault();
                                            if (page > 1) {
                                                nav(`/blocks?page=${page - 1}`);
                                                setPage((pageval) => {
                                                    return pageval - 1;
                                                })
                                            }
                                        }}>Previous</a></li>
                                        <li className="page-item"><a className="page-link" href={`/blocks?page=${page + 1}`} onClick={(ev) => {
                                            ev.preventDefault();
                                            nav(`/blocks?page=${page + 1}`);
                                            setPage((pageval) => {
                                                return pageval + 1;
                                            })
                                        }}>Next</a></li>
                                    </ul>
                                </nav>
                                <div className={"container"}>
                                    <table className={"nicetable"}>
                                        <tr className={"header"}>
                                            <th>ID</th>
                                            <th>Hash</th>
                                            <th>Difficulty</th>
                                            <th>Date Mined</th>
                                            <th>Transactions</th>
                                        </tr>
                                        <GenerateTable blocks={blocks} />
                                    </table>
                                </div>
                            </div>
                        }
                    </>
                }
            </div>
        </div>
    )
}

function GenerateTable(props: any) {
    let table = props.blocks.map((block: any) => {
        return (<>
            <tr>
                <td className="breakname"><Link class="breakname" href={`/block?blockid=${block.blockid}`} text={block.blockid} /></td>
                <td className="breakname">{block.mined ? <Link class="breakname" href={`/block?hash=${block.hash}`} text={block.hash} /> : "Mining in progress"}</td>
                <td className="breakname">{block.difficulty}</td>
                <td className="breakname">{block.mined ? new Date(block.minetime).toLocaleString() : ""}</td>
                <td className="breakname">{
                    block._count.transactions
                }</td>
            </tr>
        </>);
    });
    table = table.filter((t: any) => t);
    if (table.length == 0) {
        return (<tr><td>No blocks to display</td></tr>);
    }
    else {
        return (<>{table}</>);
    }
}
