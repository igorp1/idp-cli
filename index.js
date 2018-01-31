#!/usr/bin/env node

// libraries 
const fs = require('fs');
const program = require('commander');           // http://tj.github.io/commander.js/
const prompt = require('prompt');               // https://github.com/flatiron/prompt/tree/master/examples
const colors = require("colors");               // https://github.com/Marak/colors.js
const shell = require('shelljs');                 // https://github.com/shelljs/shelljs
let Spinner = require('cli-spinner').Spinner;   // https://github.com/helloIAmPau/node-spinner

let Project = {};
var spinner = {};

// setup program 
program
    .version('1.1.0')
    .description('Simple cli tool to create projects following templates.')
    .usage('idp <command> [arguments] [options]')

program
    .command('new [project_name]')
    .action((project_name) => { Project.name = project_name; })

program
    .option('-v, --vue',            'To create a Vue application.')
    .option('-a, --angular',       'To create an Angular application.')
    .option('-r, --react',          'To create a React application.')
    .option('-j, --javascript',    'To create a vanilla javascript application.')
    .parse(process.argv);

if (process.argv.length === 2) {
    program.help();
    return;
}

// setup console prompt schema
var prompt_schema = { properties: { } };

if (Project.name === undefined){
    prompt_schema.properties.name = {
        name:'name',
        pattern: /^[a-zA-Z\-]+$/,
        message: 'Name must only contain letters or dashes',
        required: true
    }
}

prompt_schema.properties.description = {
    name:'description',
    required:false
}

var frameworkChosen = (program.vue || program.angular || program.react || program.javascript) !== undefined;
if (!frameworkChosen){
    prompt_schema.properties.framework = {
        name:'framework',
        message: 'Please choose a valid framework:' + colors.red("angular") +"/"+ colors.yellow("javascript") +"/"+ colors.blue("react") +"/"+ colors.green('vue'),
        required: true,
        pattern: /^(angular|javascript|react|vue)$/,
    }
}
else{
    var frameworkChoices = [ program.angular, program.javascript, program.react,program.vue ];
    if(frameworkChoices.indexOf(true) === frameworkChoices.lastIndexOf(true) ){
        var frameworks = ['angular','javascript','react','vue'];
        Project.framework = frameworks[frameworkChoices.indexOf(true)];
    }
    else{
        console.log(colors.red.bold("Error: ") + "You can only choose one framework.");
        return;
    }

} 

// setup prompt
prompt.message = "";
prompt.delimiter = " " + colors.green.bold("$");

// Start the prompt
prompt.start();

prompt.get(prompt_schema, 
    (err, result) => {
        if (err){
            errorMsg("\nProgram ended.\n")
        }
        else{
            processPromptInput(result);
        }
    }
);

function processPromptInput(promptInput){
    Project = Object.assign(Project, promptInput);
    console.log();
    spinner = new Spinner( 'Building project' + ' %s  '.green);
    spinner.setSpinnerString('⣾⣽⣻⢿⡿⣟⣯⣷');
    spinner.start();
    buildProject(Project.framework);
}

// ===== PROJECT SEED BUILDERS ==>

function buildProject(framework){
    const config = loadConfig(framework);
    fetchProjectSeed(config.seedName);
    let filefixer = fixAFileFn(Project.name, Project.description);
    costumizeSeed(config.filesToFix, filefixer); 
    spinner.stop();
    successMsg('DONE!\n');
    printInstructions(config.instructions)
}

function fetchProjectSeed(seedName){
    const urlPrefix = 'https://raw.githubusercontent.com/igorp1/idp-cli/master/seeds/'
    let script =  `
        curl ${urlPrefix}${seedName}.zip -o file.zip;
        unzip file.zip;
        rm file.zip
        mv ${seedName} ${projectName};
    `;
    shell.exec(script, {silent:false});
}

function costumizeSeed(filesTofix, fixingFunction){
    filesTofix.map( file => fixingFunction(file) );
}

function fixAFileFn(projectName, projectDescription){
    return (filepath) => {
        const fullPath = `${projectName}${filepath}`;
        let packageFile = fs.readFileSync( fullPath, "utf8");
        
        // name
        packageFile = packageFile.replaceAll('project_name',Project.name);

        // description
        if(Project.description) 
            packageFile = packageFile.replaceAll('project_description',Project.description);

        fs.writeFileSync(fullPath, packageFile, 'utf8');
    }
}

// ===== CONSOLE HELPERS

function errorMsg(msg) {
    console.log("Error: ".underline.red + msg)
}

function successMsg(msg){
    console.log(msg.bold.green);
}

function updateMsg(msg){
    console.log('OK! '.bold.green + msg);
}

function printInstructions(msg){
    console.log(`===== ${'INSTRUCTIONS'.underline} =====`.cyan);
    console.log(msg);
    console.log('========================'.cyan);
}

// ===== FRAMEWORKS CONFIG ==>

function loadConfig(framework){
    const allConfigs = {
        angular: {
            filesToFix: ['/.angular-cli.json', '/package.json', '/src/index.html', '/src/app/app.component.html'],
            seedName: 'ng-seed',
            instructions: `
Install packages: ${'npm i'.bold.cyan}
Run project: ${'ng serve'.bold.cyan}
Build for production: ${'ng build --prod'.bold.cyan}
    `
        },
        javascript: {
            filesToFix: ['/index.html', '/package.json'],
            seedName: 'js-seed',
            instructions: `
Install packages: ${'npm i'.bold.cyan}
Run project: ${'npm start'.bold.cyan}
Build for production: ${'npm build'.bold.cyan}
    `
        },
        react: {
            filesToFix: ['/package.json', '/public/index.html', '/src/App.js'],
            seedName: 'react-seed',
            instructions: `
Install packages: ${'npm i'.bold.cyan}
Run project: ${'react-scripts start'.bold.cyan}
Build for production: ${'react-scripts build'.bold.cyan}
    `
        },
        vue: {
            filesToFix: ['/package.json', '/index.html', '/src/components/Home.vue'],
            seedName: 'vue-seed',
            instructions: `
Install packages: ${'npm i'.bold.cyan}
Run project: ${'npm run dev'.bold.cyan}
Build for production: ${'npm run build'.bold.cyan}
    `
        },
    };
    return allConfigs[framework];
}

// ===== PROTOTYPE EXTENSIONS ==>

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
