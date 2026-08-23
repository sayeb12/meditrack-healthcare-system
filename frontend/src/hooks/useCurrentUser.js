import {
    useEffect,
    useState,
} from "react";

import {
    clearAuthSession,
    getStoredUser,
    loadCurrentUser,
} from "../api/client";

import {
    useNavigate,
} from "react-router";


const useCurrentUser = () => {
    const navigate =
        useNavigate();

    const [user, setUser] =
        useState(getStoredUser);

    useEffect(() => {
        let cancelled = false;

        const refreshCurrentUser =
            async () => {
                try {
                    const currentUser =
                        await loadCurrentUser();

                    if (!cancelled) {
                        setUser(currentUser);
                    }
                }

                catch (error) {
                    if (
                        !cancelled &&
                        error.status === 401
                    ) {
                        clearAuthSession();

                        navigate(
                            "/",
                            {
                                replace: true,
                            }
                        );
                    }
                }
            };

        refreshCurrentUser();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    return user;
};


export default useCurrentUser;
