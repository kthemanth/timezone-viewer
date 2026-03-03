import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Month from "../pages/Month";
import Day from "../pages/Day";
import Cat from "../pages/Cat";
import Test from "../pages/TestPage";
import NotFound from "../pages/NotFound";


function todayISO() {
  // local date in YYYY-MM-DD
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Month />} />
        <Route path="/day" element={<Navigate to={`/day/${todayISO()}`} replace />} />
        <Route path="/day/:iso" element={<Day />} />
        <Route path="/cat" element={<Cat />} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
