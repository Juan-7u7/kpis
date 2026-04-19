export interface CustomFormulaVariable {
  key: string;
  label: string;
  helpText?: string;
}

export interface CustomFormulaConfig {
  expression: string;
  variables: CustomFormulaVariable[];
}

type Operator = '+' | '-' | '*' | '/';

const OPERATOR_PRECEDENCE: Record<Operator, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2
};

const isOperator = (token: string): token is Operator => ['+', '-', '*', '/'].includes(token);

export const normalizeFormulaKey = (value: string, fallback = 'variable') => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');

  return normalized || fallback;
};

const tokenizeExpression = (expression: string) => {
  const compactExpression = expression.replace(/\s+/g, '');
  const tokens = compactExpression.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]/g);

  if (!tokens || tokens.join('') !== compactExpression) {
    throw new Error('La formula contiene caracteres no permitidos.');
  }

  return tokens;
};

const toReversePolishNotation = (tokens: string[]) => {
  const output: string[] = [];
  const operators: string[] = [];

  for (const token of tokens) {
    if (/^\d+(?:\.\d+)?$/.test(token) || /^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      output.push(token);
      continue;
    }

    if (isOperator(token)) {
      while (operators.length > 0) {
        const top = operators[operators.length - 1];
        if (!isOperator(top)) break;
        if (OPERATOR_PRECEDENCE[top] < OPERATOR_PRECEDENCE[token]) break;

        output.push(operators.pop() as string);
      }

      operators.push(token);
      continue;
    }

    if (token === '(') {
      operators.push(token);
      continue;
    }

    if (token === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        output.push(operators.pop() as string);
      }

      if (operators.pop() !== '(') {
        throw new Error('La formula tiene parentesis desbalanceados.');
      }
    }
  }

  while (operators.length > 0) {
    const top = operators.pop() as string;
    if (top === '(' || top === ')') {
      throw new Error('La formula tiene parentesis desbalanceados.');
    }
    output.push(top);
  }

  return output;
};

export const evaluateCustomFormula = (expression: string, values: Record<string, number>) => {
  const rpn = toReversePolishNotation(tokenizeExpression(expression));
  const stack: number[] = [];

  for (const token of rpn) {
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      stack.push(Number(token));
      continue;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      if (!(token in values)) {
        throw new Error(`La variable "${token}" no tiene valor.`);
      }

      stack.push(values[token]);
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();

    if (left === undefined || right === undefined) {
      throw new Error('La formula esta incompleta.');
    }

    switch (token) {
      case '+':
        stack.push(left + right);
        break;
      case '-':
        stack.push(left - right);
        break;
      case '*':
        stack.push(left * right);
        break;
      case '/':
        if (right === 0) {
          throw new Error('La formula intenta dividir entre cero.');
        }
        stack.push(left / right);
        break;
      default:
        throw new Error('La formula contiene una operacion no soportada.');
    }
  }

  if (stack.length !== 1 || !Number.isFinite(stack[0])) {
    throw new Error('No se pudo resolver la formula.');
  }

  return stack[0];
};

export const validateCustomFormula = (config: CustomFormulaConfig) => {
  if (!config.expression.trim()) {
    return { valid: false, error: 'Escribe la formula que se usara para calcular el KPI.' };
  }

  if (config.variables.length === 0) {
    return { valid: false, error: 'Agrega al menos una variable para la formula personalizada.' };
  }

  if (config.variables.some((variable) => !variable.label.trim() || !variable.key.trim())) {
    return { valid: false, error: 'Cada variable necesita un nombre visible y una clave para la formula.' };
  }

  const keys = config.variables.map((variable) => variable.key);
  const uniqueKeys = new Set(keys);

  if (uniqueKeys.size !== keys.length) {
    return { valid: false, error: 'Cada variable debe tener una clave distinta.' };
  }

  try {
    const tokens = tokenizeExpression(config.expression);

    for (const token of tokens) {
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token) && !uniqueKeys.has(token)) {
        return { valid: false, error: `La formula usa la variable "${token}" pero no esta definida.` };
      }
    }

    const sampleValues = config.variables.reduce<Record<string, number>>((acc, variable, index) => {
      acc[variable.key] = index + 1;
      return acc;
    }, {});

    evaluateCustomFormula(config.expression, sampleValues);
    return { valid: true as const };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'No se pudo validar la formula personalizada.'
    };
  }
};
