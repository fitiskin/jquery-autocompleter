import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import packageJson from "./package.json";

const outputCommon = {
  banner: getBanner(),
  format: "umd",
  globals: {
    jquery: "$"
  }
};

export default {
  input: "src/jquery.autocompleter.js",
  output: [
    {
      ...outputCommon,
      file: "dist/jquery.autocompleter.js"
    },
    {
      ...outputCommon,
      file: "dist/jquery.autocompleter.min.js",
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    babel({
      exclude: "node_modules/**"
    })
  ],
  external: ["jquery"]
};

function getBanner() {
  const date = new Date();
  const day = date.toISOString().slice(0, 10);
  const year = date.getFullYear();

  return `/**
* ${packageJson.name} v${packageJson.version} - ${day}
* ${packageJson.description}
* ${packageJson.homepage}
*
* @license (c) ${year} ${packageJson.author.name} ${packageJson.license} Licensed
*/
`;
}
