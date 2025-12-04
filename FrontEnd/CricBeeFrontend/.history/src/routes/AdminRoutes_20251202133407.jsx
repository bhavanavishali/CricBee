import { Route, Routes } from "react-router-dom";

// import { ClubManagerProtectedRoute } from "../components/ProtectedRoute";

import Signin from "@/pages/admin/Signin"
import AdminDashboard from "@/pages/admin/Dashboard/admin-dashboard";
import UserManagement from "@/pages/admin/Usermanagement";
import PricingPlans from "@/pages/admin/PricingPlans";
import Transactions from "@/pages/admin/Transaction";

const AdminRoutes = () => {
  return (
    <Routes>
            <Route path="signin" element={<Signin/>} />
           <Route path="dashboard" element={<AdminDashboard/>} />
           <Route path="usermanagement" element={<UserManagement/>} />
           <Route path="plans" element={<PricingPlans/>} />
           <Route path="transaction" element={<PricingPlans/>} />
    </Routes>
  );
};

export default AdminRoutes;