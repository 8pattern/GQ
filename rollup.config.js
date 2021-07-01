const { babel } = require("@rollup/plugin-babel");
const ts = require('rollup-plugin-typescript2');
const { terser } = require('rollup-plugin-terser');

const isProduction = process.env.NODE_ENV === 'production';

const basePlugins = [
  ts(),
  babel(),
];
const devPlugins = [
  ...basePlugins,
];
const prodPlugins = [
  ...basePlugins,
  terser(),
];

export default {
  input: 'src/index.ts',
  output: {
    file: '',
    name: '',
    format: 'umd'
  },
  plugins: isProduction ? prodPlugins : devPlugins,
};
