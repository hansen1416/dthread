declare module "@vue/runtime-core" {
	export interface ComponentCustomProperties {
		$abc: string;
		//   $validate: (data: object, rule: object) => boolean
	}
}

interface Window {
	solana: any;
}
// Vite exposes env variables on the special `import.meta.env` object.
interface ImportMetaEnv {
	MODE: string;
	BASE_URL: string;
	PROD: boolean;
	DEV: boolean;
	SSR: boolean;
}

// The import.meta object exposes context-specific metadata to a JavaScript module.
// It contains information about the module, like the module's URL.
interface ImportMeta {
	env: ImportMetaEnv;
}
