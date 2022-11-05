import {useNavigate} from "react-router-dom";

export function MyLink(props) {
    let navigate = useNavigate();
    function onclick(e) {
        e.preventDefault();
        if(props?.startTransition === undefined)
            navigate(props.to);
        else {
            props.startTransition(() => {
                navigate(props.to)
            })
        }
    }
    let props_copy = {...props}
    delete props_copy.startTransition;
    delete props_copy.to;
    return <a onClick={onclick}
              href={props.to} {...props_copy}>
        {props.children}
    </a>
}
