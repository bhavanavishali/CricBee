
// "use client"

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { 
//   Search, 
//   Eye, 
//   Mail, 
//   Ban, 
//   CheckCircle, 
//   XCircle,
//   ArrowLeft,
//   UserCheck,
//   Users,
//   Shield,
//   AlertCircle,
//   Clock,
//   Calendar
// } from "lucide-react";
// import Swal from "sweetalert2";
// import { getUsers, updateUserStatus, getUserDetails } from "@/api/adminService";
// import Layout from "@/components/layouts/Layout";

// const UserManagement = () => {
//   const navigate = useNavigate();
//   const [search, setSearch] = useState("");
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [roleFilter, setRoleFilter] = useState("all");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [showUserDetails, setShowUserDetails] = useState(false);

//   // Fetch users from API
//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Filter users when search, role, or status changes
//   useEffect(() => {
//     filterUsers();
//   }, [search, roleFilter, statusFilter, users]);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const result = await getUsers();
//       if (result.success) {
//         setUsers(result.data);
//       } else {
//         setError(result.message);
//       }
//     } catch (err) {
//       console.error("Error fetching users:", err);
//       setError("Failed to fetch users");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filterUsers = () => {
//     let filtered = [...users];

//     // Search filter
//     if (search) {
//       const searchLower = search.toLowerCase();
//       filtered = filtered.filter(
//         (u) =>
//           u.full_name?.toLowerCase().includes(searchLower) ||
//           u.email?.toLowerCase().includes(searchLower) ||
//           u.organization_name?.toLowerCase().includes(searchLower)
//       );
//     }

//     // Role filter
//     if (roleFilter !== "all") {
//       filtered = filtered.filter((u) => {
//         const role = u.role?.toLowerCase();
//         if (roleFilter === "organizer") return role === "organizer";
//         if (roleFilter === "manager") return role === "club_manager" || role === "manager";
//         if (roleFilter === "player") return role === "player";
//         if (roleFilter === "fan") return role === "fan";
//         return true;
//       });
//     }

//     // Status filter
//     if (statusFilter !== "all") {
//       if (statusFilter === "pending") {
//         filtered = filtered.filter((u) => !u.is_verified);
//       } else if (statusFilter === "active") {
//         filtered = filtered.filter((u) => u.is_active && u.is_verified);
//       } else if (statusFilter === "suspended") {
//         filtered = filtered.filter((u) => !u.is_active);
//       }
//     }

//     setFilteredUsers(filtered);
//   };

//   // Block/Unblock user with SweetAlert confirmation
//   const handleToggleStatus = async (userId, currentStatus, userName) => {
//     const action = currentStatus ? "block" : "unblock";
//     const actionText = currentStatus ? "Block" : "Unblock";
//     const confirmText = currentStatus
//       ? "This user will be blocked and unable to access the platform."
//       : "This user will be unblocked and regain access to the platform.";

//     const result = await Swal.fire({
//       title: `${actionText} User?`,
//       html: `
//         <div class="text-left">
//           <p class="mb-3">Are you sure you want to ${action} <strong>${userName}</strong>?</p>
//           <p class="text-sm text-gray-600">${confirmText}</p>
//         </div>
//       `,
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: currentStatus ? "#ef4444" : "#10b981",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: `Yes, ${actionText}`,
//       cancelButtonText: "Cancel",
//       reverseButtons: true,
//     });

//     if (result.isConfirmed) {
//       try {
//         const newStatus = !currentStatus;
//         const updateResult = await updateUserStatus(userId, newStatus);

//         if (updateResult.success) {
//           // Update local state
//           setUsers(
//             users.map((user) =>
//               user.id === userId ? { ...user, is_active: newStatus } : user
//             )
//           );

//           await Swal.fire({
//             title: "Success!",
//             text: `User has been ${action}ed successfully.`,
//             icon: "success",
//             confirmButtonColor: "#10b981",
//             timer: 2000,
//           });
//         } else {
//           throw new Error(updateResult.message);
//         }
//       } catch (err) {
//         console.error("Error updating user status:", err);
//         await Swal.fire({
//           title: "Error!",
//           text: err.message || "Failed to update user status",
//           icon: "error",
//           confirmButtonColor: "#ef4444",
//         });
//       }
//     }
//   };

//   // View user details
//   const handleViewDetails = async (userId) => {
//     try {
//       const result = await getUserDetails(userId);
//       if (result.success) {
//         setSelectedUser(result.data);
//         setShowUserDetails(true);
//       } else {
//         await Swal.fire({
//           title: "Error!",
//           text: result.message || "Failed to fetch user details",
//           icon: "error",
//           confirmButtonColor: "#ef4444",
//         });
//       }
//     } catch (err) {
//       console.error("Error fetching user details:", err);
//       await Swal.fire({
//         title: "Error!",
//         text: "Failed to fetch user details",
//         icon: "error",
//         confirmButtonColor: "#ef4444",
//       });
//     }
//   };

//   // Calculate statistics
//   const stats = {
//     total: users.length,
//     pending: users.filter((u) => !u.is_verified).length,
//     active: users.filter((u) => u.is_active && u.is_verified).length,
//     suspended: users.filter((u) => !u.is_active).length,
//     organizers: users.filter((u) => u.role?.toLowerCase() === "organizer").length,
//     managers: users.filter(
//       (u) => u.role?.toLowerCase() === "club_manager" || u.role?.toLowerCase() === "manager"
//     ).length,
//     players: users.filter((u) => u.role?.toLowerCase() === "player").length,
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
//   };

//   // Get role display name and color
//   const getRoleInfo = (role) => {
//     const roleLower = role?.toLowerCase() || "";
//     const roleMap = {
//       organizer: { label: "organizer", color: "bg-purple-100 text-purple-700" },
//       club_manager: { label: "manager", color: "bg-blue-100 text-blue-700" },
//       manager: { label: "manager", color: "bg-blue-100 text-blue-700" },
//       player: { label: "player", color: "bg-green-100 text-green-700" },
//       fan: { label: "fan", color: "bg-gray-100 text-gray-700" },
//       admin: { label: "admin", color: "bg-red-100 text-red-700" },
//     };
//     return roleMap[roleLower] || { label: roleLower, color: "bg-gray-100 text-gray-700" };
//   };

//   // Get status info
//   const getStatusInfo = (user) => {
//     if (!user.is_active) {
//       return {
//         label: "suspended",
//         color: "bg-red-100 text-red-700",
//         icon: <AlertCircle size={14} className="text-red-600" />,
//       };
//     }
//     if (!user.is_verified) {
//       return {
//         label: "pending",
//         color: "bg-yellow-100 text-yellow-700",
//         icon: <Clock size={14} className="text-yellow-600" />,
//       };
//     }
//     return {
//       label: "active",
//       color: "bg-green-100 text-green-700",
//       icon: <CheckCircle size={14} className="text-green-600" />,
//     };
//   };

//   // Get verification info
//   const getVerificationInfo = (user) => {
//     if (user.is_verified) {
//       return {
//         label: "Verified",
//         badges: [
//           <span key="verified" className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
//             Verified
//           </span>,
//         ],
//       };
//     }
//     return {
//       label: "Unverified",
//       badges: [
//         <span key="unverified" className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
//           Unverified
//         </span>,
//       ],
//     };
//   };

//   // Get user avatar initial
//   const getAvatarInitial = (user) => {
//     if (user.full_name) {
//       const names = user.full_name.split(" ");
//       if (names.length >= 2) {
//         return (names[0][0] + names[1][0]).toUpperCase();
//       }
//       return user.full_name.charAt(0).toUpperCase();
//     }
//     return "U";
//   };

//   if (loading) {
//     return (
//       <Layout title="User & Role Management" showFooter={false}>
//         <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
//           <div className="text-xl text-gray-600">Loading users...</div>
//         </div>
//       </Layout>
//     );
//   }

//   if (error && users.length === 0) {
//     return (
//       <Layout title="User & Role Management" showFooter={false}>
//         <div className="p-6 bg-gray-50 min-h-screen">
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//             <p className="font-bold">Error</p>
//             <p>{error}</p>
//             <button
//               onClick={fetchUsers}
//               className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout title="User & Role Management" showFooter={false}>
//       <div className="min-h-screen bg-gray-50">
//         {/* Back to Dashboard Link */}
//         <div className="bg-white border-b border-gray-200">
//           <div className="max-w-7xl mx-auto px-6 py-4">
//             <button
//               onClick={() => navigate("/admin/dashboard")}
//               className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
//             >
//               <ArrowLeft size={20} />
//               <span className="font-medium">Back to Admin Dashboard</span>
//             </button>
//           </div>
//         </div>

//         <div className="max-w-7xl mx-auto px-6 py-8">
          
//           <div className="flex flex-wrap md:flex-nowrap gap-4 mb-8">
//             <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
//               <p className="text-sm text-gray-600 mb-1">Total Users</p>
//               <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
//             </div>
//             <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
//               <p className="text-sm text-gray-600 mb-1">Pending</p>
//               <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
//             </div>
//             <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
//               <p className="text-sm text-gray-600 mb-1">Active</p>
//               <p className="text-2xl font-bold text-green-600">{stats.active}</p>
//             </div>
//             <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
//               <p className="text-sm text-gray-600 mb-1">Suspended</p>
//               <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
//             </div>
//             <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
//               <p className="text-sm text-gray-600 mb-1">Organizers</p>
//               <p className="text-2xl font-bold text-purple-600">{stats.organizers}</p>
//             </div>
//             <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
//               <p className="text-sm text-gray-600 mb-1">Managers</p>
//               <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
//             </div>
//           </div>

//           {/* Search and Filters */}
//           <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
//             <div className="flex flex-col md:flex-row gap-4">
//               {/* Search */}
//               <div className="flex-1 relative">
//                 <Search
//                   size={20}
//                   className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Search by name or email..."
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>

//               {/* Role Filter */}
//               <select
//                 value={roleFilter}
//                 onChange={(e) => setRoleFilter(e.target.value)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="all">All Roles</option>
//                 <option value="organizer">Organizers</option>
//                 <option value="manager">Managers</option>
//                 <option value="player">Players</option>
//                 <option value="fan">Fans</option>
//               </select>

//               {/* Status Filter */}
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="all">All Status</option>
//                 <option value="pending">Pending</option>
//                 <option value="active">Active</option>
//                 <option value="suspended">Suspended</option>
//               </select>
//             </div>
//           </div>

//           {/* User Table */}
//           <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//             <div className="px-6 py-4 border-b border-gray-200">
//               <h2 className="text-lg font-semibold text-gray-900">
//                 All Users ({filteredUsers.length})
//               </h2>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50 border-b border-gray-200">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       User
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Role
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Verification
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Registration
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Last Active
//                     </th>
//                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredUsers.map((user) => {
//                     const roleInfo = getRoleInfo(user.role);
//                     const statusInfo = getStatusInfo(user);
//                     const verificationInfo = getVerificationInfo(user);

//                     return (
//                       <tr key={user.id} className="hover:bg-gray-50 transition-colors">
//                         {/* User Column */}
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center gap-3">
//                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
//                               <span className="text-sm font-bold text-blue-700">
//                                 {getAvatarInitial(user)}
//                               </span>
//                             </div>
//                             <div>
//                               <div className="font-medium text-gray-900">
//                                 {user.full_name || user.organization_name || "N/A"}
//                               </div>
//                               <div className="text-sm text-gray-500">{user.email}</div>
//                               {user.location && (
//                                 <div className="text-xs text-gray-400">{user.location}</div>
//                               )}
//                             </div>
//                           </div>
//                         </td>

//                         {/* Role Column */}
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span
//                             className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}
//                           >
//                             {roleInfo.label}
//                           </span>
//                         </td>

//                         {/* Status Column */}
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center gap-2">
//                             {statusInfo.icon}
//                             <span
//                               className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
//                             >
//                               {statusInfo.label}
//                             </span>
//                           </div>
//                         </td>

//                         {/* Verification Column */}
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center gap-2 flex-wrap">
//                             {verificationInfo.badges}
//                           </div>
//                         </td>

//                         {/* Registration Column */}
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                           {formatDate(user.created_at)}
//                         </td>

//                         {/* Last Active Column */}
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
//                           {formatDate(user.last_active || user.created_at)}
//                         </td>

//                         {/* Actions Column */}
//                         <td className="px-6 py-4 whitespace-nowrap text-center">
//                           <div className="flex items-center justify-center gap-2">
//                             {/* Block/Unblock Button */}
//                             {user.is_active ? (
//                               <button
//                                 onClick={() =>
//                                   handleToggleStatus(
//                                     user.id,
//                                     user.is_active,
//                                     user.full_name || user.organization_name
//                                   )
//                                 }
//                                 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                                 title="Block User"
//                               >
//                                 <Ban size={18} />
//                               </button>
//                             ) : (
//                               <button
//                                 onClick={() =>
//                                   handleToggleStatus(
//                                     user.id,
//                                     user.is_active,
//                                     user.full_name || user.organization_name
//                                   )
//                                 }
//                                 className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                                 title="Unblock User"
//                               >
//                                 <CheckCircle size={18} />
//                               </button>
//                             )}

//                             {/* View Details Button */}
//                             <button
//                               onClick={() => handleViewDetails(user.id)}
//                               className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                               title="View Details"
//                             >
//                               <Eye size={18} />
//                             </button>

//                             {/* Message Button */}
//                             <button
//                               className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
//                               title="Send Message"
//                             >
//                               <Mail size={18} />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>

//               {filteredUsers.length === 0 && (
//                 <div className="text-center py-12">
//                   <Users size={48} className="mx-auto text-gray-400 mb-4" />
//                   <p className="text-gray-500 text-lg">No users found</p>
//                   <p className="text-gray-400 text-sm mt-2">
//                     Try adjusting your search or filters
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* User Details Modal */}
//         {showUserDetails && selectedUser && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//               <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//                 <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
//                 <button
//                   onClick={() => {
//                     setShowUserDetails(false);
//                     setSelectedUser(null);
//                   }}
//                   className="text-gray-400 hover:text-gray-600"
//                 >
//                   <XCircle size={24} />
//                 </button>
//               </div>
//               <div className="px-6 py-4 space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Full Name</label>
//                     <p className="text-gray-900">{selectedUser.full_name || "N/A"}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Email</label>
//                     <p className="text-gray-900">{selectedUser.email}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Role</label>
//                     <p className="text-gray-900 capitalize">{selectedUser.role || "N/A"}</p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Status</label>
//                     <p className="text-gray-900">
//                       {selectedUser.is_active ? "Active" : "Blocked"}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Verification</label>
//                     <p className="text-gray-900">
//                       {selectedUser.is_verified ? "Verified" : "Unverified"}
//                     </p>
//                   </div>
//                   <div>
//                     <label className="text-sm font-medium text-gray-500">Registration Date</label>
//                     <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
//                 <button
//                   onClick={() => {
//                     setShowUserDetails(false);
//                     setSelectedUser(null);
//                   }}
//                   className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default UserManagement;


"use client"

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Eye, 
  Mail, 
  Ban, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Users,
  AlertCircle,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUsers, updateUserStatus, getUserDetails } from "@/api/adminService";
import Layout from "@/components/layouts/Layout";

const UserManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search, role, or status changes
  useEffect(() => {
    filterUsers();
  }, [search, roleFilter, statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.organization_name?.toLowerCase().includes(searchLower) ||
          u.club_name?.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => {
        const role = u.role?.toLowerCase();
        if (roleFilter === "organizer") return role === "organizer";
        if (roleFilter === "manager") return role === "club_manager" || role === "manager";
        if (roleFilter === "player") return role === "player";
        if (roleFilter === "fan") return role === "fan";
        return true;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter((u) => !u.is_verified);
      } else if (statusFilter === "active") {
        filtered = filtered.filter((u) => u.is_active && u.is_verified);
      } else if (statusFilter === "suspended") {
        filtered = filtered.filter((u) => !u.is_active);
      }
    }

    setFilteredUsers(filtered);
  };

  // Block/Unblock user with SweetAlert confirmation
  const handleToggleStatus = async (userId, currentStatus, userName) => {
    const action = currentStatus ? "block" : "unblock";
    const actionText = currentStatus ? "Block" : "Unblock";
    const confirmText = currentStatus
      ? "This user will be blocked and unable to access the platform."
      : "This user will be unblocked and regain access to the platform.";

    const result = await Swal.fire({
      title: `${actionText} User?`,
      html: `
        <div class="text-left">
          <p class="mb-3">Are you sure you want to ${action} <strong>${userName}</strong>?</p>
          <p class="text-sm text-gray-600">${confirmText}</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: currentStatus ? "#ef4444" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const newStatus = !currentStatus;
        const updateResult = await updateUserStatus(userId, newStatus);

        if (updateResult.success) {
          // Update local state
          setUsers(
            users.map((user) =>
              user.id === userId ? { ...user, is_active: newStatus } : user
            )
          );

          await Swal.fire({
            title: "Success!",
            text: `User has been ${action}ed successfully.`,
            icon: "success",
            confirmButtonColor: "#10b981",
            timer: 2000,
          });
        } else {
          throw new Error(updateResult.message);
        }
      } catch (err) {
        console.error("Error updating user status:", err);
        await Swal.fire({
          title: "Error!",
          text: err.message || "Failed to update user status",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  // View user details
  const handleViewDetails = async (userId) => {
    try {
      const result = await getUserDetails(userId);
      if (result.success) {
        setSelectedUser(result.data);
        setShowUserDetails(true);
      } else {
        await Swal.fire({
          title: "Error!",
          text: result.message || "Failed to fetch user details",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      await Swal.fire({
        title: "Error!",
        text: "Failed to fetch user details",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  // Calculate statistics
  const stats = {
    total: users.length,
    pending: users.filter((u) => !u.is_verified).length,
    active: users.filter((u) => u.is_active && u.is_verified).length,
    suspended: users.filter((u) => !u.is_active).length,
    organizers: users.filter((u) => u.role?.toLowerCase() === "organizer").length,
    managers: users.filter(
      (u) => u.role?.toLowerCase() === "club_manager" || u.role?.toLowerCase() === "manager"
    ).length,
    players: users.filter((u) => u.role?.toLowerCase() === "player").length,
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  // Get role display name and color
  const getRoleInfo = (role) => {
    const roleLower = role?.toLowerCase() || "";
    const roleMap = {
      organizer: { label: "organizer", color: "bg-purple-100 text-purple-700" },
      club_manager: { label: "manager", color: "bg-blue-100 text-blue-700" },
      manager: { label: "manager", color: "bg-blue-100 text-blue-700" },
      player: { label: "player", color: "bg-green-100 text-green-700" },
      fan: { label: "fan", color: "bg-gray-100 text-gray-700" },
      admin: { label: "admin", color: "bg-red-100 text-red-700" },
    };
    return roleMap[roleLower] || { label: roleLower, color: "bg-gray-100 text-gray-700" };
  };

  // Get verification info
  const getVerificationInfo = (user) => {
    if (user.is_verified) {
      return {
        label: "Verified",
        badges: [
          <span key="verified" className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Verified
          </span>,
        ],
      };
    }
    return {
      label: "Unverified",
      badges: [
        <span key="unverified" className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          Unverified
        </span>,
      ],
    };
  };

  // Get user avatar initial
  const getAvatarInitial = (user) => {
    if (user.full_name) {
      const names = user.full_name.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return user.full_name.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Helper function to get organization/club name
  const getOrganizationOrClubName = (user) => {
    if (user.role?.toLowerCase() === "organizer" && user.organization_name) {
      return user.organization_name;
    }
    if ((user.role?.toLowerCase() === "club_manager" || user.role?.toLowerCase() === "manager") && user.club_name) {
      return user.club_name;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout title="User & Role Management" showFooter={false}>
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading users...</div>
        </div>
      </Layout>
    );
  }

  if (error && users.length === 0) {
    return (
      <Layout title="User & Role Management" showFooter={false}>
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User & Role Management" showFooter={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Back to Dashboard Link */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Admin Dashboard</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Statistics Cards - All in One Line (Responsive) */}
          <div className="flex flex-wrap md:flex-nowrap gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
              <p className="text-sm text-gray-600 mb-1">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
              <p className="text-sm text-gray-600 mb-1">Organizers</p>
              <p className="text-2xl font-bold text-purple-600">{stats.organizers}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1 min-w-[140px]">
              <p className="text-sm text-gray-600 mb-1">Managers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by name, email, organization or club..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="organizer">Organizers</option>
                <option value="manager">Managers</option>
                <option value="player">Players</option>
                <option value="fan">Fans</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Users ({filteredUsers.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization/Club
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role);
                    const verificationInfo = getVerificationInfo(user);
                    const orgOrClubName = getOrganizationOrClubName(user);

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        {/* User Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-blue-700">
                                {getAvatarInitial(user)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.full_name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        {/* Organization/Club Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {orgOrClubName ? (
                            <span className="text-sm font-medium text-gray-900">
                              {orgOrClubName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        {/* Verification Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {verificationInfo.badges}
                          </div>
                        </td>

                        {/* Registration Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>

                        {/* Actions Column */}
                       

                        {/* Actions Column */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Block/Unblock Button - Fixed logic */}
                            {user.is_active === true ? (
                              <button
                                onClick={() =>
                                  handleToggleStatus(
                                    user.id,
                                    user.is_active,
                                    user.full_name
                                  )
                                }
                                 className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="UnBlock User"
                              ><CheckCircle size={18}/>
                               
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleToggleStatus(
                                    user.id,
                                    user.is_active,
                                    user.full_name
                                  )
                                }
                                 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                               
                                title="Block User"
                              >
                                 <Ban size={18} />
                              </button>
                            )}

                            {/* View Details Button */}
                            <button
                              onClick={() => handleViewDetails(user.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>

                           
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No users found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{selectedUser.full_name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-gray-900 capitalize">{selectedUser.role || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900">
                      {selectedUser.is_active ? "Active" : "Blocked"}
                    </p>
                  </div>
                  {selectedUser.organization_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Organization</label>
                      <p className="text-gray-900">{selectedUser.organization_name}</p>
                    </div>
                  )}
                  {selectedUser.club_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Club</label>
                      <p className="text-gray-900">{selectedUser.club_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Verification</label>
                    <p className="text-gray-900">
                      {selectedUser.is_verified ? "Verified" : "Unverified"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;