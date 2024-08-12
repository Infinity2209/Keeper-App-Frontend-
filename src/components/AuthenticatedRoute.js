/* eslint-disable no-unused-vars */
import React from "react";
import { Route, useLocation, Routes, useNavigate } from "react-router-dom";
import { useAppContext } from "../libs/contextLib";

export default function AuthenticatedRoute({ children, ...rest }) {
  const { pathname, search } = useLocation();
  const { isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route {...rest} element={isAuthenticated ? children : <navigate to={`/login?redirect=${pathname}${search}`} replace />} />
    </Routes>
  );
}
