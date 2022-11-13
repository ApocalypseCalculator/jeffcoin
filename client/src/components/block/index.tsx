import * as React from "react";
import * as axios from "axios";

import { useSearchParams } from "react-router-dom";

import { SessionContext } from "../../util/session";

import { TransTable } from "../transtable";
import Link from "../../util/link";

export const Block = () => {
    const session = React.useContext(SessionContext);
    let [searchParams, setSearchParams] = useSearchParams();

    const [block, setBlock] = React.useState({
        transactions: []
    } as any);

    React.useEffect(() => {
        if (session.user.loggedin) {
            axios.default.get(`/api/block/get${window.location.search}`, {
                headers: {
                    "authorization": session.token
                }
            }).then((res) => {
                if (res.data) {
                    setBlock(res.data);
                }
                else {
                    setBlock({
                        blockid: "Unknown",
                        prevhash: "Unknown",
                        difficulty: "Unknown",
                        mined: false,
                        minetime: -1,
                        transactions: []
                    });
                }
            });
        }
    }, [session.user.loggedin, searchParams]);

    return (
        <div className={"block"}>
            <div id={"block-content container"}>
                {
                    block.blockid === "" ? <>
                        <h3>Loading...</h3>
                    </> : <>
                        <div className="container">
                            <table className={"table table-bordered"}>
                                <tbody>
                                    <tr>
                                        <th scope="row">Block ID</th>
                                        <td>
                                            {block.blockid}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Hash</th>
                                        <td>
                                            {!block.mined ? "Unknown" : block.hash}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Last Block Hash</th>
                                        <td><Link class="" href={`/block?hash=${block.prevhash}`} text={block.prevhash} /></td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Difficulty</th>
                                        <td>{block.difficulty}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Proof</th>
                                        <td>{!block.mined ? "Unknown" : block.proof}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Date Mined</th>
                                        <td>{!block.mined ? "Unknown" : new Date(block.minetime).toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={"container"}>
                            <p>Block's Transactions</p>
                            <TransTable transactions={block.transactions} />
                        </div>
                    </>
                }
            </div>
        </div>
    )
}
