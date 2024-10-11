import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { minify } from "rollup-plugin-esbuild";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from "rollup";
import packageJson from "./package.json" with { type: "json" };

const isProduction = process.env.NODE_ENV === "production";
const genSrcMap = process.env.SRCMAP === "true" || (!isProduction);

const banner = [
    `// @id ${packageJson.amllPlayerMeta.id}`,
    `// @name ${packageJson.amllPlayerMeta.name}`,
    `// @version ${packageJson.version}`,
    `// @license ${packageJson.license}`,
];

for (const key in packageJson.amllPlayerMeta) {
    if (!["id", "name"].includes(key)) {
        const values = packageJson.amllPlayerMeta[key];
        if (Array.isArray(values)) {
            for (const v of values) {
                banner.push(`// @${key} ${v}`);
            }
        } else {
            banner.push(`// @${key} ${values}`);
        }
    }
}

export default defineConfig({
    input: "src/index.ts",
    output: {
        file: `dist/${packageJson.name}.js`,
        format: "umd",
        exports: "none",
        banner: !isProduction && banner.join("\n"),
        sourcemap: genSrcMap ? "inline" : "hidden",
        globals: {
            react: "React",
            jotai: "Jotai",
            "react-dom": "ReactDOM",
            "react/jsx-runtime": "JSXRuntime",
            "@radix-ui/themes": "RadixTheme",
        }
    },
    onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
        }
        warn(warning);
    },
    external: ["react", "react/jsx-runtime", "react-dom", "jotai", "@radix-ui/themes"],
    plugins: [nodeResolve(), json(), typescript(), isProduction && minify({
        banner: banner.join("\n"),
    })]
});