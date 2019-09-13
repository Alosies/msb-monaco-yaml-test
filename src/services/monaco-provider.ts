import {
    MonacoEditorConfig,
    MonacoEditorOptions,
} from './monaco-editor-config';


export class MonacoProviderService {

    /**
     * Returns all available themes
     */
    get themes() {
        return ['vs', 'vs-dark'];
    }

    /**
     * Return the current theme
     */
    get theme() {
        return this._theme;
    }

    get isDarkTheme() {
        return this._theme && this._theme.endsWith('-dark');
    }

    /**
     * Expose global monaco object
     */
    get monaco(): typeof import('monaco-editor') {
        return (window as any).monaco;
    }

    /**
     * Expose global requirejs function/object
     */
    get require(): any {
        return (window as any).require;
    }
    // @ts-ignore
    private _theme = this.themes[0];

    // @ts-ignore
    private _loadingPromise!: Promise<void>;
    constructor(private monacoEditorConfig: MonacoEditorConfig) { }

    public async initMonaco() {
        return this._loadingPromise || (this._loadingPromise = this.loadMonaco());
    }

    public toggleTheme() {
        const otherTheme = this.themes.find(theme => theme !== this.theme);
        this.changeTheme(otherTheme as string);
    }

    /**
     * Load additional monaco-editor modules.
     */
    public loadModule(deps: string[]) {
        return new Promise(res => this.require(deps, res));
    }

    public changeTheme(theme: string) {
        if (!this.monaco) {
            return;
        }
        this._theme = theme;
        this.monaco.editor.setTheme(theme);
    }

    public getEditorOptions(options: MonacoEditorOptions): MonacoEditorOptions {
        return {
            ...this.monacoEditorConfig.defaultOptions,
            theme: this.theme,
            ...options,
        };
    }

    /**
     * Create a code-editor at the given dom element.
     */
    public create(
        domElement: HTMLElement,
        options?: import('monaco-editor').editor.IEditorConstructionOptions,
    ): import('monaco-editor').editor.IStandaloneCodeEditor {
        if (!this.monaco) {
            // @ts-ignore
            return;
        }
        // @ts-ignore
        return this.monaco!.editor.create(
            domElement,
            // @ts-ignore
            this.getEditorOptions(options),
        );
    }


    /**
     * Let the monaco-editor returns language information for the given alias.
     */
    getLanguageExtensionPoint(
        alias: string,
    ): import('monaco-editor').languages.ILanguageExtensionPoint {
        if (!this.monaco) {
            return;
        }
        return this.monaco.languages
            .getLanguages()
            .find(
                language =>
                    (language.aliases && language.aliases.includes(alias)) ||
                    language.id === alias,
            );
    }

    /**
     * Currently monaco-editor is loaded via its only loader and it is RequireJs (amd) spec:
     */
    protected configRequireJs() {
        return new Promise((resolve, reject) => {
            if (this.monaco) {
                return resolve();
            }

            const onAmdLoader = () => {
                this.require.config({
                    baseUrl: this.monacoEditorConfig.baseUrl,
                    paths: { vs: 'vs' },
                });
                resolve();
            };

            const onAmdLoaderError = (error: ErrorEvent) => {
                console.error('failed to load monaco', error);
                reject(error);
            };

            const loaderScript = document.createElement('script');
            loaderScript.type = 'text/javascript';
            loaderScript.src = [this.monacoEditorConfig.baseUrl, 'vs/loader.js']
                .filter(p => !!p)
                .join('/');
            loaderScript.addEventListener('load', onAmdLoader);
            loaderScript.addEventListener('error', onAmdLoaderError);
            document.body.appendChild(loaderScript);
        });
    }

    private async loadMonaco() {
        await this.configRequireJs();
        await this.loadModule(['vs/editor/editor.main']);
    }
}
