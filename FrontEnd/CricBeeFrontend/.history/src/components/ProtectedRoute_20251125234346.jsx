
// import { Navigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import { selectUser, selectIsAuthenticated, selectLoading, selectUserRole } from '@/store/slices/authSlice';


// export const USER_ROLES = {
//   ADMIN: 'admin',
//   ORGANIZER: 'organizer',
//   CLUB_MANAGER: 'club_manager',
//   PLAYER: 'player',
//   FAN: 'fan',
// };


// const normalizeRole = (role) => {
//   if (!role) return '';
//   return role.toLowerCase().replace(/\s+/g, '_');
// };


// const checkRole = (userRole, expectedRole) => {
//   return normalizeRole(userRole) === normalizeRole(expectedRole);
// };


// export const ProtectedRoute = ({ children }) => {
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// };

// // Admin Protected Route
// export const AdminProtectedRoute = ({ children }) => {
//   const user = useSelector(selectUser);
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }


//   if (user?.is_superadmin !== true && !checkRole(user?.role, USER_ROLES.ADMIN)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return children;
// };


// export const OrganizerProtectedRoute = ({ children }) => {
//   const userRole = useSelector(selectUserRole);
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   console.log("OrganizerProtectedRoute - User Role (normalized):", normalizeRole(userRole));
//   console.log("OrganizerProtectedRoute - isAuthenticated:", isAuthenticated);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }

//   if (!checkRole(userRole, USER_ROLES.ORGANIZER)) {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// };


// export const ClubManagerProtectedRoute = ({ children }) => {
//   const userRole = useSelector(selectUserRole);
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   console.log("ClubManagerProtectedRoute - User Role (normalized):", normalizeRole(userRole));  // Added log for debugging

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }

//   if (!checkRole(userRole, USER_ROLES.CLUB_MANAGER)) {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// };


// export const PlayerProtectedRoute = ({ children }) => {
//   const userRole = useSelector(selectUserRole);
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }

//   if (!checkRole(userRole, USER_ROLES.PLAYER)) {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// };

// // Fan Protected Route
// export const FanProtectedRoute = ({ children }) => {
//   const userRole = useSelector(selectUserRole);
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }

//   if (!checkRole(userRole, USER_ROLES.FAN)) {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// };


// export const MultiRoleProtectedRoute = ({ children, allowedRoles }) => {
//   const user = useSelector(selectUser);
//   const isAuthenticated = useSelector(selectIsAuthenticated);
//   const loading = useSelector(selectLoading);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/signin" replace />;
//   }


//   const hasAccess = user?.is_superadmin || 
//     allowedRoles.some(allowedRole => checkRole(user?.role, allowedRole));

//   if (!hasAccess) {
//     return <Navigate to="/signin" replace />;
//   }

//   return children;
// };