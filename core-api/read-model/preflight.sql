-- READ-ONLY metadata capture. This file must never create, alter, grant, revoke, insert, update, or delete.
-- Run with a metadata-readable role and archive the result for the target environment.

select current_database() as database_name,
       current_setting('server_version') as server_version,
       current_user as inspected_by;

select n.nspname as schema_name,
       c.relname as relation_name,
       c.relkind,
       c.relrowsecurity,
       c.relforcerowsecurity,
       c.reloptions
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'abos_public_listings_v1';

select ordinal_position, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'abos_public_listings_v1'
order by ordinal_position;

select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'abos_public_listings_v1'
order by grantee, privilege_type;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename = 'abos_public_listings_v1'
order by policyname;

select referenced_namespace.nspname as referenced_schema,
       referenced_relation.relname as referenced_relation,
       referenced_relation.relkind,
       referenced_relation.relrowsecurity,
       referenced_relation.relforcerowsecurity
from pg_catalog.pg_rewrite rewrite_rule
join pg_catalog.pg_class public_view on public_view.oid = rewrite_rule.ev_class
join pg_catalog.pg_namespace public_namespace on public_namespace.oid = public_view.relnamespace
join pg_catalog.pg_depend dependency on dependency.objid = rewrite_rule.oid
join pg_catalog.pg_class referenced_relation on referenced_relation.oid = dependency.refobjid
join pg_catalog.pg_namespace referenced_namespace on referenced_namespace.oid = referenced_relation.relnamespace
where public_namespace.nspname = 'public'
  and public_view.relname = 'abos_public_listings_v1'
  and referenced_relation.oid <> public_view.oid
order by referenced_schema, referenced_relation;

select role_name,
       has_table_privilege(role_name, 'public.abos_public_listings_v1', 'SELECT') as can_select,
       has_table_privilege(role_name, 'public.abos_public_listings_v1', 'INSERT') as can_insert,
       has_table_privilege(role_name, 'public.abos_public_listings_v1', 'UPDATE') as can_update,
       has_table_privilege(role_name, 'public.abos_public_listings_v1', 'DELETE') as can_delete
from (values ('anon'), ('authenticated')) as inspected_roles(role_name)
where to_regrole(role_name) is not null;
