
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Files,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Activity,
  Download,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import RequestTable from "../components/RequestTable";
import RequestDetails from "../components/RequestDetails";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

const chartColors = ["#2563eb", "#10b981", "#f59e0b", "#f43f5e"];

function formatRole(role) {
  if (!role) return "Not assigned";

  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function formatStatus(status) {
  if (!status) return "Not set";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminDashboard({ page = "overview" }) {
  const { requests } = useApp();

  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  // User management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch authenticated user and profiles
  useEffect(() => {
    let active = true;

    async function fetchUsers() {
      setUsersLoading(true);
      setUsersError("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (active) {
          setCurrentUserId(authData.user?.id || null);
        }

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, department, created_at, employee_id, account_status"
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (active) {
          setUsers(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);

        if (active) {
          setUsersError(error.message || "Unable to load users.");
          setUsers([]);
        }
      } finally {
        if (active) {
          setUsersLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      active = false;
    };
  }, []);

  // User statistics
  const activeUsers = users.filter(
    (user) => user.account_status?.toLowerCase() === "active"
  ).length;

  const pendingUsers = users.filter(
    (user) => user.account_status?.toLowerCase() === "pending"
  ).length;

  const rejectedUsers = users.filter(
    (user) => user.account_status?.toLowerCase() === "rejected"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.account_status?.toLowerCase() === "inactive"
  ).length;

  // Admin user actions
  async function handleUserAction(user, action, value = null) {
    if (user.id === currentUserId) {
      alert("You cannot change your own account.");
      return;
    }

    const messages = {
      approve: `Approve ${user.full_name}?`,
      reject: `Reject ${user.full_name}?`,
      activate: `Activate ${user.full_name}?`,
      deactivate: `Deactivate ${user.full_name}?`,
      change_role: `Change ${user.full_name}'s role to ${value}?`,
    };

    if (!window.confirm(messages[action] || "Continue with this action?")) {
      return;
    }

    setActionLoadingId(user.id);

    try {
      const { data, error } = await supabase.rpc("admin_manage_user", {
        p_user_id: user.id,
        p_action: action,
        p_value: value,
      });

      if (error) throw error;

      if (!data?.success || !data?.new_value) {
        throw new Error("The server did not confirm the user update.");
      }

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item.id === user.id
            ? { ...item, ...data.new_value }
            : item
        )
      );

      alert("User updated successfully.");
    } catch (error) {
      console.error("User management error:", error);
      alert(error.message || "Unable to update user.");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Proposal status chart
  const statuses = ["Pending", "In review", "Approved", "Rejected"].map(
    (name) => ({
      name,
      value: requests.filter((request) => request.status === name).length,
    })
  );

  // Demo chart data - connect to real reporting data later
  const monthly = [
    { month: "Jun", submitted: 8, approved: 5 },
    { month: "Jul", submitted: 12, approved: 9 },
    { month: "Aug", submitted: 10, approved: 8 },
    { month: "Sep", submitted: 15, approved: 11 },
    { month: "Oct", submitted: 18, approved: 14 },
    { month: "Nov", submitted: 9, approved: 6 },
  ];

  // Filter proposals
  const filtered = useMemo(
    () =>
      requests.filter((request) =>
        `${request.title} ${request.id} ${request.submittedBy}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [requests, search]
  );

  // Filter users
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.full_name || ""} ${user.email || ""} ${user.role || ""} ${
          user.department || ""
        } ${user.employee_id || ""} ${user.account_status || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [users, search]
  );

  // Approval activity
  const audit = requests
    .flatMap((request) =>
      (request.approvals || [])
        .filter(
          (approval) =>
            approval.status === "Approved" ||
            approval.status === "Rejected"
        )
        .map((approval) => ({
          id: request.id,
          title: request.title,
          actor: approval.name,
          action: approval.status,
          date: approval.date || request.submitted,
        }))
    )
    .slice(0, 12);

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Prastav Administration
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Platform overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor proposal activity, users and approval performance.
          </p>
        </div>

        <button
          onClick={() =>
            alert("Connect a reporting/export endpoint when the backend is ready.")
          }
          className="btn-secondary"
        >
          <Download size={16} />
          Export report
        </button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total proposals"
          value={requests.length}
          note="All submitted requests"
          icon={Files}
        />

        <StatCard
          label="Active users"
          value={usersLoading ? "..." : activeUsers}
          note="Active registered accounts"
          icon={Users}
          tone="violet"
        />

        <StatCard
          label="Approved proposals"
          value={requests.filter((r) => r.status === "Approved").length}
          note="Successfully completed"
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          label="Awaiting action"
          value={
            requests.filter((r) =>
              ["Pending", "In review"].includes(r.status)
            ).length
          }
          note="Across approval stages"
          icon={Clock3}
          tone="amber"
        />

        <StatCard
          label="Pending users"
          value={usersLoading ? "..." : pendingUsers}
          note="Awaiting administrator approval"
          icon={Clock3}
          tone="amber"
        />

        <StatCard
          label="Rejected users"
          value={usersLoading ? "..." : rejectedUsers}
          note="Rejected registrations"
          icon={ShieldCheck}
        />
      </div>

      {/* Overview and Analytics */}
      {(page === "overview" || page === "analytics") && (
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-bold text-slate-800">
                Proposal activity
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Monthly submissions and approvals · illustrative demo data
              </p>
            </div>

            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barGap={8}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf1f6"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="submitted"
                    name="Submitted"
                    fill="#2563eb"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="approved"
                    name="Approved"
                    fill="#10b981"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-800">
              Proposal status
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Current distribution
            </p>

            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statuses}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={57}
                    outerRadius={83}
                    paddingAngle={4}
                  >
                    {statuses.map((status, index) => (
                      <Cell
                        key={status.name}
                        fill={chartColors[index]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statuses.map((status, index) => (
                <div
                  key={status.name}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: chartColors[index] }}
                  />

                  {status.name}

                  <strong className="ml-auto text-slate-800">
                    {status.value}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* All Proposals */}
      {(page === "overview" || page === "proposals") && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h3 className="font-bold text-slate-800">
                All proposals
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Central view of every submitted proposal
              </p>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search proposals..."
                className="field !w-56 !py-2 !pl-9"
              />
            </div>
          </div>

          <RequestTable
            requests={filtered}
            showOwner
            onSelect={setSelected}
          />
        </section>
      )}

      {/* User Management */}
      {page === "users" && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h3 className="font-bold text-slate-800">
                User Management
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Manage registered employees, approvers and administrators.
              </p>
            </div>

            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="field !w-56 !py-2 !pl-9"
              />
            </div>
          </div>

          {/* User status summary */}
          {!usersLoading && !usersError && (
            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Active</p>
                <p className="mt-1 text-xl font-bold text-emerald-800">
                  {activeUsers}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Pending</p>
                <p className="mt-1 text-xl font-bold text-amber-800">
                  {pendingUsers}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-xs text-rose-700">Rejected</p>
                <p className="mt-1 text-xl font-bold text-rose-800">
                  {rejectedUsers}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <p className="text-xs text-slate-600">Inactive</p>
                <p className="mt-1 text-xl font-bold text-slate-800">
                  {inactiveUsers}
                </p>
              </div>
            </div>
          )}

          {usersLoading ? (
            <p className="p-6 text-sm text-slate-500">
              Loading users...
            </p>
          ) : usersError ? (
            <div className="p-6">
              <p className="text-sm font-semibold text-rose-600">
                Unable to load users
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {usersError}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">User</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const status = user.account_status?.toLowerCase();
                    const isSelf = user.id === currentUserId;
                    const isLoading = actionLoadingId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {user.full_name || "Unnamed user"}
                          </p>

                          <p className="text-xs text-slate-400">
                            {user.email}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {user.employee_id || "—"}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatRole(user.role)}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {user.department || "Not assigned"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : status === "rejected"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {formatStatus(user.account_status)}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {status === "pending" && (
                              <>
                                <button
                                  disabled={isLoading || isSelf}
                                  onClick={() =>
                                    handleUserAction(user, "approve")
                                  }
                                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isLoading ? "Please wait..." : "Approve"}
                                </button>

                                <button
                                  disabled={isLoading || isSelf}
                                  onClick={() =>
                                    handleUserAction(user, "reject")
                                  }
                                  className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {status === "active" && (
                              <button
                                disabled={isLoading || isSelf}
                                onClick={() =>
                                  handleUserAction(user, "deactivate")
                                }
                                className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Deactivate
                              </button>
                            )}

                            {(status === "inactive" ||
                              status === "rejected") && (
                              <button
                                disabled={isLoading || isSelf}
                                onClick={() =>
                                  handleUserAction(user, "activate")
                                }
                                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Activate
                              </button>
                            )}

                            <select
                              value={user.role || "employee"}
                              disabled={isLoading || isSelf}
                              onChange={(event) =>
                                handleUserAction(
                                  user,
                                  "change_role",
                                  event.target.value
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                              title={
                                isSelf
                                  ? "You cannot change your own role"
                                  : "Change user role"
                              }
                            >
                              <option value="employee">Employee</option>
                              <option value="approver">Approver</option>
                              <option value="admin">Admin</option>
                            </select>

                            {isSelf && (
                              <span className="text-[10px] text-slate-400">
                                Your account
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-slate-400"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!usersLoading && !usersError && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
              Showing {filteredUsers.length} of {users.length} registered users
            </div>
          )}
        </section>
      )}

      {/* Audit Log */}
      {page === "audit" && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">
              Approval activity log
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Decision events derived from the approval-step records currently visible to your account.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {audit.map((item, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-3 px-5 py-4"
              >
                <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
                  <Activity size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {item.actor}{" "}
                    <span className="font-normal text-slate-500">
                      {item.action.toLowerCase()} a proposal
                    </span>
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {item.title} · {item.id}
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold ${
                    item.action === "Approved"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {item.action}
                </span>

                <span className="text-xs text-slate-400">
                  {item.date}
                </span>
              </div>
            ))}

            {audit.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-400">
                No approval activity available.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Information */}
      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-blue-700" size={19} />

          <div>
            <p className="text-sm font-bold text-blue-900">
              Administrative transparency
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800/70">
              User directory and user-management actions are connected to
              Supabase. Monthly proposal activity charts still contain
              illustrative demo data. Account actions are recorded in
              admin_audit_logs.
            </p>
          </div>
        </div>
      </div>

      {/* Request details */}
      {selected && (
        <RequestDetails
          request={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </DashboardLayout>
  );
}
