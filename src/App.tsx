import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, CssBaseline, ThemeProvider } from '@mui/material'
import { MarkerType, ReactFlowProvider, type Connection, type Edge, type Node, type ReactFlowInstance } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type {
  GatewayInput,
  GatewayOutput,
  GatewayRoute,
} from '../shared/models/gateway.ts'
import {
  createDefaultInput,
  createDefaultOutput,
  createDefaultRuleSet,
} from '../shared/models/gateway.ts'
import { EndpointNode } from './components/EndpointNode.tsx'
import { InspectorDrawer } from './components/InspectorDrawer.tsx'
import { RuleSetManagerDialog } from './components/RuleSetManagerDialog.tsx'
import { WorkspaceCanvas } from './components/WorkspaceCanvas.tsx'
import { useGatewayWorkspace } from './hooks/useGatewayWorkspace.ts'
import { appTheme } from './theme.ts'
import './App.css'

type Selection =
  | { kind: 'input'; id: string }
  | { kind: 'output'; id: string }
  | { kind: 'route'; id: string }
  | null

const nodeTypes = { endpoint: EndpointNode }
const endpointNodeWidth = 282

function App() {
  const api = useGatewayWorkspace()
  const [selection, setSelection] = useState<Selection>(null)
  const [inputDraft, setInputDraft] = useState<GatewayInput | null>(null)
  const [outputDraft, setOutputDraft] = useState<GatewayOutput | null>(null)
  const [routeDraft, setRouteDraft] = useState<GatewayRoute | null>(null)
  const [ruleSetManagerOpen, setRuleSetManagerOpen] = useState(false)
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<string | null>(null)
  const canvasShellRef = useRef<HTMLDivElement | null>(null)
  const canvasResizeObserverRef = useRef<ResizeObserver | null>(null)
  const reactFlowRef = useRef<ReactFlowInstance<Node, Edge> | null>(null)
  const [canvasWidth, setCanvasWidth] = useState<number | null>(null)

  const selectedInput =
    selection?.kind === 'input'
      ? api.workspace?.inputs.find((input) => input.id === selection.id) ?? null
      : null
  const selectedOutput =
    selection?.kind === 'output'
      ? api.workspace?.outputs.find((output) => output.id === selection.id) ?? null
      : null
  const selectedRoute =
    selection?.kind === 'route'
      ? api.workspace?.routes.find((route) => route.id === selection.id) ?? null
      : null

  const laneCount = Math.max(
    api.workspace?.inputs.length ?? 0,
    api.workspace?.outputs.length ?? 0,
    1,
  )
  const canvasHeight = 180 + laneCount * 148
  const measuredCanvasWidth = canvasWidth ?? 0
  const inputLaneX = Math.max(endpointNodeWidth / 2 + 32, measuredCanvasWidth * 0.25)
  const outputLaneX = Math.max(inputLaneX + endpointNodeWidth + 120, measuredCanvasWidth * 0.75)

  useEffect(() => setInputDraft(selectedInput), [selectedInput])
  useEffect(() => setOutputDraft(selectedOutput), [selectedOutput])
  useEffect(() => setRouteDraft(selectedRoute), [selectedRoute])
  useEffect(() => {
    if (api.workspace && api.workspace.ruleSets.length > 0 && selectedRuleSetId == null) {
      setSelectedRuleSetId(api.workspace.ruleSets[0].id)
    }
  }, [api.workspace, selectedRuleSetId])
  const setCanvasShellRef = useCallback((element: HTMLDivElement | null) => {
    canvasResizeObserverRef.current?.disconnect()
    canvasShellRef.current = element

    if (!element) {
      setCanvasWidth(null)
      return
    }

    const updateWidth = () => setCanvasWidth(element.clientWidth)
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    canvasResizeObserverRef.current = observer
  }, [])

  useEffect(() => {
    return () => canvasResizeObserverRef.current?.disconnect()
  }, [])
  useEffect(() => {
    if (!reactFlowRef.current) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      reactFlowRef.current?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [canvasWidth, canvasHeight, api.workspace?.inputs.length, api.workspace?.outputs.length])

  const nodes: Node[] =
    api.workspace == null || canvasWidth == null
      ? []
      : [
        ...api.workspace.inputs.map((input, index) => ({
          id: input.id,
          type: 'endpoint',
          position: { x: inputLaneX, y: 90 + index * 148 },
          data: {
            title: input.name,
            subtitle: `${input.mode.toUpperCase()} ${input.host}:${input.port}`,
            lane: 'input',
          },
          draggable: false,
        })),
        ...api.workspace.outputs.map((output, index) => ({
          id: output.id,
          type: 'endpoint',
          position: { x: outputLaneX, y: 90 + index * 148 },
          data: {
            title: output.name,
            subtitle: `${output.mode.toUpperCase()} ${output.host}:${output.port}`,
            lane: 'output',
          },
          draggable: false,
        })),
      ]

  const edges: Edge[] =
    api.workspace?.routes.map((route) => ({
      id: route.id,
      source: route.sourceInputId,
      target: route.targetOutputId,
      animated: false,
      type: 'straight',
      style: {
        stroke: selection?.kind === 'route' && selection.id === route.id ? '#8a67a3' : '#6e4a86',
        strokeWidth: selection?.kind === 'route' && selection.id === route.id ? 4 : 2.5,
        strokeDasharray: route.enabled ? undefined : '8 6',
        opacity: route.enabled ? 1 : 0.7,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selection?.kind === 'route' && selection.id === route.id ? '#8a67a3' : '#6e4a86',
      },
    })) ?? []

  async function onConnect(connection: Connection) {
    if (!connection.source || !connection.target) {
      return
    }

    const duplicateExists =
      api.workspace?.routes.some(
        (route) =>
          route.sourceInputId === connection.source &&
          route.targetOutputId === connection.target,
      ) ?? false

    if (duplicateExists) {
      return
    }

    const created = await api.createRoute({
      sourceInputId: connection.source,
      targetOutputId: connection.target,
    })
    if (created) {
      setSelection({ kind: 'route', id: created.id })
    }
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <ReactFlowProvider>
        <Box className="app-shell">
          {api.error && <Alert severity="error">{api.error}</Alert>}

          <WorkspaceCanvas
            loading={api.loading}
            saving={api.saving}
            hasWorkspace={api.workspace != null}
            canvasHeight={canvasHeight}
            canvasShellRef={setCanvasShellRef}
            reactFlowRef={reactFlowRef}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            onNodeClick={(nodeId) => {
              const isInput = api.workspace?.inputs.some((input) => input.id === nodeId)
              setSelection({ kind: isInput ? 'input' : 'output', id: nodeId })
            }}
            onEdgeClick={(edgeId) => setSelection({ kind: 'route', id: edgeId })}
            onCreateInput={async () => {
              const created = await api.createInput(createDefaultInput())
              if (created) {
                setSelection({ kind: 'input', id: created.id })
              }
            }}
            onCreateOutput={async () => {
              const created = await api.createOutput(createDefaultOutput())
              if (created) {
                setSelection({ kind: 'output', id: created.id })
              }
            }}
            onOpenRuleSets={() => setRuleSetManagerOpen(true)}
          />

          <InspectorDrawer
            open={selection != null}
            inputDraft={inputDraft}
            outputDraft={outputDraft}
            routeDraft={routeDraft}
            interfaceOptions={api.interfaceOptions}
            workspace={api.workspace}
            onClose={() => setSelection(null)}
            onInputChange={setInputDraft}
            onOutputChange={setOutputDraft}
            onRouteChange={setRouteDraft}
            onSaveInput={() => void (inputDraft ? api.updateInput(inputDraft) : undefined)}
            onSaveOutput={() => void (outputDraft ? api.updateOutput(outputDraft) : undefined)}
            onSaveRoute={() => void (routeDraft ? api.updateRoute(routeDraft) : undefined)}
            onDeleteInput={() => {
              if (!inputDraft) {
                return
              }
              void api.deleteInput(inputDraft.id)
              setSelection(null)
            }}
            onDeleteOutput={() => {
              if (!outputDraft) {
                return
              }
              void api.deleteOutput(outputDraft.id)
              setSelection(null)
            }}
            onDeleteRoute={() => {
              if (!routeDraft) {
                return
              }
              void api.deleteRoute(routeDraft.id)
              setSelection(null)
            }}
            onOpenRuleBuilder={() => setRuleSetManagerOpen(true)}
          />

          <RuleSetManagerDialog
            open={ruleSetManagerOpen}
            workspaceRuleSets={api.workspace?.ruleSets ?? []}
            selectedRuleSetId={selectedRuleSetId}
            onClose={() => setRuleSetManagerOpen(false)}
            onSelectRuleSet={setSelectedRuleSetId}
            onCreateRuleSet={async () => {
              const created = await api.createRuleSet(createDefaultRuleSet('replacement'))
              if (created) {
                setSelectedRuleSetId(created.id)
              }
            }}
            onDeleteRuleSet={async (id) => {
              await api.deleteRuleSet(id)
              const remaining = (api.workspace?.ruleSets ?? []).filter((ruleSet) => ruleSet.id !== id)
              setSelectedRuleSetId(remaining[0]?.id ?? null)
            }}
            onSaveRuleSet={(ruleSet) => void api.updateRuleSet(ruleSet)}
          />
        </Box>
      </ReactFlowProvider>
    </ThemeProvider>
  )
}

export default App
