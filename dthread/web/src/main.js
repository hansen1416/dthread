import App from "./App.vue";
import { createSSRApp } from "vue";
import { createRouter } from "./router";

if (!import.meta.env.SSR) {
	// polyfill for `ReferenceError: global is not defined`
	// when start web3js connection
	window.global = window;
}

// SSR requires a fresh app instance per request, therefore we export a function
// that creates a fresh app instance. If using Vuex, we'd also be creating a
// fresh store here.
export function createApp() {
	const app = createSSRApp(App);
	const router = createRouter();
	app.use(router);

	app.config.globalProperties.$abc = "some global property";

	return { app, router };
}
