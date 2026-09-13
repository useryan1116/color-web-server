// Rasterize the existing CL mark; do not redraw or replace the brand artwork.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const mark = await fs.readFile(path.join(root, 'launcher-site/colorlab-mark.svg'));
  const dir = path.join(root, 'color-web/assets/icons');
  await fs.mkdir(dir, {recursive:true});
  for (const size of [180,192,512]) {
    await sharp(mark).resize(size,size).png().toFile(path.join(dir,`cl-${size}-v2.png`));
  }
  for (const size of [192,512]) {
    const inset = Math.ceil(size * .14), inner = size - inset * 2;
    const logo = await sharp(mark).resize(inner,inner).png().toBuffer();
    await sharp({create:{width:size,height:size,channels:4,background:'#fffaf8'}})
      .composite([{input:logo,left:inset,top:inset}]).png().toFile(path.join(dir,`cl-maskable-${size}-v2.png`));
  }
  console.log('Existing CL logo exported for PWA and Apple touch icons.');
})().catch(error=>{console.error(error);process.exitCode=1;});
