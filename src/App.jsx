import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Workspace from "./pages/Workspace";
import { getStoredToken, getStoredUser } from "./services/authService";

function ProtectedRoute({ children, roles }) {
  if (!getStoredToken()) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(getStoredUser()?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
      <Route
        path="/customers"
        element={
          <ProtectedRoute roles={["admin", "agent"]}>
            <Workspace />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
