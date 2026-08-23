import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PROJECT_NAME = 'IntraZone';
const OPERATORS = new Set(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'like', 'ilike', 'is', 'in']);
const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const jsonError = (message, status) => Response.json({ error: message }, { status });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return jsonError('Unauthorized', 401);
    if (!['admin', 'super_admin'].includes(user.role)) return jsonError('Forbidden', 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'query';
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');

    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!projectsResponse.ok) return jsonError('Unable to list Supabase projects', 502);

    const projects = await projectsResponse.json();
    const project = projects.find((item) =>
      String(item.name || '').toLowerCase() === PROJECT_NAME.toLowerCase()
    );
    if (!project) return jsonError(`Supabase project ${PROJECT_NAME} was not found`, 404);

    if (action === 'schema') {
      const schemaResponse = await fetch(
        `https://api.supabase.com/v1/projects/${project.id}/database/query/read-only`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: 'select * from information_schema.tables where table_schema = \'public\'' }),
        },
      );
      if (!schemaResponse.ok) return jsonError('Unable to inspect IntraZone schema', 502);
      return Response.json({ project: { id: project.id, name: project.name }, schema: await schemaResponse.json() });
    }

    const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!keysResponse.ok) return jsonError('Unable to access IntraZone database credentials', 502);
    const keys = await keysResponse.json();
    const serviceKey = keys.find((item) => item.name === 'service_role')?.api_key;
    if (!serviceKey) return jsonError('IntraZone service role key was not found', 502);

    const runQuery = async (request) => {
      const table = String(request.table || '');
      if (!IDENTIFIER.test(table)) throw new Error('Invalid table name');

      const columns = Array.isArray(request.columns) && request.columns.length
        ? request.columns.map((column) => {
            if (!IDENTIFIER.test(column)) throw new Error('Invalid column name');
            return column;
          }).join(',')
        : '*';
      const limit = Math.min(Math.max(Number(request.limit) || 100, 1), 500);
      const offset = Math.max(Number(request.offset) || 0, 0);
      const params = new URLSearchParams({ select: columns, limit: String(limit), offset: String(offset) });

      if (request.order?.column) {
        if (!IDENTIFIER.test(request.order.column)) throw new Error('Invalid order column');
        const direction = request.order.direction === 'desc' ? 'desc' : 'asc';
        params.set('order', `${request.order.column}.${direction}`);
      }

      for (const filter of request.filters || []) {
        if (!IDENTIFIER.test(filter.column) || !OPERATORS.has(filter.operator)) throw new Error('Invalid filter');
        const value = filter.operator === 'in' && Array.isArray(filter.value)
          ? `(${filter.value.join(',')})`
          : String(filter.value);
        params.append(filter.column, `${filter.operator}.${value}`);
      }

      const response = await fetch(
        `https://${project.id}.supabase.co/rest/v1/${table}?${params.toString()}`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            Prefer: 'count=exact',
          },
        },
      );
      if (!response.ok) throw new Error(`Query failed for table ${table}`);
      const range = response.headers.get('content-range') || '';
      const total = Number(range.split('/')[1]);
      return { table, data: await response.json(), total: Number.isFinite(total) ? total : null, limit, offset };
    };

    if (action === 'batch') {
      const queries = Array.isArray(body.queries) ? body.queries.slice(0, 10) : [];
      if (!queries.length) return jsonError('queries are required', 400);
      const results = await Promise.all(queries.map(runQuery));
      return Response.json({ project: project.name, results });
    }

    if (action !== 'query') return jsonError('Unsupported action', 400);
    const result = await runQuery(body);
    return Response.json({ project: project.name, ...result });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});