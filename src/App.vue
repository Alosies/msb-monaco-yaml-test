<template>
  <div id="editor--container">
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
    fetch('https://kubernetesjsonschema.dev/v1.14.0-standalone/pod-v1.json')
      .then(res => res.json())
      .then(resSchema => {
        this.schema = resSchema;
        console.log(this.schema);
        const editorContainer: HTMLElement = document.getElementById(
          'editor--container'
        ) as HTMLElement;

        const service = new MonacoProviderService({
          baseUrl: '',
        });

        this.editor = service.create(editorContainer, {
          model: monaco.editor.createModel(initialContent, 'yaml'),
          language: 'yaml',
          minimap: {
            enabled: false,
          },
        });
      });
  }
}
</script>




<style lang="stylus" scoped>
#editor--container {
  height: 500px;
}
</style>