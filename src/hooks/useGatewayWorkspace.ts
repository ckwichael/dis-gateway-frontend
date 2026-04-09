import { startTransition, useEffect, useState } from 'react'
import type {
  GatewayInput,
  NetworkInterfaceOption,
  GatewayOutput,
  GatewayRoute,
  GatewayWorkspace,
  RuleSetDefinition,
} from '../../shared/models/gateway.ts'
import { gatewayApi } from '../api/client.ts'

export function useGatewayWorkspace() {
  const [workspace, setWorkspace] = useState<GatewayWorkspace | null>(null)
  const [interfaceOptions, setInterfaceOptions] = useState<NetworkInterfaceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void reload()
  }, [])

  async function reload() {
    setLoading(true)
    setError(null)

    try {
      const [nextWorkspace, nextInterfaces] = await Promise.all([
        gatewayApi.getWorkspace(),
        gatewayApi.getInterfaces(),
      ])
      startTransition(() => {
        setWorkspace(nextWorkspace)
        setInterfaceOptions(nextInterfaces)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load workspace.')
    } finally {
      setLoading(false)
    }
  }

  async function mutate<T>(operation: () => Promise<{ workspace: GatewayWorkspace; item?: T }>) {
    setSaving(true)
    setError(null)

    try {
      const response = await operation()
      startTransition(() => {
        setWorkspace(response.workspace)
      })
      return response.item
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.')
      return undefined
    } finally {
      setSaving(false)
    }
  }

  return {
    workspace,
    interfaceOptions,
    loading,
    saving,
    error,
    reload,
    createInput: (input: Partial<GatewayInput>) =>
      mutate(() => gatewayApi.createInput(input)),
    updateInput: (input: GatewayInput) =>
      mutate(() => gatewayApi.updateInput(input)),
    deleteInput: async (id: string) => {
      await mutate(() => gatewayApi.deleteInput(id))
    },
    createOutput: (output: Partial<GatewayOutput>) =>
      mutate(() => gatewayApi.createOutput(output)),
    updateOutput: (output: GatewayOutput) =>
      mutate(() => gatewayApi.updateOutput(output)),
    deleteOutput: async (id: string) => {
      await mutate(() => gatewayApi.deleteOutput(id))
    },
    createRuleSet: (ruleSet: Partial<RuleSetDefinition>) =>
      mutate(() => gatewayApi.createRuleSet(ruleSet)),
    updateRuleSet: (ruleSet: RuleSetDefinition) =>
      mutate(() => gatewayApi.updateRuleSet(ruleSet)),
    deleteRuleSet: async (id: string) => {
      await mutate(() => gatewayApi.deleteRuleSet(id))
    },
    createRoute: (route: Partial<GatewayRoute>) =>
      mutate(() => gatewayApi.createRoute(route)),
    updateRoute: (route: GatewayRoute) =>
      mutate(() => gatewayApi.updateRoute(route)),
    deleteRoute: async (id: string) => {
      await mutate(() => gatewayApi.deleteRoute(id))
    },
  }
}
