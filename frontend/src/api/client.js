const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api";


const ACCESS_TOKEN_KEY =
    "meditrack_access";

const REFRESH_TOKEN_KEY =
    "meditrack_refresh";

const USER_KEY =
    "meditrack_user";


export const getAccessToken = () => {
    return localStorage.getItem(
        ACCESS_TOKEN_KEY
    );
};


export const getRefreshToken = () => {
    return localStorage.getItem(
        REFRESH_TOKEN_KEY
    );
};


export const clearAuthSession = () => {
    localStorage.removeItem(
        ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
        REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );
};


const parseResponse = async (
    response
) => {

    if (
        response.status === 204
    ) {
        return null;
    }


    const text =
        await response.text();


    if (!text) {
        return null;
    }


    try {
        return JSON.parse(text);
    }

    catch {
        return {
            detail: text,
        };
    }
};


const getErrorMessage = (
    data
) => {

    if (!data) {
        return "Something went wrong.";
    }


    if (
        typeof data.detail ===
        "string"
    ) {
        return data.detail;
    }


    if (
        typeof data.message ===
        "string"
    ) {
        return data.message;
    }


    for (
        const value
        of Object.values(data)
    ) {

        if (
            Array.isArray(value)
        ) {
            return value.join(" ");
        }


        if (
            typeof value ===
            "string"
        ) {
            return value;
        }
    }


    return "Something went wrong.";
};


const refreshAccessToken =
    async () => {

        const refreshToken =
            getRefreshToken();


        if (!refreshToken) {
            return null;
        }


        try {

            const response =
                await fetch(
                    `${API_BASE}/auth/token/refresh/`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                refresh:
                                    refreshToken,
                            }),
                    }
                );


            const data =
                await parseResponse(
                    response
                );


            if (
                !response.ok ||
                !data?.access
            ) {

                clearAuthSession();

                return null;
            }


            localStorage.setItem(
                ACCESS_TOKEN_KEY,
                data.access
            );


            return data.access;

        }

        catch {

            return null;
        }
    };


export const apiRequest =
    async (
        endpoint,
        options = {}
    ) => {

        const {
            method = "GET",
            body = null,
            auth = true,
            retry = true,
        } = options;


        const headers = {};


        if (
            body !== null
        ) {
            headers[
                "Content-Type"
            ] =
                "application/json";
        }


        if (auth) {

            const accessToken =
                getAccessToken();


            if (accessToken) {

                headers.Authorization =
                    `Bearer ${accessToken}`;
            }
        }


        const response =
            await fetch(
                `${API_BASE}${endpoint}`,
                {
                    method,
                    headers,

                    body:
                        body !== null
                            ? JSON.stringify(
                                body
                            )
                            : undefined,
                }
            );


        if (
            response.status === 401 &&
            auth &&
            retry
        ) {

            const newAccessToken =
                await refreshAccessToken();


            if (
                newAccessToken
            ) {

                return apiRequest(
                    endpoint,
                    {
                        method,
                        body,
                        auth,
                        retry: false,
                    }
                );
            }


            clearAuthSession();


            const error =
                new Error(
                    "Your session has expired. Please sign in again."
                );


            error.status = 401;


            throw error;
        }


        const data =
            await parseResponse(
                response
            );


        if (
            !response.ok
        ) {

            const error =
                new Error(
                    getErrorMessage(
                        data
                    )
                );


            error.status =
                response.status;


            error.data =
                data;


            throw error;
        }


        return data;
    };