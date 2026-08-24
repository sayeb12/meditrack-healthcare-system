import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    apiRequest,
} from "../api/client";


const normalizeList = (data) => {
    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.results
        )
    ) {
        return data.results;
    }

    return [];
};


const useAppointments = () => {
    const [appointments, setAppointments] =
        useState([]);

    const [patients, setPatients] =
        useState([]);

    const [doctors, setDoctors] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const mountedRef = useRef(false);
    const loadRequestRef = useRef(0);


    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            loadRequestRef.current += 1;
        };
    }, []);


    const loadData = useCallback(
        async () => {
            const requestId =
                loadRequestRef.current + 1;

            loadRequestRef.current = requestId;

            if (mountedRef.current) {
                setLoading(true);
                setError("");
            }

            try {
                const [
                    appointmentData,
                    patientData,
                    doctorData,
                ] = await Promise.all([
                    apiRequest(
                        "/appointments/"
                    ),
                    apiRequest(
                        "/patients/"
                    ),
                    apiRequest(
                        "/doctors/"
                    ),
                ]);

                if (
                    !mountedRef.current ||
                    loadRequestRef.current !==
                        requestId
                ) {
                    return;
                }

                setAppointments(
                    normalizeList(
                        appointmentData
                    )
                );

                setPatients(
                    normalizeList(
                        patientData
                    )
                );

                setDoctors(
                    normalizeList(
                        doctorData
                    )
                );
            }

            catch (requestError) {
                if (
                    !mountedRef.current ||
                    loadRequestRef.current !==
                        requestId
                ) {
                    return;
                }

                setError(
                    requestError.message ||
                    "Unable to load appointment data."
                );

                throw requestError;
            }

            finally {
                if (
                    mountedRef.current &&
                    loadRequestRef.current ===
                        requestId
                ) {
                    setLoading(false);
                }
            }
        },
        []
    );


    const refreshAppointments = useCallback(
        async () => {
            const requestId =
                loadRequestRef.current + 1;

            loadRequestRef.current = requestId;

            if (mountedRef.current) {
                setLoading(true);
                setError("");
            }

            try {
                const appointmentData =
                    await apiRequest(
                        "/appointments/"
                    );

                if (
                    !mountedRef.current ||
                    loadRequestRef.current !==
                        requestId
                ) {
                    return;
                }

                setAppointments(
                    normalizeList(
                        appointmentData
                    )
                );
            }

            catch (requestError) {
                if (
                    !mountedRef.current ||
                    loadRequestRef.current !==
                        requestId
                ) {
                    return;
                }

                setError(
                    requestError.message ||
                    "Unable to load appointments."
                );

                throw requestError;
            }

            finally {
                if (
                    mountedRef.current &&
                    loadRequestRef.current ===
                        requestId
                ) {
                    setLoading(false);
                }
            }
        },
        []
    );


    const createAppointment = useCallback(
        (payload) =>
            apiRequest(
                "/appointments/",
                {
                    method: "POST",
                    body: payload,
                }
            ),
        []
    );


    const updateAppointment = useCallback(
        (id, payload) =>
            apiRequest(
                `/appointments/${id}/`,
                {
                    method: "PATCH",
                    body: payload,
                }
            ),
        []
    );


    const deleteAppointment = useCallback(
        (id) =>
            apiRequest(
                `/appointments/${id}/`,
                {
                    method: "DELETE",
                }
            ),
        []
    );


    return {
        appointments,
        patients,
        doctors,
        loading,
        error,
        loadData,
        refreshAppointments,
        createAppointment,
        updateAppointment,
        deleteAppointment,
    };
};


export default useAppointments;
