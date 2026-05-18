import React from "react";
import { Link } from "react-router-dom";
import "./index.css"; // Optional: for styling

const Unauthorized: React.FC = () => {
  return (
    <div className="unauthorized-container">
      <h1>403 - Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link to="/">Go to Home</Link>
    </div>
  );
};

export default Unauthorized;
