import resolve from 'rollup-plugin-node-resolve'
import aliasFactory from '@rollup/plugin-alias'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

import {
	createEnv,
	preprocess as makepreprocess,
	readConfigFile,
} from '@pyoner/svelte-ts-preprocess'

import config from 'sapper/config/rollup.js'
import pkg from './package.json'

const path = require('path').resolve(__dirname, 'src')

const env = createEnv()
const compilerOptions = readConfigFile(env)
const preprocess = makepreprocess({
	scss: { includePaths: ['src'] },
	postcss: {
		plugins: [require('autoprefixer')],
	},
	typescript: {
		compilerOptions: {
			...compilerOptions,
			allowNonTsExtensions: true,
		},
	},
})

const alias = aliasFactory({
	entries: [
		{ find: '@app', replacement: `${path}/` },
		{ find: '@components', replacement: `${path}/components` },
		{ find: '@includes', replacement: `${path}/includes` },
		{ find: '@styles', replacement: `${path}/styles` },
		{ find: '@routes', replacement: `${path}/routes` },
	],
})

const production = !process.env.ROLLUP_WATCH

const mode = process.env.NODE_ENV
const dev = mode === 'development'
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
	(warning.code === 'CIRCULAR_DEPENDENCY' &&
		/[/\\]@sapper[/\\]/.test(warning.message)) ||
	onwarn(warning)

export default {
	client: {
		/**
		 * @todo
		 * * make input path better
		 */
		input: path + '/client.ts',
		output: config.client.output(),
		preserveEntrySignatures: false,
		plugins: [
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode),
			}),
			alias,
			svelte({
				dev,
				hydratable: true,
				emitCss: true,
				preprocess,
			}),
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
		 * @todo
		 * * make input path better
		 */
		input: path + '/server.ts',
		output: config.server.output(),
		preserveEntrySignatures: false,
		plugins: [
			replace({
				'process.browser': false,
				'process.env.NODE_ENV': JSON.stringify(mode),
			}),
			alias,
			svelte({
				generate: 'ssr',
				dev,
				preprocess,
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

	serviceworker: {
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode),
			}),
			commonjs(),
			!dev && terser(),
		],

		onwarn,
	},
}
