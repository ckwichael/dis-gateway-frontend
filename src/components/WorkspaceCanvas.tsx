import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RuleIcon from '@mui/icons-material/Rule'
import {
  Background,
  ConnectionLineType,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
} from '@xyflow/react'

type WorkspaceCanvasProps = {
  loading: boolean
  saving: boolean
  hasWorkspace: boolean
  canvasHeight: number
  canvasShellRef: (element: HTMLDivElement | null) => void
  reactFlowRef: React.RefObject<ReactFlowInstance<Node, Edge> | null>
  nodes: Node[]
  edges: Edge[]
  nodeTypes: NodeTypes
  onConnect: (connection: Connection) => void
  onNodeClick: (nodeId: string) => void
  onEdgeClick: (edgeId: string) => void
  onCreateInput: () => void
  onCreateOutput: () => void
  onOpenRuleSets: () => void
}

export function WorkspaceCanvas({
  loading,
  saving,
  hasWorkspace,
  canvasHeight,
  canvasShellRef,
  reactFlowRef,
  nodes,
  edges,
  nodeTypes,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onCreateInput,
  onCreateOutput,
  onOpenRuleSets,
}: WorkspaceCanvasProps) {
  return (
    <Box className="canvas-panel canvas-panel--full">
      <Stack className="workspace-toolbar" spacing={2.25}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'center' }, gap: 1.5 }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              DIS Gateway
            </Typography>
            {(loading || saving) && <CircularProgress size={18} />}
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button startIcon={<AddIcon />} onClick={onCreateInput}>
              Input
            </Button>
            <Button startIcon={<AddIcon />} onClick={onCreateOutput}>
              Output
            </Button>
            <Button color="inherit" startIcon={<RuleIcon />} onClick={onOpenRuleSets}>
              Rule Sets
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {loading || !hasWorkspace ? (
        <Box className="canvas-loading">
          <CircularProgress />
        </Box>
      ) : (
        <Box ref={canvasShellRef} className="canvas-shell" sx={{ height: canvasHeight }}>

          <ReactFlow
            onInit={(instance) => {
              reactFlowRef.current = instance
              instance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 })
            }}
            viewport={{ x: 0, y: 0, zoom: 1 }}
            connectionRadius={220}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            connectionLineType={ConnectionLineType.Straight}
            onNodeClick={(_, node) => onNodeClick(node.id)}
            onEdgeClick={(_, edge) => onEdgeClick(edge.id)}
            defaultEdgeOptions={{ type: 'straight' }}
            nodesConnectable
            autoPanOnConnect={false}
            autoPanOnNodeDrag={false}
            panOnDrag={false}
            panOnScroll={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesFocusable={false}
            edgesFocusable={false}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={20} size={1} color="rgba(15, 118, 110, 0.12)" />
          </ReactFlow>
        </Box>
      )}
    </Box>
  )
}
