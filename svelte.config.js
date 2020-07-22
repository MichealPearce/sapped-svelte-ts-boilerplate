const sveltePreprocess = require('svelte-preprocess')
const typescript = require('./tsconfig.json')

module.exports = {
	dev: process.env.NODE_ENV !== 'development',
	hydratable: true,
	emitCss: true,
	preprocess: sveltePreprocess({
		scss: { includePaths: ['src'] },
		postcss: {
			plugins: [require('autoprefixer')],
		},
		typescript
	})
}
