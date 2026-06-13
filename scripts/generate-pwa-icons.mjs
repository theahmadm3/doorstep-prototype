/**
 * Generate the PWA icons referenced by public/manifest.json from the brand
 * logo. The manifest requires a real 192px and 512px PNG for the app to be
 * installable (Chrome rejects the manifest otherwise, so `beforeinstallprompt`
 * never fires). Re-run with: `npm run pwa:icons`.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(root, "public/doorstep-logo.png");
const SIZES = [192, 512];
// Manifest theme background, used to fill the letterbox around the logo.
const BACKGROUND = "#005582";

for (const size of SIZES) {
  const out = resolve(root, `public/icon-${size}x${size}.png`);
  // ~12% padding so the logo isn't edge-to-edge.
  const inner = Math.round(size * 0.76);
  const logo = await sharp(SOURCE)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);

  console.log(`wrote ${out} (${size}x${size})`);
}
