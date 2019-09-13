<template>
  <div id="container">
  </div>
</template>

<script lang="ts">
import * as monaco from 'monaco-editor';
// import require from 'requirejs'
// import 'monaco-languages';
// import 'monaco-yaml';

import { MonacoProviderService } from './services/monaco-provider';

import { Vue, Component, Prop } from 'vue-property-decorator';

const initialContent = `apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
    ports:
    - containerPort: 80`;

@Component
export default class App extends Vue {
  public title = 'Monaco Editor'; // contains the guide content
  public file: any;
  public schema = '';
  protected model: import('monaco-editor').editor.IModel;
  public editor: monaco.editor.IStandaloneCodeEditor | null = null;

  private mounted() {
    this.addScripts();
    this.configureEditor();
    // fetch('https://kubernetesjsonschema.dev/v1.14.0-standalone/pod-v1.json')
    //   .then(res => res.json())
    //   .then(resSchema => {
    //     this.schema = resSchema;
    //     console.log(this.schema);
    //     const editorContainer: HTMLElement = document.getElementById(
    //       'editor--container'
    //     ) as HTMLElement;

    //     const service = new MonacoProviderService({
    //       baseUrl: '',
    //     });

    //     this.editor = service.create(editorContainer, {
    //       model: monaco.editor.createModel(initialContent, 'yaml'),
    //       language: 'yaml',
    //       minimap: {
    //         enabled: false,
    //       },
    //     });
    //     // this.addScripts();
    //   });
  }

  private addScripts() {
    const scripts: string[] = [
      'lib/v0/vs/loader.js',
      'lib/v0/vs/editor/editor.main.nls.js',
      'lib/v0/vs/editor/editor.main.js',
    ];

    scripts.forEach(src => {
      let script = document.createElement('script');
      script.setAttribute('src', src);
      document.head.appendChild(script);
    });
  }

  configureEditor() {
    let resolve;
    const resPromise = new Promise(res => (resolve = res));
    const paths = {
      vs: './lib/v0/vs',
    };

    require.config({ // This seems to be the problem!!
      paths: paths,
    });

    require([
      'vs/basic-languages/monaco.contribution',
      'vs/language/yaml/monaco.contribution',
    ], () => {
      this.editor = monaco.editor.create(document.getElementById('container'), {
        value: '',
        language: 'yaml',
        automaticLayout: true,
      });

      this.editor.onDidChangeModelContent(() => {
        // Following is a test of getting error markers
        setTimeout(() => {
          const markers = monaco.editor.getModelMarkers({});
          console.log(markers);
        }, 1000);
      });

      // See: https://github.com/Microsoft/vscode/blob/master/src/vs/editor/contrib/quickOpen/quickOpen.ts
      require([
        'vs/editor/contrib/quickOpen/quickOpen',
      ], async quickOpen => {
        const getSymbolsForPosition = (model, position) => {
          return quickOpen.getDocumentSymbols(model).then(symbols => {
            symbols = symbols.filter(symbol =>
              symbol.range.containsPosition(position)
            );
            symbols = symbols.map(symbol => {
              if (symbol.kind === 17) {
                return `[]${symbol.name}`;
              } else if (symbol.kind === 18 || symbol.kind === 1) {
                return `{}${symbol.name}`;
              } else {
                return symbol.name;
              }
            });

            return symbols;
          });
        };

        monaco.languages.registerHoverProvider('yaml', {
          provideHover: async (model, position) => {
            const symbols = await getSymbolsForPosition(model, position);
            return {
              contents: [
                {
                  value: 'path: ' + symbols.join(' > '),
                  isTrusted: true,
                },
              ],
            };
          },
        });

        // Breadcrumbs emulation:
        this.editor.onDidChangeCursorSelection(async ({ selection }) => {
          const model = this.editor.getModel();
          const position = selection.getPosition();
          const symbols = await getSymbolsForPosition(model, position);
          // this.setState({ ...this.state, path: symbols.join(" > ") });
        });

        resolve();
      });
    });

    return resPromise;
  }
}
</script>




<style lang="stylus" scoped>
#editor--container {
  height: 500px;
}
</style>