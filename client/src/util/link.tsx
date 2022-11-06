import * as React from "react";
import { useNavigate } from "react-router-dom";

export default (props: any) => {
    const nav = useNavigate();
    return (
        <a className={props.class} href={props.href} onClick={(ev) => {
            ev.preventDefault();
            nav(props.href);
        }}>{props.text}</a>
    )
}
