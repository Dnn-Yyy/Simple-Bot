import { readdirSync, existsSync, readFileSync, watch } from 'fs';
import { join } from 'path';
import { format } from 'util';
import syntaxerror from 'syntax-error';

const pluginFolder = join(process.cwd(), './plugins');
const pluginFilter = filename => /\.js$/.test(filename);
const plugins = {};

async function loadPlugins() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = join(pluginFolder, filename);
            const module = await import(file);
            plugins[filename] = module.default || module;
        } catch (e) {
            delete plugins[filename];
        }
    }
}

async function reloadPlugin(filename) {
    if (pluginFilter(filename)) {
        const filePath = join(pluginFolder, filename);
        if (filename in plugins) {
            if (!existsSync(filePath)) {
                delete plugins[filename];
                return;
            }
        }

        const err = syntaxerror(readFileSync(filePath), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });

        if (!err) {
            try {
                const module = await import(`${filePath}?update=${Date.now()}`);
                plugins[filename] = module.default || module;
            } catch (e) {}
        }
    }
}

function watchPlugins() {
    watch(pluginFolder, async (eventType, filename) => {
        if (filename) {
            await reloadPlugin(filename);
        }
    });
}

export { loadPlugins, watchPlugins, plugins };