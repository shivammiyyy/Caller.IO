import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import {Dashboard} from "./pages/Dashboard/Dashboard";
import UserContext from "./context/userContextApi";

const App = () => {
  const { isLoggedIn } = useContext(UserContext);

  return (
    <Router>
      <Routes>
        {/* if logged in → Dashboard, else redirect to /login */}
        <Route
          path="/"
          element={
            isLoggedIn
               ?<Dashboard />
              : <Navigate to="/login" replace />
          }
        />

        {/* public routes */}
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/signup" element={<Auth type="signup" />} />

        {/* catch‐all: redirect unknown paths */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

export default App;
