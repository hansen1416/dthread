<template>
	<div>
		<router-link to="/">Home</router-link>|
		<router-link to="/group">Group</router-link>|
		<router-link to="/like">Like</router-link>|
		<router-link to="/deposit">Deposit</router-link>|
		<router-link to="/spltoken">SPL-Token</router-link>
		<router-view v-slot="{ Component }">
			<Suspense>
				<component :is="Component" />
			</Suspense>
		</router-view>
	</div>
</template>

<style>
@font-face {
	font-family: "Inter";
	font-style: italic;
	font-weight: 400;
	font-display: swap;
	src: url("./assets/fonts/Inter-Italic.woff2#iefix") format("woff2"),
		url("./assets/fonts/Inter-Italic.woff") format("woff");
}
.inter {
	font-family: "Inter";
}
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 10px;
}
</style>
