import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Month from "../pages/Month";
import Day from "../pages/Day";
import Cat from "../pages/Cat";
import Test from "../pages/TestPage";
import NotFound from "../pages/NotFound";
import SignIn from "../pages/SignIn";
import { useAuth } from "../auth/useAuth";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />

      <Route
        element={(
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        )}
      >
        <Route path="/" element={<Month />} />
        <Route path="/day/:iso?" element={<Day />} />
        <Route path="/cat" element={<Cat />} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
