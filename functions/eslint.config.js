const { defineConfig } = require("eslint/config");
const js = require("@eslint/js");
const google = require("eslint-config-google");
const globals = require("globals");
const importX = require("eslint-plugin-import-x");
const { createTypeScriptImportResolver } = require("eslint-import-resolver-typescript");
const jsdoc = require("eslint-plugin-jsdoc");
const tseslint = require("typescript-eslint");

// `require-jsdoc` and `valid-jsdoc` were removed in ESLint 9. Their checks are replaced by `eslint-plugin-jsdoc` below.
const googleRules = Object.fromEntries(Object.entries(google.rules).filter(([rule]) => !["require-jsdoc", "valid-jsdoc"].includes(rule)));

module.exports = defineConfig(
    {
        ignores: [
            "lib/", // Ignore built files.
            "generated/", // Ignore generated files.
            "test/credentials.js", // Local, untracked credentials for manual tests.
        ],
    },
    js.configs.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    { rules: googleRules },
    tseslint.configs.recommended,
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                // Files outside of `tsconfig.json` (config and test scripts) are linted with a default project.
                projectService: {
                    allowDefaultProject: ["eslint.config.js", "test/*.js"],
                },
                tsconfigRootDir: __dirname,
            },
        },
        plugins: { jsdoc },
        settings: {
            "import-x/resolver-next": [createTypeScriptImportResolver()],
            // Google style uses `@return` instead of `@returns`.
            "jsdoc": { tagNamePreference: { returns: "return" } },
        },
        rules: {
            "quotes": ["error", "double"],
            // Spaces inside braces, e.g. `import { a } from "b"`, matching the VS Code formatter.
            "object-curly-spacing": ["error", "always"],
            "import-x/no-unresolved": "off",
            "indent": ["error", 4],
            "max-len": ["error", {
                code: 180,
            }],
            // Replacement for Google's `require-jsdoc` and `valid-jsdoc`.
            "jsdoc/require-jsdoc": "error",
            "jsdoc/require-param": "error",
            "jsdoc/require-param-type": "error",
            "jsdoc/check-param-names": "error",
            "jsdoc/require-returns": "error",
            "jsdoc/require-returns-type": "error",
        },
    },
    {
        // These files use CommonJS, as they are run directly with Node.js.
        files: ["eslint.config.js", "test/*.js"],
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
);
