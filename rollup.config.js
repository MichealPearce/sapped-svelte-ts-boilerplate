import resolve from 'rollup-plugin-node-resolve'
import aliasFactory from '@rollup/plugin-alias'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

import config from 'sapper/config/rollup.js'
import pkg from './package.json'

const svelteOptions = require('./svelte.config.js')
const path = require('path').resolve(__dirname, 'src')

const alias = aliasFactory({
	entries: [
		{ find: '@app', replacement: `${path}/` },
		{ find: '@components', replacement: `${path}/components` },
		{ find: '@includes', replacement: `${path}/includes` },
		{ find: '@styles', replacement: `${path}/styles` },
		{ find: '@routes', replacement: `${path}/routes` },
	],
})

const mode = process.env.NODE_ENV
const dev = mode === 'development'
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
	(warning.code === 'CIRCULAR_DEPENDENCY' &&
		/[/\\]@sapper[/\\]/.test(warning.message)) ||
	onwarn(warning)

export default {
	client: {
		input: config.client.input().replace(/\.js$/, '.ts'),
		output: config.client.output(),
		preserveEntrySignatures: false,
		plugins: [
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode),
			}),
			alias,
			svelte(svelteOptions),
			resolve({
				browser: true,
			}),
			commonjs(),
			typescript(),

			legacy &&
				babel({
					extensions: ['.js', '.mjs', '.html', '.svelte'],
					runtimeHelpers: true,
					exclude: ['node_modules/@babel/**'],
					presets: [
						[
							'@babel/preset-env',
							{
								targets: '> 0.25%, not dead',
							},
						],
					],
					plugins: [
						'@babel/plugin-syntax-dynamic-import',
						[
							'@babel/plugin-transform-runtime',
							{
								useESModules: true,
							},
						],
					],
				}),

			!dev &&
				terser({
					module: true,
				}),
		],

		onwarn,
	},

	server: {
		/**
		 *? config.server.input returns an object instead of a string like the client does. Not sure if this is intended so I have it check the type before calling replace()
		 */
		input: ((typeof config.server.input() === 'string') ? config.server.input() : config.server.input().server).replace(/\.js$/, '.ts'),
		output: config.server.output(),
		preserveEntrySignatures: false,
		plugins: [
			replace({
				'process.browser': false,
				'process.env.NODE_ENV': JSON.stringify(mode),
			}),
			alias,
			svelte({
				...svelteOptions,
				generate: 'ssr',
			}),
			resolve(),
			commonjs(),
			typescript(),
		],
		external: Object.keys(pkg.dependencies).concat(
			require('module').builtinModules ||
				Object.keys(process.binding('natives'))
		),

		onwarn,
	},
	/**
	 ** uncomment #swts to enable typescript for the service worker.
	 ** TS seems to work fine with the service worker but when I switch it to TS there's like 9 type errors that I'm just not trying to deal with. <3
	 */
	serviceworker: {
		//#swts input: config.serviceworker.input().replace(/\.js$/, '.ts')
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode),
			}),
			commonjs(),
			//#swts typescript()
			!dev && terser(),
		],

		onwarn,
	},
}
