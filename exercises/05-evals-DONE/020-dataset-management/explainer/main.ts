import path from 'node:path';

console.log(
  `Read the readme file at ${path.join(import.meta.dirname, 'readme.md')}`,
);
