import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

import packageJson from './vue-package.json';
import { vueMainContent } from './vue-main';
import { vueAppContent } from './vue-app';

import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('add-bootstrap-vue', () => {
  it('works', () => {
    const appTree = Tree.empty();
    appTree.create('./package.json', JSON.stringify(packageJson));
    appTree.create('./src/main.js', vueMainContent);
    appTree.create('./src/App.vue', vueAppContent);

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-bootstrap-vue', {}, appTree);

    const mainContent = tree.readContent('/src/main.js');
    expect(mainContent).toContain(`import BootstrapVue from 'bootstrap-vue'`);
    expect(mainContent).toContain(`import 'bootstrap/dist/css/bootstrap.css'`);
    expect(mainContent).toContain(`import 'bootstrap-vue/dist/bootstrap-vue.css'`);
    expect(mainContent).toContain(`Vue.use(BootstrapVue)`);

    const appContent = tree.readContent('/src/App.vue');
    expect(appContent).toContain(`<b-alert variant="success" show>Bootstrap Vue installed successfully!</b-alert>`);

    const json = JSON.parse(tree.readContent('/package.json'));
    const dependencies = json.dependencies;
    expect(dependencies['bootstrap']).toBeDefined();
    expect(dependencies['bootstrap-vue']).toBeDefined();

    expect(runner.tasks.some(task => task.name === 'node-package')).toBe(true);
  });
});
