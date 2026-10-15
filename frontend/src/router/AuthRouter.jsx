import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/pages/Login';

export default function AuthRouter() {
  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Navigate to="/login" replace />} path="/logout" />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
