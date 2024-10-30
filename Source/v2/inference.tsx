import { ComponentSystem, Reactive, ReactiveConfig } from "./types";

// Base types for different frameworks
type ReactProps = Record<string, any>;
type SolidProps = Record<string, any>;
type VueProps = Record<string, any>;

// Framework-specific component types
interface ReactComponent<P = ReactProps> {
	(props: P): JSX.Element | null;
}

interface SolidComponent<P = SolidProps> {
	(props: P): () => JSX.Element | null;
}

interface VueComponent<P = VueProps> {
	setup(props: P): Record<string, any>;
}

// Framework identification types
type FrameworkType = "react" | "solid" | "vue";

// Generic reactive value types
type ReactiveValue<T> = T extends object ? DeepReactive<T> : T;
type DeepReactive<T> = {
	[P in keyof T]: ReactiveValue<T[P]>;
};

// Framework-specific value accessors
type ReactValue<T> = T;
type SolidValue<T> = () => T;
type VueValue<T> = { value: T };

// Framework-specific setter types
type ReactSetter<T> = (value: T | ((prev: T) => T)) => void;
type SolidSetter<T> = (value: T | ((prev: T) => T)) => void;
type VueSetter<T> = (value: T) => void;

// Lifecycle method context types for each framework
interface ReactLifecycleContext<T> {
	props: ReactProps;
	state: T;
	setState: ReactSetter<T>;
	effect: (effect: () => void | (() => void), deps?: any[]) => void;
}

interface SolidLifecycleContext<T> {
	props: SolidProps;
	state: () => T;
	setState: SolidSetter<T>;
	effect: (effect: () => void | (() => void)) => void;
}

interface VueLifecycleContext<T> {
	props: VueProps;
	state: { value: T };
	setState: VueSetter<T>;
	effect: (effect: () => void | (() => void)) => void;
}

// Framework-specific lifecycle method types
type ReactLifecycleMethods<T> = {
	beforeCreate?: (
		config: ReactiveConfig<T>,
		context: ReactLifecycleContext<T>,
	) => ReactiveConfig<T> | Promise<ReactiveConfig<T>>;
	afterCreate?: (
		reactive: Reactive<T>,
		context: ReactLifecycleContext<T>,
	) => void | Promise<void>;
	beforeUpdate?: (
		oldValue: T,
		newValue: T,
		context: ReactLifecycleContext<T>,
	) => T | Promise<T>;
	afterUpdate?: (
		value: T,
		context: ReactLifecycleContext<T>,
	) => void | Promise<void>;
	beforeDestroy?: (
		reactive: Reactive<T>,
		context: ReactLifecycleContext<T>,
	) => void | Promise<void>;
};

type SolidLifecycleMethods<T> = {
	beforeCreate?: (
		config: ReactiveConfig<T>,
		context: SolidLifecycleContext<T>,
	) => ReactiveConfig<T> | Promise<ReactiveConfig<T>>;
	afterCreate?: (
		reactive: Reactive<T>,
		context: SolidLifecycleContext<T>,
	) => void | Promise<void>;
	beforeUpdate?: (
		oldValue: T,
		newValue: T,
		context: SolidLifecycleContext<T>,
	) => T | Promise<T>;
	afterUpdate?: (
		value: T,
		context: SolidLifecycleContext<T>,
	) => void | Promise<void>;
	beforeDestroy?: (
		reactive: Reactive<T>,
		context: SolidLifecycleContext<T>,
	) => void | Promise<void>;
};

type VueLifecycleMethods<T> = {
	beforeCreate?: (
		config: ReactiveConfig<T>,
		context: VueLifecycleContext<T>,
	) => ReactiveConfig<T> | Promise<ReactiveConfig<T>>;
	afterCreate?: (
		reactive: Reactive<T>,
		context: VueLifecycleContext<T>,
	) => void | Promise<void>;
	beforeUpdate?: (
		oldValue: T,
		newValue: T,
		context: VueLifecycleContext<T>,
	) => T | Promise<T>;
	afterUpdate?: (
		value: T,
		context: VueLifecycleContext<T>,
	) => void | Promise<void>;
	beforeDestroy?: (
		reactive: Reactive<T>,
		context: VueLifecycleContext<T>,
	) => void | Promise<void>;
};

// Framework type inference
type InferFramework<C> = C extends ReactComponent
	? "react"
	: C extends SolidComponent
		? "solid"
		: C extends VueComponent
			? "vue"
			: never;

// Value type inference based on framework
type InferValue<T, F extends FrameworkType> = F extends "react"
	? ReactValue<T>
	: F extends "solid"
		? SolidValue<T>
		: F extends "vue"
			? VueValue<T>
			: never;

// Setter type inference based on framework
type InferSetter<T, F extends FrameworkType> = F extends "react"
	? ReactSetter<T>
	: F extends "solid"
		? SolidSetter<T>
		: F extends "vue"
			? VueSetter<T>
			: never;

// Lifecycle methods inference based on framework
type InferLifecycleMethods<T, F extends FrameworkType> = F extends "react"
	? ReactLifecycleMethods<T>
	: F extends "solid"
		? SolidLifecycleMethods<T>
		: F extends "vue"
			? VueLifecycleMethods<T>
			: never;

// Hook configuration with framework-specific types
interface HookConfig<T, F extends FrameworkType> {
	id?: string;
	type?: string;
	initialValue: T;
	lifecycle?: InferLifecycleMethods<T, F>;
	dependencies?: string[];
}

// Hook return type based on framework
type HookReturn<T, F extends FrameworkType> = {
	value: InferValue<T, F>;
	setValue: InferSetter<T, F>;
	reactive: Promise<Reactive<T>>;
};

// Enhanced hook factory with type inference
export function createTypedHookFactory(system: ComponentSystem) {
	return function createFrameworkHook<F extends FrameworkType>(framework: F) {
		return function useReactive<T>(
			config: HookConfig<T, F>,
		): HookReturn<T, F> {
			// Implementation remains the same as before, but now with proper types
			// This is just the type layer - the actual implementation would be merged
			// with the previous hook factory code
			throw new Error("Implementation required");
		};
	};
}

// Type helper for inferring component framework
export function inferFramework<C>(component: C): InferFramework<C> {
	// Runtime implementation not needed - this is just for type inference
	throw new Error("This is a type helper only");
}

// Example usage with automatic type inference
const ExampleReactComponent: ReactComponent<{ initial: number }> = (props) => {
	const useReactiveHook = createTypedHookFactory(new ComponentSystem())(
		"react",
	);

	// Types are automatically inferred based on React
	const { value, setValue } = useReactiveHook({
		id: "counter",
		initialValue: props.initial,
		lifecycle: {
			// Context will be typed as ReactLifecycleContext
			beforeCreate: (config, context) => {
				context.effect(() => {
					// React-specific effect handling
				}, []);
				return config;
			},
			// All lifecycle methods will have React-specific types
			afterUpdate: (value, context) => {
				context.setState(value);
			},
		},
	});

	return <div>{value}</div>; // value is typed as T, not () => T or { value: T }
};

const ExampleSolidComponent: SolidComponent<{ initial: number }> = (props) => {
	const useReactiveHook = createTypedHookFactory(new ComponentSystem())(
		"solid",
	);

	// Types are automatically inferred based on Solid
	const { value, setValue } = useReactiveHook({
		id: "counter",
		initialValue: props.initial,
		lifecycle: {
			// Context will be typed as SolidLifecycleContext
			beforeCreate: (config, context) => {
				context.effect(() => {
					// Solid-specific effect handling
				});
				return config;
			},
			// All lifecycle methods will have Solid-specific types
			afterUpdate: (value, context) => {
				context.setState(value);
			},
		},
	});

	return <div>{value()}</div>; // value is typed as () => T
};
