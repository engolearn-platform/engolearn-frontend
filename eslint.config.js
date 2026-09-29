import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Bắt buộc alias cho import nhảy 2+ cấp thư mục (thay vì ../../...).
      // Import cùng thư mục (./X) và 1 cấp (../types) vẫn cho phép.
      // Mức warn để không phá ~100 import relative đã có — migrate dần.
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../../**'],
              message:
                'Dùng alias thay cho relative 2+ cấp: @features/<ten-feature>/... cho code feature, @shared/... cho code dùng chung, @/... cho app shell (xem AGENTS.md).',
            },
          ],
        },
      ],
    },
  },
)
