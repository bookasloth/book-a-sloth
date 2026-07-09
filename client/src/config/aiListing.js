// "Write with Bolt" AI listing autofill availability.
//
// Kept FALSE until go-live: ANTHROPIC_API_KEY provisioned (server + Render),
// v3.69 migration applied on both DBs, and subscription_plans.limits seeded
// with ai_generations. While false the ServiceForm button renders greyscaled +
// inactive so hosts see the feature is coming without hitting a 503.
// Flip to true as the final go-live step.
export const BOLT_ENABLED = false;
