import {
    Navigate,
    Route,
    Routes,
} from "react-router";

import ProtectedRoute
    from "./components/ProtectedRoute";

import AuthPage
    from "./pages/AuthPage";

import DashboardPage
    from "./pages/DashboardPage";

import PatientsPage
    from "./pages/PatientsPage";


function App() {

    return (

        <Routes>

            <Route
                path="/"
                element={
                    <AuthPage />
                }
            />


            <Route
                path="/dashboard"
                element={

                    <ProtectedRoute>

                        <DashboardPage />

                    </ProtectedRoute>

                }
            />


            <Route
                path="/patients"
                element={

                    <ProtectedRoute>

                        <PatientsPage />

                    </ProtectedRoute>

                }
            />


            <Route
                path="*"
                element={

                    <Navigate
                        to="/"
                        replace
                    />

                }
            />

        </Routes>

    );
}


export default App;