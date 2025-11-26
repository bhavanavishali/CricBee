
// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const UserManagement = () => {
//   const [search, setSearch] = useState("");
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch users from API
//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await axios.get("http://localhost:8000/admin/users", {
//         withCredentials: true, // Important: sends cookies with request
//       });
      
//       setUsers(response.data);
//     } catch (err) {
//       console.error("Error fetching users:", err);
//       setError(err.response?.data?.detail || "Failed to fetch users");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Block/Unblock user
//   const handleToggleStatus = async (userId, currentStatus) => {
//     try {
//       const newStatus = !currentStatus;
      
//       await axios.patch(
//         `http://localhost:8000/admin/users/${userId}/status`,
//         { is_active: newStatus },
//         { withCredentials: true }
//       );
      
//       // Update local state
//       setUsers(users.map(user => 
//         user.id === userId ? { ...user, is_active: newStatus } : user
//       ));
      
//       alert(`User ${newStatus ? 'activated' : 'blocked'} successfully!`);
//     } catch (err) {
//       console.error("Error updating user status:", err);
//       alert(err.response?.data?.detail || "Failed to update user status");
//     }
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
//   };

//   // Get role display name
//   const getRoleDisplay = (role) => {
//     const roleMap = {
//       "Organizer": "organizer",
//       "Club Manager": "manager",
//       "Player": "player",
//       "Fan": "fan"
//     };
//     return roleMap[role] || role.toLowerCase();
//   };

//   const filteredUsers = users.filter((u) =>
//     u.full_name.toLowerCase().includes(search.toLowerCase()) ||
//     u.email.toLowerCase().includes(search.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
//         <div className="text-xl text-gray-600">Loading users...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6 bg-gray-50 min-h-screen">
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//           <p className="font-bold">Error</p>
//           <p>{error}</p>
//           <button 
//             onClick={fetchUsers}
//             className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <h1 className="text-2xl font-bold mb-4">User Management</h1>

//       {/* Search Filter */}
//       <div className="mb-6">
//         <input
//           type="text"
//           placeholder="Search by name or email..."
//           className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {/* User Table */}
//       <div className="bg-white rounded-xl shadow p-4">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold">
//             All Users ({filteredUsers.length})
//           </h2>
//           <button 
//             onClick={fetchUsers}
//             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//           >
//             Refresh
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead>
//               <tr className="border-b">
//                 <th className="py-2">User</th>
//                 <th className="py-2">Role</th>
//                 <th className="py-2">Status</th>
//                 <th className="py-2">Registered</th>
//                 <th className="py-2 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredUsers.map((user) => (
//                 <tr key={user.id} className="border-b hover:bg-gray-100">
//                   <td className="py-3">
//                     <div className="font-medium">{user.full_name}</div>
//                     <div className="text-sm text-gray-500">{user.email}</div>
//                   </td>

//                   <td className="capitalize">{getRoleDisplay(user.role)}</td>

//                   <td>
//                     <span
//                       className={`px-2 py-1 rounded text-xs ${
//                         user.is_active
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-700"
//                       }`}
//                     >
//                       {user.is_active ? "Active" : "Blocked"}
//                     </span>
//                   </td>

//                   <td>{formatDate(user.created_at)}</td>

//                   <td className="py-3">
//                     <div className="flex items-center gap-3 justify-center">
//                       {/* Block/Unblock Toggle */}
//                       {user.is_active ? (
//                         <button 
//                           onClick={() => handleToggleStatus(user.id, user.is_active)}
//                           className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
//                           title="Block User"
//                         >
//                           Block
//                         </button>
//                       ) : (
//                         <button 
//                           onClick={() => handleToggleStatus(user.id, user.is_active)}
//                           className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
//                           title="Activate User"
//                         >
//                           Activate
//                         </button>
//                       )}

//                       {/* View Details */}
//                       <button 
//                         className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
//                         title="View Details"
//                       >
//                         View
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {filteredUsers.length === 0 && (
//           <p className="text-center text-gray-500 py-4">No users found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserManagement;