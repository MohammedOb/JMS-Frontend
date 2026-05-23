const [major, minor] = process.versions.node.split('.').map(Number);

const minMajor = 20;
const minMinor = 9;
const maxExclusiveMajor = 25;

const isTooOld = major < minMajor || (major === minMajor && minor < minMinor);
const isTooNew = major >= maxExclusiveMajor;

if (isTooOld || isTooNew) {
  const message = [
    '',
    `Unsupported Node.js version: ${process.versions.node}`,
    'This project uses Next.js 16 and is supported on Node.js 20.9+ LTS.',
    'Use Node.js 20.x or 22.x LTS for stable local development on Windows.',
    'Recommended fix:',
    '  nvm use 22',
    '',
  ].join('\n');

  console.error(message);
  process.exit(1);
}
