import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

import pkg from './package.json';

const date = new Date();
const day = date.toISOString().slice(0, 10);
const year = date.getFullYear();

const banner = `/**
 * ${pkg.name} v${pkg.version} - ${day}
 * ${pkg.description}
 * ${pkg.homepage}
 *
 * @license (c) ${year} ${pkg.author.name} ${pkg.license} Licensed
 */
`;

export default [
  {
    input: 'src/jquery.autocompleter.js',
    output: {
      name: 'jquery-autocompleter',
      banner,
      file: 'dist/jquery.autocompleter.js',
      format: 'umd',
      globals: {
        jquery: 'jQuery'
      }
    },
    plugins: [
      babel({
        exclude: 'node_modules/**'
      })
    ]
  },
  {
    input: 'src/jquery.autocompleter.js',
    output: {
      name: 'jquery-autocompleter',
      banner,
      file: 'dist/jquery.autocompleter.min.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        jquery: 'jQuery'
      }
    },
    plugins: [
      babel({
        exclude: 'node_modules/**'
      }),
      uglify({
        output: {
          comments: function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == 'comment2') {
              // multiline comment
              return /@license/i.test(text);
            }
          }
        }
      })
    ]
  }
];
