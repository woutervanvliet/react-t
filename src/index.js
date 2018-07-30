// @flow
import * as React from 'react';
import MoEngine from './mo-engine';

type Replacements = {
  [key: string]: string | number,
}

type TranslateProps = {
  source: string,
  sourcePlural?: string,
  count?: number,
  context?: string,
  replacements?: Replacements,
}

const replace = (input, replacements: Replacements) => {
  let result = input;

  const replacementKeys = Object.keys(replacements);
  for (let i = 0; i < replacementKeys.length; i += 1) {
    const from = replacementKeys[i];
    const to = replacements[from];
    result = result.split(`{${from}`).join(`${to}`);
  }

  return result;
};

interface TranslateEngine {
  translate(source: string, sourcePlural?: string, count?: number, context?: string): string;
}

class MockTranslateEngine implements TranslateEngine {
  // eslint-disable-next-line class-methods-use-this,no-unused-vars
  translate(source: string, sourcePlural?: string, count?: number, context?: string) {
    if (sourcePlural && count !== undefined && (count === 0 || count > 1)) {
      return sourcePlural;
    }

    return source;
  }
}

class TranslationProxy {
  engine: *;

  constructor(engine: TranslateEngine) {
    this.engine = engine;
  }

  _ = (source: string, context?: string, replacements: Replacements = {}) => replace(
    this.engine.translate(
      source,
      undefined,
      undefined,
      context,
    ),
    replacements,
  )

  _n = (
    singularSource: string,
    pluralSource: string,
    count: number,
    context?: string,
    replacements:
      Replacements = {},
  ) => replace(
    this.engine.translate(
      singularSource,
      pluralSource,
      count,
      context,
    ),
    replacements,
  )
}

const {
  Provider,
  Consumer,
} = React.createContext(new TranslationProxy(new MockTranslateEngine()));

function T(props: TranslateProps) {
  return (
    <Consumer>
      {(engine) => {
        const { count } = props;
        if (count === undefined || !props.sourcePlural) {
          return engine._(props.source, props.context, props.replacements);
        }

        return engine._n(
          props.source,
          props.sourcePlural,
          count,
          props.context,
          props.replacements,
        )
          .replace(/%d/g, count.toFixed(0))
          .replace(/%f/g, count.toFixed(2));
      }}
    </Consumer>
  );
}

type TranslationProviderProps = {
  engine: TranslateEngine,
  children: React.Node,
}
function TranslationProvider({ engine, children }: TranslationProviderProps) {
  return (
    <Provider value={new TranslationProxy(engine)}>
      {children}
    </Provider>
  );
}

function _(source: string, context?: string, replacements: Replacements = {}): React.Node {
  return (
    <T
      source={source}
      context={context}
      replacements={replacements}
    />
  );
}

function _n(
  singularSource: string,
  pluralSource: string,
  count: number,
  context?: string,
  replacements:
    Replacements = {},
): React.Node {
  return (
    <T
      source={singularSource}
      sourcePlural={pluralSource}
      count={count}
      context={context}
      replacements={replacements}
    />
  );
}

export {
  Consumer as TranslationContext,
  TranslationProvider,
  MoEngine,
  T,
  _,
  _n,
};