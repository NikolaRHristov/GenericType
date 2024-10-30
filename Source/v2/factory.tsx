import { ComponentSystem, Plugin, Reactive, ReactiveConfig } from "sweettooth";

// Framework agnostic lifecycle handlers
export interface LifecycleHandlers<T> {
	beforeCreate?: (
		config: ReactiveConfig<T>,
	) => ReactiveConfig<T> | Promise<ReactiveConfig<T>>;
	afterCreate?: (reactive: Reactive<T>) => void | Promise<void>;
	beforeUpdate?: (value: T, newValue: T) => T | Promise<T>;
	afterUpdate?: (value: T) => void | Promise<void>;
	beforeDestroy?: (reactive: Reactive<T>) => void | Promise<void>;
}

// Framework specific adapters
interface FrameworkAdapter<T> {
	setup: (initialValue: T) => any;
	cleanup: () => void;
	update: (value: T) => void;
}

// Hook configuration
export interface HookConfig<T> {
	id?: string;
	type?: string;
	initialValue: T;
	lifecycle?: LifecycleHandlers<T>;
	dependencies?: string[];
}

// Framework specific implementations
const frameworkAdapters = {
	react: {
		setup: (initialValue: any) => {
			const { useState, useEffect } = require("react");
			const [state, setState] = useState(initialValue);
			return { state, setState };
		},
		cleanup: () => {
			const { useEffect } = require("react");
			return () => useEffect(() => () => {}, []);
		},
		update: (setState: any, value: any) => setState(value),
	},
	solid: {
		setup: (initialValue: any) => {
			const { createSignal, onCleanup } = require("solid-js");
			return createSignal(initialValue);
		},
		cleanup: () => {
			const { onCleanup } = require("solid-js");
			return () => onCleanup(() => {});
		},
		update: (setter: any, value: any) => setter(value),
	},
	vue: {
		setup: (initialValue: any) => {
			const { ref, onUnmounted } = require("vue");
			return ref(initialValue);
		},
		cleanup: () => {
			const { onUnmounted } = require("vue");
			return () => onUnmounted(() => {});
		},
		update: (ref: any, value: any) => (ref.value = value),
	},
};

// Hook Factory
export function createHookFactory(system: ComponentSystem) {
	return function createFrameworkHook(
		framework: keyof typeof frameworkAdapters,
	) {
		const adapter = frameworkAdapters[framework];

		return function useReactive<T>(config: HookConfig<T>) {
			const {
				id,
				type = "state",
				initialValue,
				lifecycle = {},
				dependencies = [],
			} = config;

			// Create lifecycle plugin
			const lifecyclePlugin: Plugin<T> = {
				name: `lifecycle-${id || crypto.randomUUID()}`,
				beforeCreate: lifecycle.beforeCreate,
				afterCreate: lifecycle.afterCreate,
				beforeUpdate: lifecycle.beforeUpdate,
				afterUpdate: lifecycle.afterUpdate,
				beforeDestroy: lifecycle.beforeDestroy,
			};

			// Setup framework-specific state
			const state = adapter.setup(initialValue);

			// Create reactive with lifecycle plugin
			const reactive = system.create({
				id,
				type,
				initialValue,
				dependencies,
				plugins: [lifecyclePlugin],
			});

			// Setup cleanup
			adapter.cleanup();

			// Return framework-specific interface
			switch (framework) {
				case "react":
					return {
						value: state.state,
						setValue: async (newValue: T) => {
							await reactive.then((r) => r.set?.(newValue));
							state.setState(newValue);
						},
						reactive,
					};

				case "solid":
					const [value, setValue] = state;
					return {
						value,
						setValue: async (newValue: T) => {
							await reactive.then((r) => r.set?.(newValue));
							setValue(newValue);
						},
						reactive,
					};

				case "vue":
					return {
						value: state,
						setValue: async (newValue: T) => {
							await reactive.then((r) => r.set?.(newValue));
							state.value = newValue;
						},
						reactive,
					};

				default:
					throw new Error(`Unsupported framework: ${framework}`);
			}
		};
	};
}

// Usage examples for different frameworks
export const createReactHook = createHookFactory(new ComponentSystem());
export const createSolidHook = createHookFactory(new ComponentSystem());
export const createVueHook = createHookFactory(new ComponentSystem());

const useReactiveReact = createReactHook("react");
const useReactiveSolid = createSolidHook("solid");
const useReactiveVue = createVueHook("vue");

// Example usage with React
function ExampleReactComponent() {
	const { value, setValue } = useReactiveReact({
		id: "counter",
		initialValue: 0,
		lifecycle: {
			beforeCreate: (config) => {
				console.log("Before create", config);
				return config;
			},
			afterCreate: (reactive) => {
				console.log("After create", reactive);
			},
			beforeUpdate: (oldValue, newValue) => {
				console.log("Before update", oldValue, newValue);
				return newValue;
			},
			afterUpdate: (value) => {
				console.log("After update", value);
			},
			beforeDestroy: (reactive) => {
				console.log("Before destroy", reactive);
			},
		},
	});

	return (
		<div>
			<p>Count: {value}</p>
			<button onClick={() => setValue(value + 1)}>Increment</button>
		</div>
	);
}

// Example usage with Solid
function ExampleSolidComponent() {
	const { value, setValue } = useReactiveSolid({
		id: "counter",
		initialValue: 0,
		lifecycle: {
			beforeCreate: (config) => {
				console.log("Before create", config);
				return config;
			},
			afterCreate: (reactive) => {
				console.log("After create", reactive);
			},
			beforeUpdate: (oldValue, newValue) => {
				console.log("Before update", oldValue, newValue);
				return newValue;
			},
			afterUpdate: (value) => {
				console.log("After update", value);
			},
			beforeDestroy: (reactive) => {
				console.log("Before destroy", reactive);
			},
		},
	});

	return (
		<div>
			<p>Count: {value()}</p>
			<button onClick={() => setValue(value() + 1)}>Increment</button>
		</div>
	);
}
