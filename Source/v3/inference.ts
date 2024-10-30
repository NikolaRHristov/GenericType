import { ComponentSystem, Reactive, ReactiveConfig } from "./types";

// Type utilities for hook name inference
type CamelToKebab<S extends string> = S extends `${infer T}${infer U}`
	? `${T extends Capitalize<T> ? "-" : ""}${Lowercase<T>}${CamelToKebab<U>}`
	: S;

type KebabToCamel<S extends string> = S extends `${infer T}-${infer U}`
	? `${T}${Capitalize<KebabToCamel<U>>}`
	: S;

type ExtractHookName<T> = T extends `use${infer Name}`
	? Name
	: T extends `${infer Name}Hook`
		? Name
		: T;

// Infer property type from an object type
type InferPropType<T, P extends keyof T> = T extends { [K in P]: infer U }
	? U
	: never;

// Framework detection based on imports/usage
type FrameworkContext =
	| { type: "react"; imports: ["useState", "useEffect"] }
	| { type: "solid"; imports: ["createSignal", "createEffect"] }
	| { type: "vue"; imports: ["ref", "onMounted"] };

// Hook context type based on usage location
interface HookContext {
	filename: string;
	imports: string[];
	framework: FrameworkContext["type"];
}

// Type inference for hook configuration
type InferHookConfig<Name extends string, Context extends HookContext> = {
	name: Name;
	framework: Context["framework"];
	reactive: {
		id: CamelToKebab<ExtractHookName<Name>>;
		type: "state" | "computed" | "effect";
	};
};

// Enhanced hook factory with naming inference
export function createInferredHook<
	Name extends string,
	Context extends HookContext,
	T = any,
>(name: Name, context: Context) {
	type Config = InferHookConfig<Name, Context>;

	return function useInferredHook(
		initialValue: T,
		options: Partial<ReactiveConfig<T>> = {},
	) {
		const hookName = name as Config["name"];
		const framework = context.framework;
		const reactiveId = kebabCase(extractHookName(hookName));

		// Create the system instance with inferred configuration
		const system = new ComponentSystem({
			plugins: [createFrameworkPlugin(framework)],
		});

		// Create the reactive with inferred name
		const reactive = system.create({
			id: reactiveId,
			type: options.type || "state",
			initialValue,
			...options,
		});

		return {
			reactive,
			framework,
			context,
		};
	};
}

// Helper functions for the factory
function kebabCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function extractHookName(name: string): string {
	return name.replace(/^use/, "").replace(/Hook$/, "");
}

// Framework-specific plugin creator
function createFrameworkPlugin(framework: FrameworkContext["type"]): Plugin {
	return {
		name: `${framework}-adapter`,
		beforeCreate: (config) => {
			return {
				...config,
				meta: {
					...config.meta,
					framework,
				},
			};
		},
	};
}

// Type utilities for hook usage inference
export function inferHookContext(filename: string): HookContext {
	// In practice, this would be done by a build tool or decorator
	const framework = inferFrameworkFromFilename(filename);
	const imports = inferImportsFromFramework(framework);

	return {
		filename,
		framework,
		imports,
	};
}

function inferFrameworkFromFilename(
	filename: string,
): FrameworkContext["type"] {
	if (filename.includes(".tsx") || filename.includes(".jsx")) return "react";
	if (filename.includes(".solid")) return "solid";
	if (filename.includes(".vue")) return "vue";
	return "react"; // default to React
}

function inferImportsFromFramework(
	framework: FrameworkContext["type"],
): string[] {
	switch (framework) {
		case "react":
			return ["useState", "useEffect"];
		case "solid":
			return ["createSignal", "createEffect"];
		case "vue":
			return ["ref", "onMounted"];
	}
}

// Example usage with different frameworks
// React Component Example
function Counter() {
	const context = inferHookContext("Counter.tsx");

	const useCounter = createInferredHook("useCounter", context);

	const { reactive } = useCounter(0);

	return reactive;
}

// Solid Component Example
function SolidCounter() {
	const context = inferHookContext("Counter.solid.tsx");

	const useCounter = createInferredHook("useCounterHook", context);

	const { reactive } = useCounter(0);

	return reactive;
}

// Vue Component Example
const VueCounter = {
	setup() {
		const context = inferHookContext("Counter.vue");

		const useCounter = createInferredHook("useCounterState", context);

		const { reactive } = useCounter(0);

		return { counter: reactive };
	},
};

// Advanced usage with custom configurations
type AuthHookContext = HookContext & {
	auth: {
		type: "jwt" | "oauth";
		storage: "local" | "session";
	};
};

function createAuthHook(context: AuthHookContext) {
	return createInferredHook("useAuth", {
		...context,
		meta: {
			auth: context.auth,
		},
	});
}

// Example with decorators for automatic context inference
function HookFactory() {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const context = inferHookContext(target.constructor.name);
		const originalMethod = descriptor.value;

		descriptor.value = function (...args: any[]) {
			const hook = createInferredHook(propertyKey, context);
			return originalMethod.apply(this, [hook, ...args]);
		};

		return descriptor;
	};
}

// Example usage with decorator
class UserHooks {
	@HookFactory()
	useUserProfile(initialUser = null) {
		// Hook is automatically created with inferred context
		return createInferredHook(
			"useUserProfile",
			inferHookContext("UserHooks.ts"),
		)(initialUser);
	}
}
