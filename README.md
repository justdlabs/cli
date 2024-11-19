# CLI for Justd
This is a command line tool for Justd. You can see the documentation at [here](https://getjustd.com/docs/getting-started/installation).

## Usage
You need to do this in your new project directory. And make sure you have installed Tailwind CSS and React.
### Install
```bash
npx justd-cli@latest init
```
With `init` command, it will identify your project type, install the necessary packages, asking for what theme you want to use, and create a `justd.json` file.
### Add
After that, you can run the following command to start adding new components.
```bash
npx justd-cli@latest add <component-name>
```

### Change Theme
You can change the theme by running the following command.
```bash
npx justd-cli@latest theme
```

### Diff
If you want to see the difference between your current components and the new one, you can run the following command.

```bash
npx justd-cli@latest diff
```

It will show you the difference between the current and the new component. And it will also ask you to confirm the changes.

## License
[MIT](https://github.com/justdlabs/cli/blob/main/LICENSE)
