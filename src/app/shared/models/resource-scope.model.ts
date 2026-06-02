export interface ScopeApiFields {
  scope?: number | string | null;
  scopeName?: string | null;
  isGlobal?: boolean;
}

export interface EditableScopeApiFields extends ScopeApiFields {
  isEditable?: boolean;
}

export interface SelectableScopeApiFields extends ScopeApiFields {
  isSelectable?: boolean;
}

export interface SelectableEditableScopeApiFields extends SelectableScopeApiFields {
  isEditable?: boolean;
}

export interface ScopeState {
  scope: number | null;
  scopeName: string;
  isGlobal: boolean;
}

export interface EditableScopeState extends ScopeState {
  isEditable: boolean;
}

export interface SelectableScopeState extends ScopeState {
  isSelectable: boolean;
}

export interface SelectableEditableScopeState extends SelectableScopeState {
  isEditable: boolean;
}

export function toScopeState(response: ScopeApiFields): ScopeState {
  const scope = toNumericScope(response.scope);
  const isGlobal = toIsGlobal(scope, response.scopeName, response.isGlobal);

  return {
    scope,
    scopeName: toScopeName(response.scopeName, isGlobal),
    isGlobal,
  };
}

export function toEditableScopeState(response: EditableScopeApiFields): EditableScopeState {
  return {
    ...toScopeState(response),
    isEditable: response.isEditable ?? true,
  };
}

export function toSelectableScopeState(response: SelectableScopeApiFields): SelectableScopeState {
  return {
    ...toScopeState(response),
    isSelectable: response.isSelectable ?? true,
  };
}

export function toSelectableEditableScopeState(
  response: SelectableEditableScopeApiFields,
): SelectableEditableScopeState {
  return {
    ...toSelectableScopeState(response),
    isEditable: response.isEditable ?? true,
  };
}

function toNumericScope(scope: number | string | null | undefined): number | null {
  if (typeof scope === 'number') {
    return Number.isFinite(scope) ? scope : null;
  }

  if (typeof scope === 'string') {
    const numericScope = Number(scope);
    return Number.isFinite(numericScope) ? numericScope : null;
  }

  return null;
}

function toIsGlobal(
  scope: number | null,
  scopeName: string | null | undefined,
  isGlobal: boolean | undefined,
): boolean {
  if (typeof isGlobal === 'boolean') {
    return isGlobal;
  }

  if (scope === 2) {
    return true;
  }

  if (scope === 1) {
    return false;
  }

  return (scopeName ?? '').trim().toLowerCase() === 'global';
}

function toScopeName(scopeName: string | null | undefined, isGlobal: boolean): string {
  const normalizedScopeName = scopeName?.trim() ?? '';
  return normalizedScopeName.length > 0 ? normalizedScopeName : isGlobal ? 'Global' : 'Branch';
}
