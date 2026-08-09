export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'revert',
      ],
    ],
    'scope-enum': [
      1,
      'always',
      [
        'ui',
        'injury',
        'recovery',
        'workout',
        'ai',
        'auth',
        'api',
        'deps',
        'config',
        'gamification'
      ],
    ],
  },
};
