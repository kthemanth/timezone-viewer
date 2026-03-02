import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Month from "../pages/Month";
import Day from "../pages/Day";
import Cat from "../pages/Cat";
import NotFound from "../pages/NotFound";


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Month />} />
        <Route path="/day" element={<Day />} />
        <Route path="/cat" element={<Cat />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
