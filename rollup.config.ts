import { defineConfig } from 'rollup'
import { promises as fs } from 'fs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import dts from 'rollup-plugin-dts'
import alias from '@rollup/plugin-alias'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import pkg from './package.json'

const ROOT = fileURLToPath(import.meta.url)
const r = (p: string) => resolve(ROOT, '..', p)

const external = [
  ...Object.keys(pkg.dependencies),
  'buffer',
  'punycode',
  'prismjs/components/index.js'
]

export default defineConfig([
  {
    input: [r('src/node/index.ts'), r('src/node/cli.ts')],
    output: {
      format: 'esm',
      dir: r('dist/node')
    },
    external,
    plugins: [
      alias({
        entries: {
          'readable-stream': 'stream'
        }
      }),
      replace({
        // polyfill broken browser check from bundled deps
        'navigator.userAgentData': 'undefined',
        'navigator.userAgent': 'undefined',
        preventAssignment: true
      }),
      commonjs(),
      nodeResolve(),
      esbuild({
        target: 'node14'
      }),
      json()
    ],
    onwarn(warning, warn) {
      if (warning.code !== 'EVAL') warn(warning)
    }
  },
  {
    input: r('src/node/index.ts'),
    output: {
      format: 'esm',
      file: 'dist/node/index.d.ts'
    },
    plugins: [dts()]
  },
  {
    input: r('dist/client-types/index.d.ts'),
    output: {
      format: 'esm',
      file: 'dist/client/index.d.ts'
    },
    plugins: [
      dts(),
      {
        name: 'cleanup',
        async closeBundle() {
          await fs.rm(r('dist/client-types'), { recursive: true })
        }
      }
    ]
  }
])
