import { createServer } from 'node:http';
import { URL } from 'node:url';
import { createDefaultInput, createDefaultOutput, createDefaultRuleSet, createRouteForConnection, createSeedWorkspace, touchWorkspace, } from "../shared/models/gateway.js";
const port = Number(process.env.PORT ?? 4010);
let workspace = createSeedWorkspace();
function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    response.end(JSON.stringify(payload));
}
async function readBody(request) {
    const chunks = [];
    for await (const chunk of request) {
        chunks.push(Buffer.from(chunk));
    }
    if (chunks.length === 0) {
        return {};
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function updateWorkspace(next) {
    workspace = touchWorkspace(next);
    return workspace;
}
function wrapMutation(item) {
    return { workspace, item };
}
function removeRoutesForEndpoint(routes, endpointId, kind) {
    return routes.filter((route) => kind === 'input' ? route.sourceInputId !== endpointId : route.targetOutputId !== endpointId);
}
function hasDuplicateRoutePair(routes, sourceInputId, targetOutputId, excludeRouteId) {
    return routes.some((route) => route.id !== excludeRouteId &&
        route.sourceInputId === sourceInputId &&
        route.targetOutputId === targetOutputId);
}
createServer(async (request, response) => {
    if (!request.url || !request.method) {
        sendJson(response, 400, { message: 'Malformed request.' });
        return;
    }
    if (request.method === 'OPTIONS') {
        sendJson(response, 200, { ok: true });
        return;
    }
    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
    const path = url.pathname;
    try {
        if (request.method === 'GET' && path === '/api/health') {
            sendJson(response, 200, { ok: true, backend: workspace.meta.backend });
            return;
        }
        if (request.method === 'GET' && path === '/api/workspace') {
            sendJson(response, 200, workspace);
            return;
        }
        if (request.method === 'POST' && path === '/api/inputs') {
            const payload = (await readBody(request)) ?? {};
            const item = { ...createDefaultInput(), ...payload };
            updateWorkspace({ ...workspace, inputs: [...workspace.inputs, item] });
            sendJson(response, 201, wrapMutation(item));
            return;
        }
        if (request.method === 'POST' && path === '/api/outputs') {
            const payload = (await readBody(request)) ?? {};
            const item = { ...createDefaultOutput(), ...payload };
            updateWorkspace({ ...workspace, outputs: [...workspace.outputs, item] });
            sendJson(response, 201, wrapMutation(item));
            return;
        }
        if (request.method === 'POST' && path === '/api/rulesets') {
            const payload = (await readBody(request)) ?? {};
            const item = { ...createDefaultRuleSet(payload.category), ...payload };
            updateWorkspace({ ...workspace, ruleSets: [...workspace.ruleSets, item] });
            sendJson(response, 201, wrapMutation(item));
            return;
        }
        if (request.method === 'POST' && path === '/api/routes') {
            const payload = await readBody(request);
            const source = workspace.inputs.find((input) => input.id === payload.sourceInputId);
            const target = workspace.outputs.find((output) => output.id === payload.targetOutputId);
            if (!source || !target) {
                sendJson(response, 400, { message: 'A route must reference a valid input and output.' });
                return;
            }
            if (hasDuplicateRoutePair(workspace.routes, source.id, target.id)) {
                sendJson(response, 409, { message: 'Only one route is allowed per input/output pair.' });
                return;
            }
            const item = { ...createRouteForConnection(source, target, workspace.routes), ...payload };
            updateWorkspace({ ...workspace, routes: [...workspace.routes, item] });
            sendJson(response, 201, wrapMutation(item));
            return;
        }
        const inputMatch = path.match(/^\/api\/inputs\/([^/]+)$/);
        if (inputMatch) {
            const id = inputMatch[1];
            if (request.method === 'PUT') {
                const payload = await readBody(request);
                let item;
                updateWorkspace({
                    ...workspace,
                    inputs: workspace.inputs.map((input) => {
                        if (input.id !== id) {
                            return input;
                        }
                        item = payload;
                        return payload;
                    }),
                });
                sendJson(response, 200, wrapMutation(item));
                return;
            }
            if (request.method === 'DELETE') {
                updateWorkspace({
                    ...workspace,
                    inputs: workspace.inputs.filter((input) => input.id !== id),
                    routes: removeRoutesForEndpoint(workspace.routes, id, 'input'),
                });
                sendJson(response, 200, { workspace });
                return;
            }
        }
        const outputMatch = path.match(/^\/api\/outputs\/([^/]+)$/);
        if (outputMatch) {
            const id = outputMatch[1];
            if (request.method === 'PUT') {
                const payload = await readBody(request);
                let item;
                updateWorkspace({
                    ...workspace,
                    outputs: workspace.outputs.map((output) => {
                        if (output.id !== id) {
                            return output;
                        }
                        item = payload;
                        return payload;
                    }),
                });
                sendJson(response, 200, wrapMutation(item));
                return;
            }
            if (request.method === 'DELETE') {
                updateWorkspace({
                    ...workspace,
                    outputs: workspace.outputs.filter((output) => output.id !== id),
                    routes: removeRoutesForEndpoint(workspace.routes, id, 'output'),
                });
                sendJson(response, 200, { workspace });
                return;
            }
        }
        const ruleSetMatch = path.match(/^\/api\/rulesets\/([^/]+)$/);
        if (ruleSetMatch) {
            const id = ruleSetMatch[1];
            if (request.method === 'PUT') {
                const payload = await readBody(request);
                let item;
                updateWorkspace({
                    ...workspace,
                    ruleSets: workspace.ruleSets.map((ruleSet) => {
                        if (ruleSet.id !== id) {
                            return ruleSet;
                        }
                        item = payload;
                        return payload;
                    }),
                });
                sendJson(response, 200, wrapMutation(item));
                return;
            }
            if (request.method === 'DELETE') {
                updateWorkspace({
                    ...workspace,
                    ruleSets: workspace.ruleSets.filter((ruleSet) => ruleSet.id !== id),
                    routes: workspace.routes.map((route) => ({
                        ...route,
                        filterRuleSetIds: route.filterRuleSetIds.filter((ruleSetId) => ruleSetId !== id),
                        replacementRuleSetIds: route.replacementRuleSetIds.filter((ruleSetId) => ruleSetId !== id),
                    })),
                });
                sendJson(response, 200, { workspace });
                return;
            }
        }
        const routeMatch = path.match(/^\/api\/routes\/([^/]+)$/);
        if (routeMatch) {
            const id = routeMatch[1];
            if (request.method === 'PUT') {
                const payload = await readBody(request);
                let item;
                if (hasDuplicateRoutePair(workspace.routes, payload.sourceInputId, payload.targetOutputId, id)) {
                    sendJson(response, 409, { message: 'Only one route is allowed per input/output pair.' });
                    return;
                }
                updateWorkspace({
                    ...workspace,
                    routes: workspace.routes.map((route) => {
                        if (route.id !== id) {
                            return route;
                        }
                        item = payload;
                        return payload;
                    }),
                });
                sendJson(response, 200, wrapMutation(item));
                return;
            }
            if (request.method === 'DELETE') {
                updateWorkspace({
                    ...workspace,
                    routes: workspace.routes.filter((route) => route.id !== id),
                });
                sendJson(response, 200, { workspace });
                return;
            }
        }
        sendJson(response, 404, { message: `No route handler for ${path}` });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        sendJson(response, 500, { message });
    }
}).listen(port, () => {
    console.log(`DIS Gateway mock API listening on http://localhost:${port}`);
});
