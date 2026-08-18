import {
    Navigate,
} from "react-router";


function ProtectedRoute({
    children,
}) {

    const accessToken =
        localStorage.getItem(
            "meditrack_access"
        );

    const refreshToken =
        localStorage.getItem(
            "meditrack_refresh"
        );


    if (
        !accessToken &&
        !refreshToken
    ) {

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    return children;
}


export default ProtectedRoute;