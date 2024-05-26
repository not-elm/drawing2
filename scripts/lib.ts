import * as path from 'node:path';
import * as fs from "node:fs";
import {watch} from "fs";

export function buildWatch(sourceRoot: string, buildRoot: string) {
    const watcher = watch(sourceRoot, {
        recursive: true
    }, (event, filename) => {
        build(sourceRoot, buildRoot);
    });
    build(sourceRoot, buildRoot);
}

export async function build(sourceRoot: string, buildRoot: string) {
    await Bun.build({
        entrypoints: [path.resolve(sourceRoot, './index.tsx')],
        outdir: buildRoot,
    });

    await Bun.write(
        path.resolve(buildRoot, './index.html'),
        Bun.file(path.resolve(sourceRoot, './index.html'))
    );

    console.log('Build complete');
}

export function serve(root: string) {
    const server = Bun.serve({
        fetch(req: Request) {
            const url = new URL(req.url);
            let localPath = path.join(root, url.pathname);

            if (!fs.existsSync(localPath)) {
                return new Response("Not found", {status: 404});
            }

            if (fs.lstatSync(localPath).isDirectory()) {
                localPath = path.join(localPath, "index.html");
            }

            const localFile = Bun.file(localPath);

            return new Response(localFile);
        }
    });

    console.log(`Bun server started: http://${server.hostname}:${server.port}`);
}

export const SOURCE_ROOT = path.resolve(__dirname, '../src/');

export const BUILD_ROOT = path.resolve(__dirname, '../build/');
