declare module "@vue/runtime-core" {
	export interface ComponentCustomProperties {
		$abc: string;
		//   $validate: (data: object, rule: object) => boolean
	}
}

interface Window {
	solana: any;
}

interface ImportMetaEnv {
	MODE: string;
	BASE_URL: string;
	PROD: boolean;
	DEV: boolean;
}
interface ImportMeta {
	env: ImportMetaEnv;
}
