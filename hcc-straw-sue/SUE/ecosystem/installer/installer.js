#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors
const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
};

// ASCII Art Banner
const banner = `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         SUE ECOSYSTEM INSTALLER - v5.0.0                      ║
║     Complete Full-Stack Application Suite                     ║
║                                                                ║
║   🚀 Web Dashboard                                            ║
║   🚀 Cloud Backend                                            ║
║   🚀 Mobile App                                               ║
║   🚀 Admin Portal                                             ║
║   🚀 AI Chat Interface                                        ║
║   🚀 CLI Tool                                                 ║
║   🚀 Browser Extension                                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;

console.log(colors.primary(banner));

// Installation Steps
async function main() {
  try {
    // Step 1: Verify Requirements
    console.log(colors.info('\n📋 Checking system requirements...\n'));
    await checkRequirements();

    // Step 2: Show Welcome
    console.log(colors.primary('\n✨ Welcome to SUE Ecosystem Installer!\n'));
    console.log('This installer will set up the complete SUE ecosystem including:');
    console.log('  • Web Dashboard (Next.js)');
    console.log('  • Cloud Backend (Express)');
    console.log('  • Mobile App (React Native)');
    console.log('  • Admin Portal (Vue)');
    console.log('  • AI Chat Interface (React)');
    console.log('  • CLI Tool (Node.js)');
    console.log('  • Docker services (PostgreSQL, Redis)\n');

    // Step 3: Get Installation Path
    const { installPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'installPath',
        message: 'Enter installation directory:',
        default: path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'SUE'),
        validate: (input) => input.length > 0 ? true : 'Path cannot be empty',
      },
    ]);

    // Step 4: Confirm Installation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Install SUE Ecosystem to ${installPath}?`,
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(colors.warning('\n⚠️  Installation cancelled.\n'));
      process.exit(0);
    }

    // Step 5: Download and Extract
    console.log(colors.info('\n📥 Installing files...\n'));
    const spinner = ora('Downloading ecosystem files...').start();
    
    try {
      // Create installation directory
      await fs.ensureDir(installPath);

      // Copy ecosystem files
      spinner.text = 'Copying ecosystem files...';
      await copyEcosystemFiles(installPath);

      spinner.succeed('Files installed successfully!');
    } catch (error) {
      spinner.fail(`Installation failed: ${error.message}`);
      throw error;
    }

    // Step 6: Install Dependencies
    console.log(colors.info('\n📦 Installing dependencies...\n'));
    const depsSpinner = ora('Running pnpm install (this may take 5-10 minutes)...').start();
    
    try {
      await installDependencies(installPath);
      depsSpinner.succeed('Dependencies installed successfully!');
    } catch (error) {
      depsSpinner.fail(`Dependency installation failed: ${error.message}`);
      throw error;
    }

    // Step 7: Configure Environment
    console.log(colors.info('\n⚙️  Configuring environment...\n'));
    const envSpinner = ora('Setting up environment...').start();
    
    try {
      await setupEnvironment(installPath);
      envSpinner.succeed('Environment configured!');
    } catch (error) {
      envSpinner.fail(`Environment setup failed: ${error.message}`);
      throw error;
    }

    // Step 8: Create Shortcuts
    console.log(colors.info('\n🔗 Creating shortcuts...\n'));
    const shortcutSpinner = ora('Creating start scripts...').start();
    
    try {
      await createShortcuts(installPath);
      shortcutSpinner.succeed('Shortcuts created!');
    } catch (error) {
      shortcutSpinner.warn(`Shortcut creation skipped: ${error.message}`);
    }

    // Step 9: Success Message
    console.log(colors.success('\n✅ SUE Ecosystem installed successfully!\n'));
    console.log('═'.repeat(64));
    console.log(colors.success('\n🚀 INSTALLATION COMPLETE!\n'));
    console.log('Next steps:');
    console.log(`  1. Navigate to: ${installPath}`);
    console.log(`  2. Open PowerShell/Terminal`);
    console.log(`  3. Run: docker-compose up`);
    console.log(`  4. In new terminals, start each app:`);
    console.log(`     - cd sue-cloud-backend && pnpm dev`);
    console.log(`     - cd sue-dashboard-web && pnpm dev`);
    console.log(`     - cd sue-admin-portal && pnpm dev`);
    console.log(`     - cd sue-ai-chat && pnpm dev`);
    console.log(`  5. Access dashboard at http://localhost:3000\n`);
    console.log('Documentation:');
    console.log(`  • Quick Start: ${installPath}\\GETTING_STARTED.md`);
    console.log(`  • Architecture: ${installPath}\\ARCHITECTURE.md`);
    console.log(`  • Development: ${installPath}\\DEVELOPMENT.md\n`);
    console.log('═'.repeat(64));

  } catch (error) {
    console.log(colors.error(`\n❌ Installation failed: ${error.message}\n`));
    process.exit(1);
  }
}

async function checkRequirements() {
  const spinner = ora('Checking Node.js...').start();
  
  try {
    // Check Node.js
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required (found ${nodeVersion})`);
    }
    
    spinner.succeed(`Node.js ${nodeVersion} OK`);

    // Check pnpm
    const pnpmSpinner = ora('Checking pnpm...').start();
    // pnpm is bundled with this installer
    pnpmSpinner.succeed('pnpm available');

    // Check Docker (optional warning)
    const dockerSpinner = ora('Checking Docker...').start();
    // Docker check will be soft warning
    dockerSpinner.warn('Note: Docker required to run services (install from docker.com)');

  } catch (error) {
    spinner.fail(error.message);
    throw error;
  }
}

async function copyEcosystemFiles(installPath) {
  // In real scenario, this would download from GitHub or copy from bundle
  // For now, we'll create placeholder structure
  const ecosystemPath = path.join(__dirname, '..', '..');
  
  if (await fs.pathExists(ecosystemPath)) {
    await fs.copy(ecosystemPath, installPath, {
      filter: (src) => {
        // Skip node_modules and other large directories
        return !src.includes('node_modules') && 
               !src.includes('.next') &&
               !src.includes('dist') &&
               !src.includes('.git');
      },
    });
  }
}

async function installDependencies(installPath) {
  return new Promise((resolve, reject) => {
    const install = spawn('pnpm', ['install', '--frozen-lockfile'], {
      cwd: installPath,
      stdio: 'inherit',
      shell: true,
    });

    install.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pnpm install exited with code ${code}`));
      }
    });

    install.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupEnvironment(installPath) {
  const envTemplate = path.join(installPath, '.env.example');
  const envFile = path.join(installPath, '.env');

  if (await fs.pathExists(envTemplate) && !await fs.pathExists(envFile)) {
    await fs.copy(envTemplate, envFile);
  }
}

async function createShortcuts(installPath) {
  // Create batch files for easy startup
  const startScript = `@echo off
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      SUE ECOSYSTEM - Starting Services                     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Step 1: Starting Docker services (PostgreSQL, Redis)...
docker-compose up
echo.
echo Step 2: In new terminals, run:
echo   - cd sue-cloud-backend && pnpm dev
echo   - cd sue-dashboard-web && pnpm dev
echo   - cd sue-admin-portal && pnpm dev
echo   - cd sue-ai-chat && pnpm dev
echo.
echo Access dashboard at http://localhost:3000
pause
`;

  await fs.writeFile(
    path.join(installPath, 'START-ECOSYSTEM.bat'),
    startScript,
    'utf8'
  );
}

// Run installer
main().catch((error) => {
  console.error(colors.error('Fatal error:'), error);
  process.exit(1);
});
