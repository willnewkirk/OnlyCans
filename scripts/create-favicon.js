const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFavicon() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/favicon.svg'));
    
    // Convert SVG to PNG with different sizes
    const sizes = [16, 32, 48];
    const pngBuffers = await Promise.all(
      sizes.map(size => 
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer()
      )
    );

    // Write the PNG files
    await Promise.all(
      pngBuffers.map((buffer, i) => 
        fs.writeFileSync(
          path.join(__dirname, `../public/favicon-${sizes[i]}.png`),
          buffer
        )
      )
    );

    // Also create larger icons for PWA
    const largeSizes = [192, 512];
    await Promise.all(
      largeSizes.map(size => 
        sharp(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(path.join(__dirname, `../public/logo${size}.png`))
      )
    );

    console.log('Icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

createFavicon(); 