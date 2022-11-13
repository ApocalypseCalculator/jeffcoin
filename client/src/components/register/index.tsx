import * as React from "react";
import * as axios from "axios";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../../util/session";
import Link from "../../util/link";

export const Register = () => {
    const nav = useNavigate();
    const session = React.useContext(SessionContext);

    if (session.user.loggedin) {
        nav("/");
    }

    let [username, setUsername] = React.useState("");
    let [pwd1, setPwd1] = React.useState("");
    let [pwd2, setPwd2] = React.useState("");
    let [registering, setRegistering] = React.useState(false);
    let [err, setErr] = React.useState("");
    let [success, setSuccess] = React.useState(false);

    function register(ev: React.SyntheticEvent) {
        ev.preventDefault();
        setRegistering(true);
        if (!/^\w+$/.test(username) || username.length > 32) {
            setErr("Username can only contain alphanumeric characters or underscore and must be at most 32 characters");
            setRegistering(false);
        }
        else if (!/^\w+$/.test(pwd1) || pwd1.length < 8) {
            setErr("Password can only contain alphanumeric characters or underscore and must be at least 8 characters");
            setRegistering(false);
        }
        else if (pwd1 !== pwd2) {
            setErr("Passwords do not match");
            setRegistering(false);
        }
        else {
            axios.default.post('/api/user/register', {
                username: username,
                password: pwd1
            }).then(res => {
                if (res.data.message) {
                    setSuccess(true);
                }
                else {
                    setErr(res.data.error);
                }
                setRegistering(false);
            }).catch(err => {
                setErr(err.response.data.error);
                setRegistering(false);
            });
        }
    }

    return (
        <div className={"register"}>
            <div className={"jumbotron jumbotron-fluid"}>
                <div className={"container"}>
                    <h1>Jeff Coin</h1>
                    <p>Register an account to mine and trade Jeff Coin!</p>
                </div>
            </div>
            <div className={"container"}>
                {
                    !success ?
                        <form className={"form-signup"}>
                            <div className="form-label-group">
                                <label htmlFor={"username"}>
                                    Username:
                                </label>
                                <input type={"text"} id={"username"} className={"form-control"} name={"username"} placeholder={"Enter your username"} onChange={text => {
                                    setUsername(text.target.value);
                                }}></input>
                            </div>
                            <div className="form-label-group">
                                <label htmlFor={"password"}>
                                    Password:
                                </label>
                                <input type={"password"} id={"password"} className={"form-control"} name={"password"} placeholder={"Enter your password"} onChange={text => {
                                    setPwd1(text.target.value);
                                }}></input>
                            </div>
                            <div className="form-label-group">
                                <label htmlFor={"repeatpwd"}>
                                    Confirm password:
                                </label>
                                <input type={"password"} id={"repeatpwd"} className={"form-control"} name={"repeatpwd"} placeholder={"Confirm your password"} onChange={text => {
                                    setPwd2(text.target.value);
                                }}></input>
                            </div>
                            <div className="form-label-group">
                                {err !== "" ? <p style={{ textAlign: "center" }}>
                                    {"Error: " + err}
                                </p> : <></>}
                            </div>
                            <br></br>
                            <button className={"btn btn-lg btn-primary btn-block text-uppercase"} disabled={registering} onClick={register}>Register</button>
                            <p style={{ textAlign: "center" }}>Have an account? <Link class="" href="/login" text="Log in"></Link> instead</p>
                        </form>
                        :
                        <>
                            <div className={"alert alert-success"} id={"successdiv"}>
                                <strong>Success!</strong> Your registration was successful
                            </div>
                            <div className={"container"}>
                                <p style={{ textAlign: "center" }}><Link class="" href="/login" text="Log in"></Link></p>
                            </div>
                        </>
                }
            </div>
        </div>
    )
}