import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only: returns all workflows
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const workflows = await base44.asServiceRole.entities.Workflow.list('-sort_order', 200);
    return Response.json({ workflows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});