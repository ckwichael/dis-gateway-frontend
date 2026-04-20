export const entityStateFieldOptions = [
    'header.exerciseId',
    'entityId.site',
    'entityId.application',
    'entityId.entity',
    'forceId',
    'entityType.kind',
    'entityType.domain',
    'entityType.country',
];
export function createDefaultCondition() {
    return {
        id: createId('condition'),
        type: 'condition',
        field: 'entityId.site',
        equals: 1,
    };
}
export function createDefaultMatchGroup(operator = 'AND', children = [createDefaultCondition()]) {
    return {
        id: createId('group'),
        type: 'group',
        operator,
        children,
    };
}
export function createDefaultReplacement() {
    return {
        id: createId('replacement'),
        field: 'entityId.site',
        value: 42,
    };
}
export function createDefaultEntityStateRule(name = 'Entity State Rewrite') {
    return {
        id: createId('rule'),
        name,
        enabled: true,
        match: createDefaultMatchGroup(),
        replacements: [createDefaultReplacement()],
    };
}
export function createDefaultBuilder() {
    return {
        mode: 'entity-state-replacements',
        rules: [createDefaultEntityStateRule()],
    };
}
export function buildRulePreview(builder) {
    if (!builder || builder.rules.length === 0) {
        return '[]';
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
    }));
    return JSON.stringify(preview, null, 2);
}
function serializeMatchGroup(group) {
    return {
        operator: group.operator,
        children: group.children.map((child) => child.type === 'condition'
            ? {
                type: 'condition',
                field: child.field,
                equals: child.equals,
            }
            : {
                type: 'group',
                ...serializeMatchGroup(child),
            }),
    };
}
export function normalizeRuleSet(ruleSet) {
    if (ruleSet.category !== 'replacement') {
        return ruleSet;
    }
    const builder = ruleSet.builder ?? createDefaultBuilder();
    const normalizedBuilder = {
        ...builder,
        rules: builder.rules.map((rule) => ({
            ...rule,
            match: normalizeMatchGroup(rule.match),
        })),
    };
    return {
        ...ruleSet,
        builder: normalizedBuilder,
        draftRules: buildRulePreview(normalizedBuilder),
    };
}
function normalizeMatchGroup(group) {
    if (!group) {
        return null;
    }
    return {
        ...group,
        type: 'group',
        operator: group.operator ?? 'AND',
        children: group.children?.length > 0
            ? group.children
                .map((child) => child.type === 'group'
                ? normalizeMatchGroup(child)
                : {
                    ...child,
                    type: 'condition',
                })
                .filter((child) => child != null)
            : [],
    };
}
export function normalizeOutput(output) {
    return {
        ...output,
        interface: output.interface ?? '0.0.0.0',
    };
}
export function normalizeWorkspace(workspace) {
    return {
        ...workspace,
        inputs: workspace.inputs,
        outputs: workspace.outputs.map((output) => normalizeOutput(output)),
        ruleSets: workspace.ruleSets.map((ruleSet) => normalizeRuleSet(ruleSet)),
    };
}
export function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
export function touchWorkspace(workspace) {
    return {
        ...workspace,
        meta: {
            ...workspace.meta,
            updatedAt: new Date().toISOString(),
        },
    };
}
export function createDefaultInput() {
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
    };
}
export function createDefaultOutput() {
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
    };
}
export function createDefaultRuleSet(category = 'filter') {
    const builder = category === 'replacement' ? createDefaultBuilder() : undefined;
    return {
        id: createId('ruleset'),
        name: category === 'replacement' ? 'New Replacement Rule Set' : 'New Filter Rule Set',
        category,
        description: '',
        draftRules: category === 'replacement'
            ? buildRulePreview(builder)
            : '[\n  {\n    "action": "block",\n    "pdu_type": "Fire"\n  }\n]',
        builder,
    };
}
export function createRouteName(sourceName, targetName, existingRoutes) {
    const base = `${sourceName}To${targetName.charAt(0).toUpperCase()}${targetName.slice(1)}`;
    if (!existingRoutes.some((route) => route.name === base)) {
        return base;
    }
    let suffix = 2;
    while (existingRoutes.some((route) => route.name === `${base}${suffix}`)) {
        suffix += 1;
    }
    return `${base}${suffix}`;
}
export function createRouteForConnection(source, target, existingRoutes) {
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
    };
}
export function createSeedWorkspace() {
    const inputs = [
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
    ];
    const outputs = [
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
    ];
    const ruleSets = [
        {
            id: 'ruleset-filter-fire',
            name: 'Filter Fire Events',
            category: 'filter',
            description: 'Blocks live-fire traffic from traversing the bridge.',
            draftRules: '[\n  {\n    "action": "block",\n    "pdu_type": "Fire"\n  }\n]',
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
    ];
    const routes = [
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
    ];
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
    };
}
