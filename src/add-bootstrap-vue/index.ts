import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import { tsquery } from '@phenomnomnominal/tsquery';
// import * as vueCompiler from 'vue-template-compiler';
import * as ts from 'typescript';

export default function (_options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {

    const packageFileName = '/package.json';

    if ( !tree.exists(packageFileName) ) {
      throw new SchematicsException(`'package.json' doesn't exist.`);
    }

    const sourceText = tree.read(packageFileName)!.toString('utf-8');
    const json = JSON.parse(sourceText);

    if ( !json.dependencies ) {
      json.dependencies = {};
    }

    const packages = ['bootstrap', 'bootstrap-vue'];
    packages.forEach((packageName) => {
      
      if ( !json.dependencies[packageName] ) {
        json.dependencies[packageName] = '*';
        json.dependencies = sortObjectByKeys(json.dependencies);
      }

      tree.overwrite('/package.json', JSON.stringify(json, null, 2));

    });

    _context.addTask(
      new NodePackageInstallTask({
        packageName: packages.join(' ')
      })
    );

    const mainJsFileName = '/src/main.js';

    if ( !tree.exists(mainJsFileName) ) {
      throw new SchematicsException(`'/src/main.js' doesn't exist.`);
    }
    
    const mainJsAst = tsquery.ast(tree.read(mainJsFileName)!.toString(), '', ts.ScriptKind.JS);
    const lastImportDeclaration = tsquery(mainJsAst, 'ImportDeclaration').pop()! as ts.ImportDeclaration;
    const binaryExpression = tsquery(mainJsAst, `BinaryExpression[right.kind=${ts.SyntaxKind.FalseKeyword}]`).pop()! as ts.BinaryExpression;
    
    let importString = `\nimport BootstrapVue from 'bootstrap-vue'`;
    importString += `\nimport 'bootstrap/dist/css/bootstrap.css'`;
    importString += `\nimport 'bootstrap-vue/dist/bootstrap-vue.css'`;

    const mainJsRecorder = tree.beginUpdate(mainJsFileName);
    mainJsRecorder.insertLeft(lastImportDeclaration.end, importString);
    mainJsRecorder.insertLeft(binaryExpression.getStart(), 'Vue.use(BootstrapVue)\n');
    tree.commitUpdate(mainJsRecorder);

    const appVueFileName = '/src/App.vue';

    if ( !tree.exists(appVueFileName) ) {
      throw new SchematicsException(`'/src/App.Vue' doesn't exist.`);
    }

    const appSource = tree.read(appVueFileName)!.toString();
    const appVueAst = tsquery.ast(appSource, '', ts.ScriptKind.TSX);
    const divOpenNode = tsquery(appVueAst, 'JsxOpeningElement[tagName.escapedText="div"]').pop()! as ts.JsxOpeningElement;
    const imgNode = tsquery(appVueAst, 'JsxOpeningElement[tagName.escapedText="img"]').pop()! as ts.JsxOpeningElement;
    const changeText = appSource.substring(divOpenNode.end, imgNode.end);
    const toInsert = `${changeText.match(/^\r?\n\s*/)![0]}<b-alert variant="success" show>Bootstrap Vue installed successfully!</b-alert>`;
    
    const appVueRecorder = tree.beginUpdate(appVueFileName);
    appVueRecorder.insertLeft(imgNode.end, toInsert);
    tree.commitUpdate(appVueRecorder);

    return tree;
  };
}

function sortObjectByKeys(obj: any): object {
  return Object.keys(obj).sort().reduce((result, key) => (result[key] = obj[key]) && result, {} as any);
}
