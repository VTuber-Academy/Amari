<div align="center">

  ###### ✨ Empowering Communities, Inspiring Connections ✨
  # Amari
  [![VTuber Academy](https://dcbadge.vercel.app/api/server/vta)](https://discord.gg/vta)
</div>

Amari is a versatile Discord bot designed to enhance the VTA (VTuber Academy) community by facilitating efficient back-end operations and promoting engaging interactions. With features such as VTuber, Artists, and Staff applications, ModMail, Silent Levelling, Radio, and more, Amari aims to streamline community management and create a vibrant and enjoyable atmosphere. Built using the sapphire.js framework in Node.js, Amari incorporates additional components to ensure Test-Driven Development (TDD) practices for robust and reliable performance.

## Features 📺
- Written in Typescript
- Test Driven Development (TDD)
- Uses [sapphire.js's amazing bot framework](https://github.com/sapphiredev/framework/)
- Easy setup with multi guild functionality in mind

## Installation & Usage 🔻
1. To get started with this Amari, clone the repository and run:
```bash
pnpm install
```
2. It will install all dependencies required by the bot including devDependencies. This is **required** to build the bot files for production. Now its time to store your bot token! Your env file is stored inside src/.env
  - **Do not share your token with anyone! Keep it safe as if its a password for you!** -- If you do not know how to get a bot token, refer to this [article](https://discord.com/developers/docs/getting-started#adding-credentials).
- I recommend you use [visual studio code](https://code.visualstudio.com/) with [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), [better comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) and [vitest](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) extensions installed or similar when developing with Amari.
3. If you want to run your bot, just do `pnpm dev`! Though this is not really recommended during production. To be safe run `pnpm build` and then `pnpm start`
- Incase you want to remove devDependencies for your production server, run `pnpm install --prod` at the end of the command line! (removes dev dependencies)

## Contribution
Currently contribution is closed until version 2.0 is released.

## License
This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). 
- You can find the full text of the license [here](https://www.gnu.org/licenses/agpl-3.0.en.html).

The AGPL-3.0 license is a copyleft license that grants users the freedom to use, modify, and distribute this software, even in the context of network-based applications. If you modify or extend this software and distribute it over a network, you are required to provide access to the corresponding source code to the users interacting with the application.

Please review the license terms to understand your rights and obligations when using this software.
