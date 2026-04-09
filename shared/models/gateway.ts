export type TransportMode = 'multicast' | 'unicast'
export type ProtocolType = 'dis'
export type LogLevel = 'info' | 'debug'
export type RuleSetCategory = 'filter' | 'replacement' | 'shared'
export type EntityStateFieldPath =
  | 'header.exerciseId'
  | 'entityId.site'
  | 'entityId.application'
  | 'entityId.entity'
  | 'forceId'
  | 'entityType.kind'
  | 'entityType.domain'
  | 'entityType.country'
export type RuleLogicOperator = 'AND' | 'OR'
export type MatchNodeType = 'condition' | 'group'

export interface BuilderCondition {
  id: string
  type: 'condition'
  field: EntityStateFieldPath
  equals: number
}

export interface MatchGroup {
  id: string
  type: 'group'
  operator: RuleLogicOperator
  children: MatchNode[]
}

export type MatchNode = BuilderCondition | MatchGroup
export type SerializedMatchNode =
  | { type: 'condition'; field: EntityStateFieldPath; equals: number }
  | { type: 'group'; operator: RuleLogicOperator; children: SerializedMatchNode[] }

export interface BuilderReplacement {
  id: string
  field: EntityStateFieldPath
  value: number
}

export interface EntityStateReplacementRule {
  id: string
  name: string
  enabled: boolean
  match: MatchGroup | null
  replacements: BuilderReplacement[]
}

export interface EntityStateRuleBuilder {
  mode: 'entity-state-replacements'
  rules: EntityStateReplacementRule[]
}

export interface GatewayInput {
  id: string
  name: string
  type: 'udp'
  mode: TransportMode
  host: string
  port: number
  interface: string
  ttl: number
  description: string
}

export interface GatewayOutput {
  id: string
  name: string
  type: 'udp'
  mode: TransportMode
  host: string
  port: number
  interface: string
  ttl: number
  description: string
}

export interface NetworkInterfaceOption {
  id: string
  name: string
  address: string
  description?: string
}

export interface RuleSetDefinition {
  id: string
  name: string
  category: RuleSetCategory
  description: string
  draftRules: string
  builder?: EntityStateRuleBuilder
}

export interface GatewayRoute {
  id: string
  name: string
  sourceInputId: string
  targetOutputId: string
  protocol: ProtocolType
  enabled: boolean
  passthroughUnknown: boolean
  statsIntervalSec: number
  logLevel: LogLevel
  filterRuleSetIds: string[]
  replacementRuleSetIds: string[]
  notes: string
}

export interface GatewayWorkspace {
  meta: {
    schemaVersion: string
    backend: 'node-mock'
    updatedAt: string
  }
  inputs: GatewayInput[]
  outputs: GatewayOutput[]
  ruleSets: RuleSetDefinition[]
  routes: GatewayRoute[]
}

export interface MutationResponse<T> {
  workspace: GatewayWorkspace
  item: T
}

export const entityStateFieldOptions: EntityStateFieldPath[] = [
  'header.exerciseId',
  'entityId.site',
  'entityId.application',
  'entityId.entity',
  'forceId',
  'entityType.kind',
  'entityType.domain',
  'entityType.country',
]

export function createDefaultCondition(): BuilderCondition {
  return {
    id: createId('condition'),
    type: 'condition',
    field: 'entityId.site',
    equals: 1,
  }
}

export function createDefaultMatchGroup(
  operator: RuleLogicOperator = 'AND',
  children: MatchNode[] = [createDefaultCondition()],
): MatchGroup {
  return {
    id: createId('group'),
    type: 'group',
    operator,
    children,
  }
}

export function createDefaultReplacement(): BuilderReplacement {
  return {
    id: createId('replacement'),
    field: 'entityId.site',
    value: 42,
  }
}

export function createDefaultEntityStateRule(
  name = 'Entity State Rewrite',
): EntityStateReplacementRule {
  return {
    id: createId('rule'),
    name,
    enabled: true,
    match: createDefaultMatchGroup(),
    replacements: [createDefaultReplacement()],
  }
}

export function createDefaultBuilder(): EntityStateRuleBuilder {
  return {
    mode: 'entity-state-replacements',
    rules: [createDefaultEntityStateRule()],
  }
}

export function buildRulePreview(builder?: EntityStateRuleBuilder): string {
  if (!builder || builder.rules.length === 0) {
    return '[]'
  }

  const preview = builder.rules.map((rule) => ({
    name: rule.name,
    enabled: rule.enabled,
    action: 'replace',
    pdu_type: 'EntityState',
    ...(rule.match ? { match: serializeMatchGroup(rule.match) } : {}),
    replacements: rule.replacements.map((replacement) => ({
      field: replacement.field,
      value: replacement.value,
    })),
  }))

  return JSON.stringify(preview, null, 2)
}

function serializeMatchGroup(group: MatchGroup): {
  operator: RuleLogicOperator
  children: SerializedMatchNode[]
} {
  return {
    operator: group.operator,
    children: group.children.map((child) =>
      child.type === 'condition'
        ? {
            type: 'condition',
            field: child.field,
            equals: child.equals,
          }
        : {
            type: 'group',
            ...serializeMatchGroup(child),
          },
    ),
  }
}

export function normalizeRuleSet(ruleSet: RuleSetDefinition): RuleSetDefinition {
  if (ruleSet.category !== 'replacement') {
    return ruleSet
  }

  const builder = ruleSet.builder ?? createDefaultBuilder()
  const normalizedBuilder = {
    ...builder,
    rules: builder.rules.map((rule) => ({
      ...rule,
      match: normalizeMatchGroup(rule.match),
    })),
  }

  return {
    ...ruleSet,
    builder: normalizedBuilder,
    draftRules: buildRulePreview(normalizedBuilder),
  }
}

function normalizeMatchGroup(group: MatchGroup | null | undefined): MatchGroup | null {
  if (!group) {
    return null
  }

  return {
    ...group,
    type: 'group',
    operator: group.operator ?? 'AND',
    children:
      group.children?.length > 0
        ? group.children
            .map((child) =>
              child.type === 'group'
                ? normalizeMatchGroup(child)
                : {
                    ...child,
                    type: 'condition' as const,
                  },
            )
            .filter((child): child is MatchNode => child != null)
        : [],
  }
}

export function normalizeOutput(output: GatewayOutput): GatewayOutput {
  return {
    ...output,
    interface: output.interface ?? '0.0.0.0',
  }
}

export function normalizeWorkspace(workspace: GatewayWorkspace): GatewayWorkspace {
  return {
    ...workspace,
    inputs: workspace.inputs,
    outputs: workspace.outputs.map((output) => normalizeOutput(output)),
    ruleSets: workspace.ruleSets.map((ruleSet) => normalizeRuleSet(ruleSet)),
  }
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function touchWorkspace(workspace: GatewayWorkspace): GatewayWorkspace {
  return {
    ...workspace,
    meta: {
      ...workspace.meta,
      updatedAt: new Date().toISOString(),
    },
  }
}

export function createDefaultInput(): GatewayInput {
  return {
    id: createId('input'),
    name: 'newInput',
    type: 'udp',
    mode: 'multicast',
    host: '239.1.10.10',
    port: 3000,
    interface: '0.0.0.0',
    ttl: 32,
    description: '',
  }
}

export function createDefaultOutput(): GatewayOutput {
  return {
    id: createId('output'),
    name: 'newOutput',
    type: 'udp',
    mode: 'multicast',
    host: '239.1.10.20',
    port: 3000,
    interface: '0.0.0.0',
    ttl: 32,
    description: '',
  }
}

export function createDefaultRuleSet(
  category: RuleSetCategory = 'filter',
): RuleSetDefinition {
  const builder = category === 'replacement' ? createDefaultBuilder() : undefined

  return {
    id: createId('ruleset'),
    name: category === 'replacement' ? 'New Replacement Rule Set' : 'New Filter Rule Set',
    category,
    description: '',
    draftRules:
      category === 'replacement'
        ? buildRulePreview(builder)
        : '[\n  {\n    "action": "block",\n    "pdu_type": "Fire"\n  }\n]',
    builder,
  }
}

export function createRouteName(
  sourceName: string,
  targetName: string,
  existingRoutes: GatewayRoute[],
) {
  const base = `${sourceName}To${targetName.charAt(0).toUpperCase()}${targetName.slice(1)}`
  if (!existingRoutes.some((route) => route.name === base)) {
    return base
  }

  let suffix = 2
  while (existingRoutes.some((route) => route.name === `${base}${suffix}`)) {
    suffix += 1
  }

  return `${base}${suffix}`
}

export function createRouteForConnection(
  source: GatewayInput,
  target: GatewayOutput,
  existingRoutes: GatewayRoute[],
): GatewayRoute {
  return {
    id: createId('route'),
    name: createRouteName(source.name, target.name, existingRoutes),
    sourceInputId: source.id,
    targetOutputId: target.id,
    protocol: 'dis',
    enabled: true,
    passthroughUnknown: true,
    statsIntervalSec: 30,
    logLevel: 'info',
    filterRuleSetIds: [],
    replacementRuleSetIds: [],
    notes: '',
  }
}

export function createSeedWorkspace(): GatewayWorkspace {
  const inputs: GatewayInput[] = [
    {
      id: 'input-sima',
      name: 'simA',
      type: 'udp',
      mode: 'multicast',
      host: '239.1.1.1',
      port: 3000,
      interface: '0.0.0.0',
      ttl: 32,
      description: 'Simulator A ingress',
    },
    {
      id: 'input-simb',
      name: 'simB',
      type: 'udp',
      mode: 'multicast',
      host: '239.1.1.2',
      port: 3000,
      interface: '0.0.0.0',
      ttl: 32,
      description: 'Simulator B ingress',
    },
    {
      id: 'input-range',
      name: 'range',
      type: 'udp',
      mode: 'unicast',
      host: '0.0.0.0',
      port: 5000,
      interface: '192.168.12.40',
      ttl: 32,
      description: 'Live range ingest',
    },
  ]

  const outputs: GatewayOutput[] = [
    {
      id: 'output-to-sima',
      name: 'toSimA',
      type: 'udp',
      mode: 'multicast',
      host: '239.1.1.1',
      port: 3000,
      interface: '0.0.0.0',
      ttl: 32,
      description: 'Return path to Simulator A',
    },
    {
      id: 'output-to-simb',
      name: 'toSimB',
      type: 'udp',
      mode: 'multicast',
      host: '239.1.1.2',
      port: 3000,
      interface: '0.0.0.0',
      ttl: 32,
      description: 'Return path to Simulator B',
    },
    {
      id: 'output-recorder',
      name: 'toRecorder',
      type: 'udp',
      mode: 'unicast',
      host: '10.0.0.99',
      port: 6000,
      interface: '0.0.0.0',
      ttl: 32,
      description: 'Traffic mirror recorder',
    },
  ]

  const ruleSets: RuleSetDefinition[] = [
    {
      id: 'ruleset-filter-fire',
      name: 'Filter Fire Events',
      category: 'filter',
      description: 'Blocks live-fire traffic from traversing the bridge.',
      draftRules:
        '[\n  {\n    "action": "block",\n    "pdu_type": "Fire"\n  }\n]',
    },
    {
      id: 'ruleset-rewrite-site',
      name: 'Rewrite Site IDs',
      category: 'replacement',
      description: 'Applies site/application remaps before forwarding.',
      builder: {
        mode: 'entity-state-replacements',
        rules: [
          {
            id: 'rule-site-remap',
            name: 'Blue side site remap',
            enabled: true,
            match: {
              id: 'group-root',
              type: 'group',
              operator: 'OR',
              children: [
                {
                  id: 'group-left',
                  type: 'group',
                  operator: 'AND',
                  children: [
                    { id: 'condition-site', type: 'condition', field: 'entityId.site', equals: 1 },
                    { id: 'condition-app', type: 'condition', field: 'entityId.application', equals: 3000 },
                  ],
                },
                { id: 'condition-exercise', type: 'condition', field: 'header.exerciseId', equals: 7 },
              ],
            },
            replacements: [
              { id: 'replacement-site', field: 'entityId.site', value: 42 },
              { id: 'replacement-app', field: 'entityId.application', value: 3001 },
            ],
          },
        ],
      },
      draftRules: '[]',
    },
  ]

  const routes: GatewayRoute[] = [
    {
      id: 'route-a-to-b',
      name: 'aToB',
      sourceInputId: 'input-sima',
      targetOutputId: 'output-to-simb',
      protocol: 'dis',
      enabled: true,
      passthroughUnknown: true,
      statsIntervalSec: 15,
      logLevel: 'info',
      filterRuleSetIds: ['ruleset-filter-fire'],
      replacementRuleSetIds: ['ruleset-rewrite-site'],
      notes: 'Primary bridge from simA toward simB.',
    },
    {
      id: 'route-b-to-a',
      name: 'bToA',
      sourceInputId: 'input-simb',
      targetOutputId: 'output-to-sima',
      protocol: 'dis',
      enabled: true,
      passthroughUnknown: true,
      statsIntervalSec: 15,
      logLevel: 'info',
      filterRuleSetIds: [],
      replacementRuleSetIds: ['ruleset-rewrite-site'],
      notes: 'Reverse bridge back to simA.',
    },
    {
      id: 'route-range-recorder',
      name: 'rangeToRecorder',
      sourceInputId: 'input-range',
      targetOutputId: 'output-recorder',
      protocol: 'dis',
      enabled: true,
      passthroughUnknown: true,
      statsIntervalSec: 30,
      logLevel: 'debug',
      filterRuleSetIds: [],
      replacementRuleSetIds: [],
      notes: 'Mirror live range traffic for auditing.',
    },
  ]

  return {
    meta: {
      schemaVersion: '0.1.0',
      backend: 'node-mock',
      updatedAt: new Date().toISOString(),
    },
    inputs,
    outputs,
    ruleSets: ruleSets.map((ruleSet) => normalizeRuleSet(ruleSet)),
    routes,
  }
}
