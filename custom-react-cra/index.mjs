#!/usr/bin/env node

import chalk from "chalk"; // Ensure default import for chalk
import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import { execa } from "execa";
import path from "path";
import https from "https";
import * as tar from "tar";

const program = new Command();

const fetchWithRedirects = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302) {
                return fetchWithRedirects(response.headers.location).then(
                    resolve
                );
            }
            if (response.statusCode === 200) resolve(response);
            else reject(response);
        });
    });
};
async function downloadTemplate(targetDir) {
    const templateUrl =
        "https://github.com/sanathshetty444/react-scaffold-generator/releases/download/v1.0.0/react-ts-tailwind.tar.gz";
    console.log(chalk.blue("Downloading Vite React template..."));

    const response = await fetchWithRedirects(templateUrl);
    if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch template: ${response.statusCode}`));
        return;
    }
    response.pipe(
        tar.x({
            cwd: targetDir,
        })
    );
}

program
    .version("1.0.0")
    .argument("<project-name>", "Name of the React project")
    .action(async (projectName) => {
        console.log(chalk.green(`Creating React app: ${projectName}`));

        const targetDir = path.join(process.cwd(), projectName);
        if (fs.existsSync(targetDir)) {
            console.log(chalk.red("Error: Directory already exists!"));
            process.exit(1);
        }

        const { packageManager } = await inquirer.prompt([
            {
                type: "list",
                name: "packageManager",
                message: "Choose a package manager:",
                choices: ["npm", "yarn", "pnpm"],
            },
        ]);

        console.log(chalk.blue("Setting up project..."));
        fs.mkdirSync(targetDir);

        await downloadTemplate(targetDir);
        process.chdir(targetDir);

        console.log(chalk.blue("Installing dependencies..."));
        await execa(packageManager, ["install"]);
        await execa(packageManager, ["install"]);

        console.log(chalk.green("Project setup complete! 🎉"));
        console.log(
            chalk.yellow(`
        Next Steps:
          cd ${projectName}
          ${packageManager} run dev
            `)
        );
    });

program.parse(process.argv);
