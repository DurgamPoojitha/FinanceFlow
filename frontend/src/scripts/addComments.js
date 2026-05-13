import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, '../components');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (filepath.endsWith('.jsx')) {
                filelist.push(filepath);
            }
        }
    });
    return filelist;
};

const files = walkSync(directoryPath);

files.forEach(filepath => {
    const content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes('// 🌟')) {
        const basename = path.basename(filepath, '.jsx');
        const header = `// 🌟 ${basename} Component\n// This is a UI component constructed with Tailwind and Framer Motion.\n// It ensures our interface stays crisp, responsive, and neatly organized.\n`;
        fs.writeFileSync(filepath, header + content);
        console.log(`Commented ${basename}`);
    }
});
