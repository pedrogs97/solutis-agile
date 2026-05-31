import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './openapi/openapi.json',
  },
  output: {
    path: './src/api/generated',
    clean: true,
  },
  plugins: [
    pluginOas({
      validate: false,
    }),
    pluginTs({
      output: { path: 'types' },
    }),
    pluginClient({
      output: { path: 'clients' },
      importPath: '@/api/client',
    }),
    pluginReactQuery({
      output: { path: 'hooks' },
      client: {
        importPath: '@/api/client',
      },
    }),
  ],
})
