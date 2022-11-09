import React from 'react';

export function MyLink(props) {
    let navigate = props.navigate;
    let to = props.to;
    if(!navigate || !to)
        throw "MyLink needs to have a navigate and a to property";
    let startTransition = props.startTransition;

    function onclick(e) {
        e.preventDefault();
        if(startTransition === undefined)
            navigate(to);
        else {
            startTransition(() => {
                navigate(to)
            })
        }
    }
    let props_copy = {...props}
    delete props_copy.startTransition;
    delete props_copy.to;
    delete props_copy.navigate;
    return <a onClick={onclick}
              href={props.to} {...props_copy}>
        {props.children}
    </a>
}
