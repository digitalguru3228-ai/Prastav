
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

const requestStatusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In review",
  revision_required: "Revision required",
  resubmitted: "In review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const stepStatusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  sent_back: "Sent back",
  skipped: "Skipped",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatAuthority = (value) =>
  (value || "Approver")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getRpcRequestId = (data) => {
  if (typeof data === "string") return data;

  if (Array.isArray(data)) return getRpcRequestId(data[0]);

  if (data && typeof data === "object") {
    return (
      data.id ||
      data.request_id ||
      data.create_request_draft ||
      null
    );
  }

  return null;
};

export function AppProvider({ children }) {
  const { authUser, profile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = useMemo(
    () =>
      profile
        ? {
            id: profile.id,
            name: profile.full_name || profile.email || "Prastav User",
            email: profile.email,
            role: profile.role,
            department: profile.department || "Not assigned",
            status: profile.status || "active",
          }
        : null,
    [profile]
  );

  const refreshCategories = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("request_categories")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (queryError) throw queryError;

    setCategories(
      (data || []).map((item) => ({
        id: item.id,
        name: item.name || item.category_name || "Unnamed category",
        description: item.description || "",
      }))
    );
  }, []);

  const refreshRequests = useCallback(async () => {
    if (!authUser?.id) {
      setRequests([]);
      return;
    }

    const { data: requestRows, error: requestError } = await supabase
      .from("approval_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) throw requestError;

    const rows = requestRows || [];

    if (!rows.length) {
      setRequests([]);
      return;
    }

    const requestIds = rows.map((row) => row.id);

    const categoryIds = [
      ...new Set(rows.map((row) => row.category_id).filter(Boolean)),
    ];

    const [categoryResult, stepResult] = await Promise.all([
      categoryIds.length
        ? supabase
            .from("request_categories")
            .select("*")
            .in("id", categoryIds)
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from("approval_steps")
        .select("*")
        .in("request_id", requestIds)
        .order("step_order", { ascending: true }),
    ]);

    if (categoryResult.error) throw categoryResult.error;
    if (stepResult.error) throw stepResult.error;

    const categoryMap = new Map(
      (categoryResult.data || []).map((item) => [
        item.id,
        item.name || item.category_name || "Uncategorized",
      ])
    );

    const steps = stepResult.data || [];

    const approverIds = [
      ...new Set(
        steps
          .map(
            (step) =>
              step.assigned_approver_id ||
              step.approver_id ||
              step.authorized_user_id
          )
          .filter(Boolean)
      ),
    ];

    let profileMap = new Map();

    if (approverIds.length) {
      const { data: people, error: peopleError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", approverIds);

      // A profile visibility policy may intentionally hide other users.
      if (!peopleError) {
        profileMap = new Map(
          (people || []).map((person) => [
            person.id,
            person.full_name,
          ])
        );
      }
    }

    const mapped = rows.map((row) => {
      const rowSteps = steps.filter(
        (step) => step.request_id === row.id
      );

      const activeStep =
        rowSteps.find(
          (step) =>
            step.status === "pending" &&
            (step.step_order === row.current_step_order ||
              row.current_step_order == null)
        ) || rowSteps.find((step) => step.status === "pending");

      const approvals = rowSteps.map((step) => {
        const assignedId =
          step.assigned_approver_id ||
          step.approver_id ||
          step.authorized_user_id;

        return {
          id: step.id,
          role: formatAuthority(
            step.authority_key || step.authority || step.role
          ),
          name: assignedId
            ? profileMap.get(assignedId) || "Assigned approver"
            : "Pending assignment",
          status: stepStatusLabels[step.status] || step.status,
          comment: step.decision_comment || step.comment || "",
          date: formatDate(step.acted_at || step.updated_at),
          stepOrder: step.step_order,
          assignedApproverId: assignedId || null,
        };
      });

      const status = row.status;

      return {
        id: row.id,
        requesterId: row.requester_id,
        title: row.title,
        description: row.description,
        amount: Number(row.amount || 0),
        category: categoryMap.get(row.category_id) || "Uncategorized",
        categoryId: row.category_id,

        submittedBy:
          row.requester_id === authUser.id
            ? currentUser?.name || "You"
            : row.requester_name || "Employee",

        department:
          row.requester_id === authUser.id
            ? currentUser?.department || "Not assigned"
            : row.department || "Not assigned",

        submitted: formatDate(row.submitted_at || row.created_at),
        status: requestStatusLabels[status] || status,
        databaseStatus: status,

        stage: activeStep
          ? formatAuthority(
              activeStep.authority_key ||
                activeStep.authority ||
                activeStep.role
            )
          : status === "approved"
            ? "Completed"
            : "—",

        currentStepOrder: row.current_step_order,
        workflowVersion: row.workflow_version,
        revisionCount: row.revision_count || 0,
        approvals,

        hasAssignedStep: rowSteps.some(
          (step) =>
            (step.assigned_approver_id ||
              step.approver_id ||
              step.authorized_user_id) === authUser.id
        ),

        assignedStepId:
          rowSteps.find(
            (step) =>
              (step.assigned_approver_id ||
                step.approver_id ||
                step.authorized_user_id) === authUser.id &&
              step.status === "pending"
          )?.id || null,

        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    setRequests(mapped);
  }, [authUser?.id, currentUser]);

  const refreshData = useCallback(async () => {
    if (!authUser?.id || !profile) {
      setRequests([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await Promise.all([
        refreshRequests(),
        refreshCategories(),
      ]);
    } catch (err) {
      console.error("Unable to load Prastav data:", err);
      setError(err.message || "Unable to load Prastav data.");
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, profile, refreshRequests, refreshCategories]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const createDraft = useCallback(
    async ({ categoryId, title, description, amount }) => {
      if (!authUser?.id) {
        throw new Error("Please sign in before creating a proposal.");
      }

      if (!categoryId) {
        throw new Error("Please select a valid request category.");
      }

      const { data, error: rpcError } = await supabase.rpc(
        "create_request_draft",
        {
          p_category_id: categoryId,
          p_title: title.trim(),
          p_description: description.trim(),
          p_amount: Number(amount),
        }
      );

      if (rpcError) throw rpcError;

      const requestId = getRpcRequestId(data);

      await refreshRequests();

      return requestId;
    },
    [authUser?.id, refreshRequests]
  );

  const submitRequest = useCallback(
    async (requestId) => {
      if (!requestId) {
        throw new Error(
          "The draft was saved, but its ID was not returned."
        );
      }

      const { data, error: rpcError } = await supabase.rpc(
        "submit_approval_request",
        {
          p_request_id: requestId,
        }
      );

      if (rpcError) throw rpcError;

      await refreshRequests();

      return data;
    },
    [refreshRequests]
  );

  const decideApprovalStep = useCallback(
    async (stepId, decision, comment = "") => {
      if (!stepId) {
        throw new Error(
          "No pending approval step is assigned to your account."
        );
      }

      const dbDecision = decision.toLowerCase();

      const { data, error: rpcError } = await supabase.rpc(
        "decide_approval_step",
        {
          p_step_id: stepId,
          p_decision: dbDecision,
          p_comment: comment || null,
        }
      );

      if (rpcError) throw rpcError;

      await refreshRequests();

      return data;
    },
    [refreshRequests]
  );

  const sendBackForRevision = useCallback(
    async (stepId, comment) => {
      if (!stepId) {
        throw new Error(
          "No pending approval step is assigned to your account."
        );
      }

      const { data, error: rpcError } = await supabase.rpc(
        "send_back_for_revision",
        {
          p_step_id: stepId,
          p_comment: comment,
        }
      );

      if (rpcError) throw rpcError;

      await refreshRequests();

      return data;
    },
    [refreshRequests]
  );

  const value = useMemo(
    () => ({
      requests,
      categories,
      currentUser,
      loading,
      error,
      refreshRequests,
      refreshCategories,
      refreshData,
      createDraft,
      submitRequest,
      decideApprovalStep,
      sendBackForRevision,
    }),
    [
      requests,
      categories,
      currentUser,
      loading,
      error,
      refreshRequests,
      refreshCategories,
      refreshData,
      createDraft,
      submitRequest,
      decideApprovalStep,
      sendBackForRevision,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
