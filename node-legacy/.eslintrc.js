module.exports = {
  env: {
    node: true,
    es2021: true,
    commonjs: true,
  },
  extends: [
    'airbnb-base',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': 'off', // 暂时允许 console，后续再改
    'no-unused-vars': ['warn'],
    'consistent-return': 'off',
    'no-underscore-dangle': 'off', // 允许 _id
    'import/no-extraneous-dependencies': 'off'
  },
};
