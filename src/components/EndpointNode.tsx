import { Box, Chip, Stack, Typography } from '@mui/material'
import { Handle, Position, type NodeProps } from '@xyflow/react'

type EndpointNodeData = {
  title: string
  subtitle: string
  lane: 'input' | 'output'
}

export function EndpointNode({ data, selected }: NodeProps) {
  const endpoint = data as EndpointNodeData
  const isInput = endpoint.lane === 'input'

  return (
    <Box
      className="endpoint-node"
      sx={{
        width: 282,
        boxSizing: 'border-box',
        transform: 'translateX(-50%)',
        borderRadius: 1.5,
        border: selected ? '1px solid rgba(110, 74, 134, 0.85)' : '1px solid rgba(255, 255, 255, 0.08)',
        background: '#34363b',
        boxShadow: selected
          ? '0 0 0 1px rgba(110, 74, 134, 0.18), 0 8px 18px rgba(0, 0, 0, 0.18)'
          : '0 4px 12px rgba(0, 0, 0, 0.14)',
        px: 2,
        py: 1.75,
      }}
    >
      {isInput ? (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: 12,
            height: 12,
            background: '#6e4a86',
            border: '2px solid #28292d',
          }}
        />
      ) : (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 12,
            height: 12,
            background: '#6e4a86',
            border: '2px solid #28292d',
          }}
        />
      )}
      <Stack spacing={1}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {endpoint.title}
          </Typography>
          <Chip
            size="small"
            label={isInput ? 'Input' : 'Output'}
            sx={{
              backgroundColor: '#3a3c42',
              color: '#d2ccd9',
              fontWeight: 700,
            }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {endpoint.subtitle}
        </Typography>
      </Stack>
    </Box>
  )
}
