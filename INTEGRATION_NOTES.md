# Prastav frontend integration notes

## Included integration work

- Replaced mock request state in `src/context/AppContext.jsx` with Supabase reads.
- Added request category loading from `request_categories`.
- Added Save Draft (`create_request_draft`) and Submit (`submit_approval_request`) RPC integration.
- Added submission of a previously saved draft from its detail panel.
- Added approval decision (`decide_approval_step`) and send-back (`send_back_for_revision`) RPC calls.
- Updated Employee and Approver dashboards to use the current authenticated user and database-backed request data.
- Updated request modal categories to load from Supabase.
- Added account-status checking in protected routes.
- Added statuses to the status badge component.

## Expected database objects

This frontend expects the existing Prastav Supabase schema and RPCs already discussed in the project:

- `profiles`
- `request_categories` with `id`, `name`, and `is_active`
- `approval_requests`
- `approval_steps`
- RPC `create_request_draft(p_category_id, p_title, p_description, p_amount)`
- RPC `submit_approval_request(p_request_id)`
- RPC `decide_approval_step(p_step_id, p_decision, p_comment)`
- RPC `send_back_for_revision(p_step_id, p_comment)`

The request and approval-step queries use `select("*")` and map the known schema fields. The approver assignment mapper currently recognizes `assigned_approver_id`, `approver_id`, and `authorized_user_id`. Confirm the actual column used in your Supabase `approval_steps` table if assigned items do not appear.

## Not yet fully integrated

- Supporting-document input currently displays the selected filename only. It does not upload bytes to Supabase Storage.
- Admin user management still contains demo users. Secure user administration needs a trusted server-side/admin RPC; do not expose a service-role key in the browser.
- Admin analytics monthly chart data remains illustrative demo data. Proposal counts and proposal records use the connected request data.
- Audit display is derived from approval-step rows visible under current RLS, not a complete `approval_history` query.
- Editing an existing saved draft and revision/resubmission UI are not included in this pass.

## Security notes

- `.env.local` is intentionally excluded from this ZIP. Keep your own local file and never commit it.
- The frontend uses the Supabase publishable/anon key only. Never put a service-role or secret key in Vite environment variables.
- RLS and SECURITY DEFINER RPC authorization remain the security boundary. Frontend role checks are only a UI guard.

## Before production

1. Confirm the actual `approval_steps` assignee column matches one of the recognized names above.
2. Confirm `request_categories.is_active` and `request_categories.name` exist.
3. Confirm the profile `status` column exists and active accounts use `active` or `approved`.
4. Test employee draft creation, submission, approver decision, rejection, and send-back with separate test accounts.
5. Test with the actual Supabase RLS policies enabled.
