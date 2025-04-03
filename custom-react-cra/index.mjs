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

async function downloadTemplate(targetDir, templateName) {
    const templateUrl = "https://codeload.github.com/vitejs/vite/tar.gz/main";
    console.log(chalk.blue("Downloading Vite React template..."));

    return new Promise((resolve, reject) => {
        https.get(templateUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(
                    new Error(
                        `Failed to fetch template: ${response.statusCode}`
                    )
                );
                return;
            }
            response
                .pipe(
                    tar.x({
                        cwd: targetDir,
                        strip: 4,
                        filter: (path) => {
                            return path.split("/").includes(templateName);
                        },
                    })
                )
                .on("close", resolve)
                .on("error", reject);
        });
    });
}

program
    .version("1.0.0")
    .argument("<project-name>", "Name of the React project")
    .argument("<template-name>", "Template")
    .action(async (projectName, templateName = "template-react") => {
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

        await downloadTemplate(targetDir, templateName);
        process.chdir(targetDir);

        console.log(chalk.blue("Installing dependencies..."));
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
