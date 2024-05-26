# Template-Web-Frontend

## Usage

```bash
$ bun start
$ bun run build
$ bun lint
$ bun test
```

## Add package to specific workspace

As of 2024/05/26, bun doesn't support package-specific install.
Use `npm` instead.

```bash
$ npm i -w <workspace> <package> --no-lockfile
$ bun i
```