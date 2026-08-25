import "./App.css";
import {
  Route,
  Routes,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Calendar from "./pages/Calendar";
import ProtectedLayout from "./components/ProtectedLayout";
import LoginLayout from "./components/LoginLayout";
import Entries from "./pages/Entries";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import RolesEditor from "./pages/RolesEditor";
import NewEntry from "./pages/NewEntry";
import WorkChartsEditor from "./pages/WorkChartsEditor";
import NewUser from "./pages/NewUser";
import NewGroup from "./pages/NewGroup";
import Unauthorized from "./pages/Unauthorized";
import EditEntry from "./pages/EditEntry";
import GroupsEditor from "./pages/GroupsEditor";
import SwitchRole from "./pages/SwitchRole";
import { useEffect } from "react";

// Component to handle /today route redirect
const TodayRedirect = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return <Navigate to={`/entries/${year}/${month}/${day}`} replace />;
};

// Component to handle /today/new route redirect
const TodayNewRedirect = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return <Navigate to={`/entries/${year}/${month}/${day}/new`} replace />;
};

function App() {
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    interface StorageEvent {
      key: string | null;
    }

    const syncLogout = (event: StorageEvent) => {
      if (event.key === "logout") {
        // Redirect to login if a logout event is detected from another tab
        navigate("/login");
      }
    };

    window.addEventListener("storage", syncLogout);

    return () => {
      window.removeEventListener("storage", syncLogout);
    };
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();

        const pathRegex = /^\/entries\/(\d+)\/(\d+)\/(\d+)(\/new)?$/;
        const match = loc.pathname.match(pathRegex);

        if (match) {
          const year = match[1];
          const month = match[2];
          const day = match[3];
          navigate(`/entries/${year}/${month}/${day}/new`);
        } else {
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth() + 1;
          const day = today.getDate();
          navigate(`/entries/${year}/${month}/${day}/new`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, loc.pathname]);

  return (
    <Routes>
      <Route element={<LoginLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/entries/:year/:month/:day/new" element={<NewEntry />} />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Calendar />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users-editor" element={<RolesEditor />} />
        <Route
          path="/entries/:paramsYear/:paramsMonth/:paramsDay"
          element={<Entries />}
        />

        <Route path="/switch-role" element={<SwitchRole />} />
        <Route
          path="/calendar-user/:year/:month/:user"
          element={<Calendar />}
        />
        <Route path="/calendar/:year/:month" element={<Calendar />} />
        <Route path="/reports" element={<Reports />} />
        {/* Angular-style reports route */}
        <Route
          path="/reports/:type/:startDate/:endDate/:workChartId/:roles/:description/:hoursInBank"
          element={<Reports />}
        />
        <Route path="/work_charts/editor" element={<WorkChartsEditor />} />
        {/* Angular-style work charts editor routes */}
        <Route
          path="/work_charts/editor/:workChartId"
          element={<WorkChartsEditor />}
        />
        <Route
          path="/work_charts/editor/:workChartId/:tab"
          element={<WorkChartsEditor />}
        />
        <Route path="/create_user" element={<NewUser />} />
        <Route path="/create_group" element={<NewGroup />} />
        <Route path="/entries/:entryId/edit" element={<EditEntry />} />
        <Route path="groups-editor" element={<GroupsEditor />} />
        {/* Handle /today route */}
        <Route path="/today" element={<TodayRedirect />} />
        <Route path="/today/new" element={<TodayNewRedirect />} />

        {/* Catch-all route for any unmatched URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
