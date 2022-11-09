import {useCallback, useContext, useEffect} from 'react';
import {UNSAFE_NavigationContext as NavigationContext} from 'react-router-dom';

function useConfirmExit(confirmExit, when) {
    const { navigator } = useContext( NavigationContext );
    useEffect(function () {
        if (!when) {
            return;
        }
        var push = navigator.push;
        navigator.push = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var result = confirmExit();
            if (result !== false) {
                push.apply(void 0, args);
            }
        };
        return function () {
            navigator.push = push;
        };
    }, [navigator, confirmExit, when]);
}
export default function usePrompt(message, when) {
    if (when === void 0) { when = true; }
    useEffect(function () {
        if (when) {
            window.onbeforeunload = function () {
                return message;
            };
        }
        return function () {
            window.onbeforeunload = null;
        };
    }, [message, when]);
    var confirmExit = useCallback(() => {
        return window.confirm(message);
    }, [message]);
    useConfirmExit(confirmExit, when);
}
