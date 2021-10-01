/** */
import fs from 'fs';
import path from 'node:path';
const target = path.join(__dirname, '../../assets/build/maintainer.json');
import maintainer from path.join(__dirname, '../../lib/maintainer.js');

const count = Object.keys(maintainer).length;
const uniqueMaintainer = new Set();
Object.values(maintainer)
    .flat()
    .forEach((e) => uniqueMaintainer.add(e));

// eslint-disable-next-line no-console
console.log(`We have ${count} routes and maintained by ${uniqueMaintainer.size} contributors!`);

fs.writeFileSync(target, JSON.stringify(maintainer, null, 4));
