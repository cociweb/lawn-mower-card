/*  eslint-env node */
import { createRequire } from 'node:module';
import * as ts from 'typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssLit from 'rollup-plugin-postcss-lit';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const IS_DEV =
  process.env.NODE_ENV === 'development' || !!process.env.ROLLUP_WATCH;

const serverOptions = {
  contentBase: ['./dist'],
  host: 'localhost',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  nodeResolve(),
  commonjs(),
  json(),
  postcss({
    plugins: [
      postcssPresetEnv({
        stage: 1,
        features: {
          'nesting-rules': true,
        },
      }),
    ],
    extract: false,
    minimize: true, // Enable CSS minification
  }),
  postcssLit(),
  image(),
  typescript({
    check: false,
    clean: true,
  }),
  babel({
    babelHelpers: 'runtime',
    exclude: 'node_modules/**',
  }),
  replace({
    values: {
      PKG_VERSION_VALUE: IS_DEV ? 'DEVELOPMENT' : pkg.version,
    },
    preventAssignment: true,
  }),
  IS_DEV && serve(serverOptions),
  !IS_DEV &&
    terser({
      format: {
        comments: false,
      },
      compress: {
        drop_console: false, // Don't remove console.info for version display
        drop_debugger: true,
        pure_funcs: ['console.log'], // Only remove console.log, not console.info
        dead_code: true,
        unused: true,
        passes: 2,
      },
      mangle: true,
      module: true,
    }),
].filter(Boolean);

export default {
  input: 'src/lawn-mower-card.ts',
  output: {
    dir: 'dist',
    format: 'es',
    inlineDynamicImports: true,
  },
  context: 'window',
  plugins,
};
