const zlib = require('zlib');

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

function makeChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateGradientPNGBase64(width, height) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    const rowSize = width * 4 + 1;
    const pixelData = Buffer.alloc(rowSize * height);
    
    const centerX = width / 2;
    const centerY = height / 2;

    let pos = 0;
    for (let y = 0; y < height; y++) {
        pixelData[pos++] = 0; // Filter type 0
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const ratio = Math.max(0, 1 - dist / (width * 0.45));
            
            // 背景色 #0e0a16 (14, 10, 22)
            let r = 14, g = 10, b = 22;
            
            if (ratio > 0) {
                // グラデーションのブレンド
                const mix = Math.sin(ratio * Math.PI / 2);
                r = Math.round(r * (1 - ratio) + (208 * (1 - mix) + 0 * mix) * ratio);
                g = Math.round(g * (1 - ratio) + (0 * (1 - mix) + 240 * mix) * ratio);
                b = Math.round(b * (1 - ratio) + (255 * (1 - mix) + 255 * mix) * ratio);
            }
            
            // 輪郭エッジ
            const edgeRatio = Math.exp(-Math.pow(dist - width * 0.35, 2) / 8);
            if (edgeRatio > 0.01) {
                r = Math.round(r * (1 - edgeRatio) + 220 * edgeRatio);
                g = Math.round(g * (1 - edgeRatio) + 230 * edgeRatio);
                b = Math.round(b * (1 - edgeRatio) + 255 * edgeRatio);
            }

            pixelData[pos++] = Math.max(0, Math.min(255, r));
            pixelData[pos++] = Math.max(0, Math.min(255, g));
            pixelData[pos++] = Math.max(0, Math.min(255, b));
            pixelData[pos++] = 255;
        }
    }

    const compressed = zlib.deflateSync(pixelData);
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdrChunk = makeChunk('IHDR', ihdr);
    const idatChunk = makeChunk('IDAT', compressed);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
    return pngBuffer.toString('base64');
}

// 96x96 の軽量ながら綺麗なPNGアイコンを生成して出力
const base64Str = generateGradientPNGBase64(96, 96);
console.log('PNG_BASE64_START');
for (let i = 0; i < base64Str.length; i += 80) {
    console.log(base64Str.substring(i, i + 80));
}
console.log('PNG_BASE64_END');
