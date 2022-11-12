import * as React from "react";
import * as axios from "axios";

import { SessionContext } from "../../util/session";

export const TransModal = (props: any) => {
    const session = React.useContext(SessionContext);

    const [toid, setToid] = React.useState("");
    const [amount, setAmount] = React.useState(0);
    const [text, setText] = React.useState("");

    function submitTrans(ev: React.SyntheticEvent) {
        setText("Sending");
        axios.default.post('/api/transaction/new', {
            toid: toid,
            amount: amount
        }, {
            headers: {
                "authorization": session.token,
                "content-type": 'application/json'
            }
        }).then((res) => {
            if (res.data.message) {
                setText(res.data.message);
            }
            else {
                setText("An unknown error occurred");
            }
        }).catch(err => {
            setText(err.response.data.error);
        })
    }

    return (<div className={"modal fade"} id={"transmodal"} role={"dialog"}>
        {
            session.user.loggedin ? <div className={"modal-dialog modal-dialog-centered"} role={"document"}>
                <div className={"modal-content"}>
                    <div className={"modal-header"}>
                        <h5 className={"modal-title"}>New Transaction</h5>
                    </div>
                    <div className={"modal-body"}>
                        {
                            text !== "" ? <>
                                <p>{text}</p>
                                {
                                    text !== "Sending" //shit code go brrrrrrr
                                        ? <>
                                            <button type={"button"} className={"btn btn-primary"} onClick={() => {
                                                setToid("");
                                                setAmount(0);
                                                setText("");
                                            }}>Ok</button>
                                        </> : <></>
                                }
                            </> : <form className={"form-signup"}>
                                <div className="form-label-group">
                                    <label htmlFor={"toid"}>
                                        Target Wallet ID:
                                    </label>
                                    <input type={"text"} id={"toid"} className={"form-control"} name={"toid"} placeholder={"Enter wallet ID"} onChange={text => {
                                        setToid(text.target.value);
                                    }} value={toid}></input>
                                </div>
                                <div className="form-label-group">
                                    <label htmlFor={"amount"}>
                                        Amount:
                                    </label>
                                    <input type={"number"} id={"amount"} className={"form-control"} name={"amount"} placeholder={"Enter amount of jeffcoins to send"} onChange={val => {
                                        if (parseInt(val.target.value) > 0) {
                                            setAmount(parseInt(val.target.value));
                                        }
                                    }} value={amount}></input>
                                </div>
                            </form>
                        }
                    </div>
                    <div className={"modal-footer"}>
                        <button type={"button"} className={"btn btn-secondary"} onClick={(ev) => {
                            //@ts-ignore
                            $("#transmodal").modal('hide');
                        }}>Cancel</button>
                        <button type={"button"} className={"btn btn-primary"} onClick={submitTrans}>Send</button>
                    </div>
                </div>
            </div> : <></>
        }
    </div>)
}
