import type {
  GatewayInput,
  NetworkInterfaceOption,
  GatewayOutput,
  GatewayRoute,
  GatewayWorkspace,
  MutationResponse,
  RuleSetDefinition,
} from '../../shared/models/gateway.ts'
import { normalizeWorkspace } from '../../shared/models/gateway.ts'

function resolveApiBase() {
  const desktopApiBase = window.disGatewayDesktop?.apiBase
  if (desktopApiBase) {
    return desktopApiBase
  }

  if (window.location.protocol === 'file:') {
    return 'http://127.0.0.1:4010/api'
  }

  return '/api'
}

const apiBase = resolveApiBase()

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with ${response.status}`)
  }

  return (await response.json()) as T
}

export const gatewayApi = {
  getWorkspace() {
    return request<GatewayWorkspace>('/workspace').then(normalizeWorkspace)
  },
  getInterfaces() {
    return request<NetworkInterfaceOption[]>('/interfaces')
  },
  createInput(input: Partial<GatewayInput>) {
    return request<MutationResponse<GatewayInput>>('/inputs', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  updateInput(input: GatewayInput) {
    return request<MutationResponse<GatewayInput>>(`/inputs/${input.id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  deleteInput(id: string) {
    return request<{ workspace: GatewayWorkspace }>(`/inputs/${id}`, {
      method: 'DELETE',
    }).then((response) => ({ workspace: normalizeWorkspace(response.workspace) }))
  },
  createOutput(output: Partial<GatewayOutput>) {
    return request<MutationResponse<GatewayOutput>>('/outputs', {
      method: 'POST',
      body: JSON.stringify(output),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  updateOutput(output: GatewayOutput) {
    return request<MutationResponse<GatewayOutput>>(`/outputs/${output.id}`, {
      method: 'PUT',
      body: JSON.stringify(output),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  deleteOutput(id: string) {
    return request<{ workspace: GatewayWorkspace }>(`/outputs/${id}`, {
      method: 'DELETE',
    }).then((response) => ({ workspace: normalizeWorkspace(response.workspace) }))
  },
  createRuleSet(ruleSet: Partial<RuleSetDefinition>) {
    return request<MutationResponse<RuleSetDefinition>>('/rulesets', {
      method: 'POST',
      body: JSON.stringify(ruleSet),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  updateRuleSet(ruleSet: RuleSetDefinition) {
    return request<MutationResponse<RuleSetDefinition>>(`/rulesets/${ruleSet.id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleSet),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  deleteRuleSet(id: string) {
    return request<{ workspace: GatewayWorkspace }>(`/rulesets/${id}`, {
      method: 'DELETE',
    }).then((response) => ({ workspace: normalizeWorkspace(response.workspace) }))
  },
  createRoute(route: Partial<GatewayRoute>) {
    return request<MutationResponse<GatewayRoute>>('/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  updateRoute(route: GatewayRoute) {
    return request<MutationResponse<GatewayRoute>>(`/routes/${route.id}`, {
      method: 'PUT',
      body: JSON.stringify(route),
    }).then((response) => ({ ...response, workspace: normalizeWorkspace(response.workspace) }))
  },
  deleteRoute(id: string) {
    return request<{ workspace: GatewayWorkspace }>(`/routes/${id}`, {
      method: 'DELETE',
    }).then((response) => ({ workspace: normalizeWorkspace(response.workspace) }))
  },
}
