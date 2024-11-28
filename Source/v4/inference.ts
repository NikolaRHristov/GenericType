import { ComponentSystem, Plugin, Reactive, ReactiveConfig } from "sweettooth";

// Retain the type utilities for hook name inference
type CamelToKebab<S extends string> = S extends `${infer T}${infer U}`
	? `${T extends Capitalize<T> ? "-" : ""}${Lowercase<T>}${CamelToKebab<U>}`
	: S;

type ExtractHookName<T> = T extends `use${infer Name}`
	? Name
	: T extends `${infer Name}Hook`
		? Name
		: T;

// Enhanced hook configuration with naming
interface EnhancedHookConfig<T> extends ReactiveConfig<T> {
	name?: string;
	framework?: "react" | "solid" | "vue";
	lifecycle?: LifecycleHandlers<T>;
}

// Framework agnostic lifecycle handlers
interface LifecycleHandlers<T> {
	beforeCreate?: (
		config: ReactiveConfig<T>,
	) => ReactiveConfig<T> | Promise<ReactiveConfig<T>>;
	afterCreate?: (reactive: Reactive<T>) => void | Promise<void>;
	beforeUpdate?: (value: T, newValue: T) => T | Promise<T>;
	afterUpdate?: (value: T) => void | Promise<void>;
	beforeDestroy?: (reactive: Reactive<T>) => void | Promise<void>;
}

// Enhanced hook factory with naming utilities
export function createEnhancedHookFactory(system: ComponentSystem) {
	return function createNamedFrameworkHook(
		framework: "react" | "solid" | "vue",
	) {
		return function useEnhancedHook<T, Name extends string>(
			hookNameOrConfig: Name | EnhancedHookConfig<T>,
		) {
			// Process the hook name
			const config =
				typeof hookNameOrConfig === "string"
					? ({ name: hookNameOrConfig } as EnhancedHookConfig<T>)
					: hookNameOrConfig;

			const rawName = config.name || "";

			const processedName = ExtractHookName<typeof rawName>;

			const kebabName = processedName.replace(
				/[A-Z]/g,
				(letter) => `-${letter.toLowerCase()}`,
			);

			// Create the lifecycle plugin with naming metadata
			const namingPlugin: Plugin = {
				name: `naming-${kebabName}`,
				beforeCreate: (originalConfig) => ({
					...originalConfig,
					meta: {
						...originalConfig.meta,
						hookName: rawName,
						processedName,
						kebabName,
					},
				}),
			};

			// Create lifecycle plugin if handlers are provided
			const lifecyclePlugin: Plugin = config.lifecycle
				? {
						name: `lifecycle-${kebabName}`,
						...config.lifecycle,
					}
				: undefined;

			// Create the reactive instance with both plugins
			const reactive = system.create({
				...config,
				id: kebabName,
				plugins: [
					namingPlugin,
					...(lifecyclePlugin ? [lifecyclePlugin] : []),
				],
			});

			// Return the framework-specific interface with naming metadata
			return {
				reactive,
				meta: {
					originalName: rawName,
					processedName,
					kebabName,
					framework,
				},
			};
		};
	};
}

// Create framework-specific factories
const system = new ComponentSystem();

export const createReactHook = createEnhancedHookFactory(system)("react");

export const createSolidHook = createEnhancedHookFactory(system)("solid");

export const createVueHook = createEnhancedHookFactory(system)("vue");

// Example usage
function ExampleUsage() {
	// Using just a name
	const counterHook = createReactHook("useCounter");
	console.log(counterHook.meta); // { originalName: "useCounter", processedName: "Counter", kebabName: "counter" }

	// Using with configuration
	const userHook = createReactHook({
		name: "useUserProfile",
		initialValue: null,
		lifecycle: {
			beforeCreate: (config) => {
				console.log(`Creating hook: ${config.meta.hookName}`);

				return config;
			},
		},
	});

	// Using with type inference
	type UserData = { id: string; name: string };

	const typedHook = createReactHook<UserData, "useUserData">({
		name: "useUserData",
		initialValue: { id: "", name: "" },
	});

	return { counterHook, userHook, typedHook };
}
