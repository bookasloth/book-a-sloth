-- v3.3_feature_flags_scope.sql — add scope column for admin UI grouping.
-- scope: 'vendor' | 'customer' | 'both'. Existing rows default to 'both'.
-- Row seeding is handled in code by server/config/featureRegistry.js +
-- featureFlagController.syncRegistry() (runs on boot and on admin GET), so no
-- INSERTs here.
alter table feature_flags add column if not exists scope text not null default 'both';
