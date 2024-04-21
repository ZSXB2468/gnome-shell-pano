import type { CodeHighlighter, Language } from '@pano/utils/code/highlight';
import { PygmentsCodeHighlighter } from '@pano/utils/code/pygments';

//TODO:
// add highlight.js back, if it is installed and can be found via require()
// add settings, that might change theses things:
// which doe formatter to use, which style to use
// enable, disable formatting, change the threshold (event if its always 1.0 in e.g pygmentize)
// only make these count, if enabled is set, so if at least one formatter is found
// button to recheck tools
// customs settings per highlighter

export class PangoMarkdown {
  private _detectedHighlighter: CodeHighlighter[] = [];

  private _currentHighlighter: CodeHighlighter | null = null;

  public static readonly availableCodeHighlighter: CodeHighlighter[] = [new PygmentsCodeHighlighter()];

  constructor(preferredHighlighter: string | null = null) {
    this.detectHighlighter(preferredHighlighter);
  }

  get detectedHighlighter() {
    return this._detectedHighlighter;
  }

  get currentHighlighter() {
    return this._currentHighlighter;
  }

  // this is called in the constructor and can be called at any moment later by settings etc.
  public detectHighlighter(preferredHighlighter: string | null = null) {
    this._detectedHighlighter = [];

    for (const codeHighlighter of PangoMarkdown.availableCodeHighlighter) {
      if (codeHighlighter.isInstalled()) {
        this._detectedHighlighter.push(codeHighlighter);

        if (preferredHighlighter === null) {
          if (this._currentHighlighter === null) {
            this._currentHighlighter = codeHighlighter;
          }
        } else if (codeHighlighter.name == preferredHighlighter) {
          this._currentHighlighter = codeHighlighter;
        }
      }
    }
  }

  public detectLanguage(text: string): Language | undefined {
    if (this._currentHighlighter === null) {
      return undefined;
    }

    return this._currentHighlighter.detectLanguage(text);
  }

  public markupCode(language: string, text: string, characterLength: number): string | undefined {
    if (this._currentHighlighter === null) {
      return undefined;
    }

    return this._currentHighlighter.markupCode(language, text, characterLength);
  }
}
