/**
 * CSS/JS 资源压缩构建脚本
 * 用于生产环境部署时压缩静态资源
 */

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

const publicDir = path.join(__dirname, '..', 'public');
const cssDir = path.join(publicDir, 'css');
const jsDir = path.join(publicDir, 'js');

// 需要压缩的文件（排除已经压缩的 .min 文件）
const cssFiles = ['style.css', 'share.css'];
const jsFiles = ['custom.js', 'share.js'];

async function minifyCSS() {
    console.log('Minifying CSS files...');
    const cleanCSS = new CleanCSS({
        level: 2,
        sourceMap: false
    });

    for (const file of cssFiles) {
        const inputPath = path.join(cssDir, file);
        const outputPath = path.join(cssDir, file.replace('.css', '.min.css'));

        if (!fs.existsSync(inputPath)) {
            console.log(`  Skipping ${file} (not found)`);
            continue;
        }

        const input = fs.readFileSync(inputPath, 'utf8');
        const output = cleanCSS.minify(input);

        if (output.errors.length > 0) {
            console.error(`  Error minifying ${file}:`, output.errors);
            continue;
        }

        fs.writeFileSync(outputPath, output.styles);
        const savings = ((1 - output.stats.minifiedSize / output.stats.originalSize) * 100).toFixed(1);
        console.log(`  ${file} -> ${file.replace('.css', '.min.css')} (${savings}% smaller)`);
    }
}

async function minifyJS() {
    console.log('Minifying JS files...');

    for (const file of jsFiles) {
        const inputPath = path.join(jsDir, file);
        const outputPath = path.join(jsDir, file.replace('.js', '.min.js'));

        if (!fs.existsSync(inputPath)) {
            console.log(`  Skipping ${file} (not found)`);
            continue;
        }

        const input = fs.readFileSync(inputPath, 'utf8');

        try {
            const result = await minify(input, {
                compress: {
                    drop_console: process.env.NODE_ENV === 'production',
                    drop_debugger: true
                },
                mangle: true,
                sourceMap: false
            });

            if (result.code) {
                fs.writeFileSync(outputPath, result.code);
                const originalSize = Buffer.byteLength(input, 'utf8');
                const minifiedSize = Buffer.byteLength(result.code, 'utf8');
                const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
                console.log(`  ${file} -> ${file.replace('.js', '.min.js')} (${savings}% smaller)`);
            }
        } catch (err) {
            console.error(`  Error minifying ${file}:`, err.message);
        }
    }
}

async function build() {
    console.log('Building assets for production...\n');

    try {
        await minifyCSS();
        console.log('');
        await minifyJS();
        console.log('\nAsset build complete!');
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

build();
