import "@prism/types"

// User context types
interface UserContext {
	id: string
}

// Extend Hono's ContextVariableMap to include our custom variables
declare module "hono" {
	interface ContextVariableMap {
		user: UserContext
	}
}
