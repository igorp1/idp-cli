#!/usr/bin/env node

// libraries 
const fs = require('fs');
const program = require('commander');           // http://tj.github.io/commander.js/
const prompt = require('prompt');               // https://github.com/flatiron/prompt/tree/master/examples
const colors = require("colors");               // https://github.com/Marak/colors.js
const shell = require('shelljs');                 // https://github.com/shelljs/shelljs
let Spinner = require('cli-spinner').Spinner;   // https://github.com/helloIAmPau/node-spinner

let spinner = undefined;
let Project = {};

// setup program commands
program
    .command('new [project_name]')
    .description('To create a new project.')
    .action((project_name) => { Project.name = project_name; });

// setup program options
program
    .option('-v, --vue',            'To create a Vue application.')
    .option('-a, --angular',       'To create an Angular application.')
    .option('-r, --react',          'To create a React application.')
    .option('-j, --javascript',    'To create a vanilla javascript application.')

// parse arguments
program.parse(process.argv);


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
            console.log("\n")
            errorMsg("^C Ended")
            console.log()
        }
        else{
            processPromptInput(result);
        }
    }
);

function processPromptInput(promptInput){
    Project = Object.assign(Project, promptInput);
    console.log();
    updateMsg('Building project...');
    makeSpinner();
    fetchTemplate(Project.framework);
    stopSpinner();
}

function fetchTemplate(framework){
    const calls = {
        angular: ()=>{ getAngularTemplate();}, // ok!
        javascript: ()=>{ getJSTemplate();}, // ok!
        react: ()=>{ getReactTemplate();},
        vue: ()=>{ getVueTemplate();}
    }
    calls[framework]();
}

function getJSTemplate(){
    makeSpinner();
    unarchiveProjectSeed(Project.framework, Project.name);
    let filefixer = fixAFileFn(Project.name, Project.description);
    ['/index.html', '/package.json'].map( path => filefixer(path) );
    stopSpinner();
    successMsg('DONE!\n');
    printInstructions(`
Install packages: ${'npm i'.bold.cyan}
Run project: ${'npm start'.bold.cyan}
Build for production: ${'npm build'.bold.cyan}
    `);
}

function getAngularTemplate(){
    makeSpinner();
    unarchiveProjectSeed(Project.framework, Project.name);
    let filefixer = fixAFileFn(Project.name, Project.description);
    ['/.angular-cli.json',
     '/package.json', 
     '/src/index.html',
     '/src/app/app.component.html'
    ].map( path => filefixer(path) );
    stopSpinner();
    successMsg('DONE!\n');
    printInstructions(`
Install packages: ${'npm i'.bold.cyan}
Run project: ${'ng serve'.bold.cyan}
Build for production: ${'ng build --prod'.bold.cyan}
    `);
}

function getReactTemplate(){
    makeSpinner();
    unarchiveProjectSeed(Project.framework, Project.name);
    let filefixer = fixAFileFn(Project.name, Project.description);
    ['/package.json', 
     '/public/index.html',
     '/src/App.js'
    ].map( path => filefixer(path) );
    stopSpinner();
    successMsg('DONE!\n');
    printInstructions(`
Install packages: ${'npm i'.bold.cyan}
Run project: ${'react-scripts start'.bold.cyan}
Build for production: ${'react-scripts build'.bold.cyan}
    `);
}

function getVueTemplate(){
    makeSpinner();
    unarchiveProjectSeed(Project.framework, Project.name);
    let filefixer = fixAFileFn(Project.name, Project.description);
    ['/package.json', 
     '/index.html',
     '/src/components/Home.vue'
    ].map( path => filefixer(path) );
    stopSpinner();
    successMsg('DONE!\n');
    printInstructions(`
Install packages: ${'npm i'.bold.cyan}
Run project: ${'npm run dev'.bold.cyan}
Build for production: ${'npm run build'.bold.cyan}
    `);
}

function unarchiveProjectSeed(framework, projectName, processFilesFn){
    const seedNames = {
        'angular':'ng-seed',
        'javascript':'js-seed',
        'react':'react-seed',
        'vue':'vue-seed'
    }
    let script =  `
        unzip seeds/${seedNames[framework]}.zip;
        mv ${seedNames[framework]} ${projectName};
    `;
    return shell.exec(script, {silent:true}).code;
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

function makeSpinner(msg = 'building'){
    if(spinner) spinner.stop();
    spinner = new Spinner(msg + ' %s  '.green);
    spinner.setSpinnerString('⣾⣽⣻⢿⡿⣟⣯⣷');
    spinner.start()
}

function stopSpinner(){
    spinner.stop();
}   

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

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
