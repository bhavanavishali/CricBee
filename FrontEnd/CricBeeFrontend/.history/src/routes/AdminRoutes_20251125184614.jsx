import { Route, Routes } from "react-router-dom";

// import { ClubManagerProtectedRoute } from "../components/ProtectedRoute";

import Signin from "@/pages/admin/Signin"
import AdminDashboard from "@/pages/admin/Dashboard/admin-dashboard";
import UserManagement from "@/pages/admin/Usermanagement";

const AdminRoutes = () => {
  return (
    <Routes>
            <Route path="signin" element={<Signin/>} />
           <Route path="dashboard" element={<AdminDashboard/>} />
           <Route path="usermanagement" element={<UserManagement/>} />
    </Routes>
  );
};

export default AdminRoutes;