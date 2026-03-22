import { Navigate } from 'react-router-dom';

function getToken() {
    return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}

export default function ProtectedRoute({ children }) {
    if (!getToken()) {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
}