
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



import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  selectUser, 
  selectIsAuthenticated, 
  selectLoading, 
  selectUserRole,
  selectIsUserActive,
  clearUser 
} from '@/store/slices/authSlice';
import store from '@/store/store';

export const USER_ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  CLUB_MANAGER: 'club_manager',
  PLAYER: 'player',
  FAN: 'fan',
};

const normalizeRole = (role) => {
  if (!role) return '';
  return role.toLowerCase().replace(/\s+/g, '_');
};

const checkRole = (userRole, expectedRole) => {
  return normalizeRole(userRole) === normalizeRole(expectedRole);
};

// Helper function to handle blocked user
const handleBlockedUser = () => {
  store.dispatch(clearUser());
  localStorage.removeItem("persist:root");
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  localStorage.removeItem("user");
  window.location.href = "/signin";
};

export const ProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    // Check if user is blocked
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  return children;
};

// Admin Protected Route
export const AdminProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  if (user?.is_superadmin !== true && !checkRole(user?.role, USER_ROLES.ADMIN)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export const OrganizerProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  if (!checkRole(userRole, USER_ROLES.ORGANIZER)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export const ClubManagerProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  if (!checkRole(userRole, USER_ROLES.CLUB_MANAGER)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export const PlayerProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  if (!checkRole(userRole, USER_ROLES.PLAYER)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

// Fan Protected Route
export const FanProtectedRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const userRole = useSelector(selectUserRole);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  if (!checkRole(userRole, USER_ROLES.FAN)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export const MultiRoleProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isActive = useSelector(selectIsUserActive);
  const loading = useSelector(selectLoading);

  useEffect(() => {
    if (user && user.is_active === false) {
      handleBlockedUser();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Check if user is active
  if (!isActive || user?.is_active === false) {
    handleBlockedUser();
    return null;
  }

  const hasAccess = user?.is_superadmin || 
    allowedRoles.some(allowedRole => checkRole(user?.role, allowedRole));

  if (!hasAccess) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};