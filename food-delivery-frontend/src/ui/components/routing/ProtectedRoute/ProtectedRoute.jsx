import React from 'react';
import useAuth from "../../../../hooks/useAuth.js";
import {Navigate, Outlet, useLocation} from "react-router";

const ProtectedRoute = ({role}) => {
    const {isLoading, user} = useAuth();
    const location = useLocation();

    if (isLoading) return null;

    // not logged in → go to login and remember current path
    if (user === null) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }

    // logged in but missing role → also go to login (or you could send to /)
    if (role && !user.roles?.includes(role)) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }

    return <Outlet/>;
};

export default ProtectedRoute;