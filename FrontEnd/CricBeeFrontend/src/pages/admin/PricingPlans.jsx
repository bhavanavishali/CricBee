import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Settings,
  DollarSign,
  Trophy,
  Users,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  getPricingPlans,
  createPricingPlan,
  updatePricingPlan,
  updatePricingPlanStatus,
} from "@/api/adminService";
import Layout from "@/components/layouts/Layout";

const PricingPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    plan_name: "",
    plan_range: "",
    amount: "",
    status: "inactive",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const result = await getPricingPlans();
      if (result.success) {
        setPlans(result.data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Failed to fetch pricing plans",
        });
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch pricing plans",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      plan_name: "",
      plan_range: "",
      amount: "",
      status: "inactive",
    });
    setShowCreateModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_range: plan.plan_range,
      amount: plan.amount.toString(),
      status: plan.status,
    });
    setShowEditModal(true);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        plan_name: formData.plan_name,
        plan_range: formData.plan_range,
        amount: parseFloat(formData.amount),
        status: formData.status,
      };

      const result = await createPricingPlan(planData);
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Pricing plan created successfully",
        });
        setShowCreateModal(false);
        fetchPlans();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Failed to create pricing plan",
        });
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create pricing plan",
      });
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        plan_name: formData.plan_name,
        plan_range: formData.plan_range,
        amount: parseFloat(formData.amount),
        status: formData.status,
      };

      const result = await updatePricingPlan(editingPlan.id, planData);
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Pricing plan updated successfully",
        });
        setShowEditModal(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Failed to update pricing plan",
        });
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update pricing plan",
      });
    }
  };

  const handleStatusToggle = async (plan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    Swal.fire({
      title: `Are you sure?`,
      text: `Do you want to ${action} this pricing plan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, ${action} it!`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const updateResult = await updatePricingPlanStatus(plan.id, newStatus);
          if (updateResult.success) {
            Swal.fire({
              icon: "success",
              title: "Success",
              text: `Pricing plan ${action}d successfully`,
            });
            fetchPlans();
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: updateResult.message || `Failed to ${action} pricing plan`,
            });
          }
        } catch (error) {
          console.error(`Error ${action}ing plan:`, error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `Failed to ${action} pricing plan`,
          });
        }
      }
    });
  };

  // Calculate statistics
  const stats = {
    totalTournaments: plans.reduce((sum, plan) => sum + (plan.tournaments || 0), 0),
    totalRevenue: plans.reduce((sum, plan) => {
      const revenue = parseFloat(plan.revenue || 0);
      return sum + revenue;
    }, 0),
    activePlans: plans.filter((plan) => plan.status === "active").length,
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return "Free";
    return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
  };

  const formatRevenue = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <Layout title="Plans & Pricing Configuration" profilePath="/admin/profile">
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Plans & Pricing Configuration
              </h1>
              <p className="text-gray-600 mt-1">Dashboard &gt; Plan Management</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Plan
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tournaments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTournaments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRevenue(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePlans}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-gray-700" />
            <h2 className="text-2xl font-bold text-gray-900">
              Team-Based Pricing Configuration
            </h2>
          </div>
          <p className="text-gray-600 mb-6">
            Configure pricing based on the number of teams in tournaments. Plans are
            automatically assigned when organizers create tournaments.
          </p>

          {/* Plans Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-2 text-gray-600">Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No pricing plans found</p>
              <button
                onClick={handleCreate}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Create First Plan
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Plan Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Team Range
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tournaments
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Revenue
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">{plan.plan_name}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{plan.plan_range}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(plan.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {plan.tournaments || 0}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(plan.revenue || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            plan.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {plan.status === "active" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {plan.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(plan)}
                            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            title="Edit Plan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(plan)}
                            className={`p-2 rounded transition-colors ${
                              plan.status === "active"
                                ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={plan.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {plan.status === "active" ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-gray-700" />
            <h3 className="text-xl font-bold text-gray-900">
              How Team-Based Pricing Works
            </h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Organizers create tournaments and specify the number of teams they want to enroll.</li>
            <li>Based on the team count, the system automatically selects the appropriate pricing plan.</li>
            <li>Payment is processed according to the selected plan's pricing before tournament activation.</li>
          </ol>
        </div>

        {/* Pricing Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-green-600" />
              <h4 className="font-semibold text-gray-900">4 Teams Tournament</h4>
            </div>
            <p className="text-2xl font-bold text-green-700">Free Plan (₹0)</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h4 className="font-semibold text-gray-900">8 Teams Tournament</h4>
            </div>
            <p className="text-2xl font-bold text-blue-700">Standard Plan (₹10,000)</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-purple-600" />
              <h4 className="font-semibold text-gray-900">16 Teams Tournament</h4>
            </div>
            <p className="text-2xl font-bold text-purple-700">Premium Plan (₹15,000)</p>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Pricing Plan</h3>
              <form onSubmit={handleSubmitCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plan_name}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., Free Plan, Standard Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Range
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plan_range}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_range: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., 1-4 teams, 5-10 teams, 11-∞ teams"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Create Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Edit Pricing Plan</h3>
              <form onSubmit={handleSubmitEdit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plan_name}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Range
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plan_range}
                      onChange={(e) =>
                        setFormData({ ...formData, plan_range: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPlan(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Update Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PricingPlans;

