const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const destDir = path.join(__dirname, 'icons');
const icon512 = path.join(destDir, 'icon-512.png');
const icon192 = path.join(destDir, 'icon-192.png');

// 簡単なCRC32実装
function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        const byte = buf[i];
        crc ^= byte;
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xEDB88320;
            } else {
                crc = crc >>> 1;
            }
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(file, type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    file.write(lenBuf);
    
    const typeBuf = Buffer.from(type, 'ascii');
    file.write(typeBuf);
    file.write(data);
    
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    file.write(crcBuf);
}

function generateGradientPNG(width, height, outputPath) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    ihdr[10] = 0; // compression method
    ihdr[11] = 0; // filter method
    ihdr[12] = 0; // interlace method

    const rowSize = width * 4 + 1;
    const pixelData = Buffer.alloc(rowSize * height);
    
    const centerX = width / 2;
    const centerY = height / 2;

    let pos = 0;
    for (let y = 0; y < height; y++) {
        pixelData[pos++] = 0; // Filter type 0 (None)
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const ratio = Math.max(0, 1 - dist / (width * 0.42)); // 中央付近で光る
            
            // ベース背景色 (14, 10, 22) - ダークパープル
            let r = 14;
            let g = 10;
            let b = 22;
            
            if (ratio > 0) {
                // 中央の光るネオンバブルのブレンド (外側は紫、内側は水色)
                const mix = Math.sin(ratio * Math.PI / 2);
                r = Math.round(r * (1 - ratio) + (208 * (1 - mix) + 0 * mix) * ratio);
                g = Math.round(g * (1 - ratio) + (0 * (1 - mix) + 240 * mix) * ratio);
                b = Math.round(b * (1 - ratio) + (255 * (1 - mix) + 255 * mix) * ratio);
            }
            
            // シャボン玉の繊細な輪郭エッジ
            const edgeRatio = Math.exp(-Math.pow(dist - width * 0.35, 2) / 12);
            if (edgeRatio > 0.01) {
                r = Math.round(r * (1 - edgeRatio) + 220 * edgeRatio);
                g = Math.round(g * (1 - edgeRatio) + 230 * edgeRatio);
                b = Math.round(b * (1 - edgeRatio) + 255 * edgeRatio);
            }

            pixelData[pos++] = Math.max(0, Math.min(255, r)); // R
            pixelData[pos++] = Math.max(0, Math.min(255, g)); // G
            pixelData[pos++] = Math.max(0, Math.min(255, b)); // B
            pixelData[pos++] = 255; // Alpha
        }
    }

    const compressed = zlib.deflateSync(pixelData);
    const file = fs.createWriteStream(outputPath);
    
    // PNG signature
    file.write(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
    writeChunk(file, 'IHDR', ihdr);
    writeChunk(file, 'IDAT', compressed);
    writeChunk(file, 'IEND', Buffer.alloc(0));
    file.end();
}

try {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    generateGradientPNG(512, 512, icon512);
    console.log('Successfully generated icon-512.png');

    generateGradientPNG(192, 192, icon192);
    console.log('Successfully generated icon-192.png');

    console.log('All icons generated programmatically!');
} catch (error) {
    console.error('Error generating icons:', error);
}
