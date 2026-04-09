import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import type {
  GatewayInput,
  GatewayOutput,
  NetworkInterfaceOption,
} from '../../shared/models/gateway.ts'

type EndpointEditorProps = {
  title: string
  endpoint: GatewayInput | GatewayOutput
  interfaceOptions?: NetworkInterfaceOption[]
  showInterface?: boolean
  onChange: (next: GatewayInput | GatewayOutput) => void
  onSave: () => void
  onDelete: () => void
}

export function EndpointEditor({
  title,
  endpoint,
  interfaceOptions = [],
  showInterface = false,
  onChange,
  onSave,
  onDelete,
}: EndpointEditorProps) {
  const endpointInterface = 'interface' in endpoint ? endpoint.interface : '0.0.0.0'
  const dropdownInterfaceOptions = interfaceOptions.some(
    (option) => option.address === endpointInterface,
  )
    ? interfaceOptions
    : [
        ...interfaceOptions,
        {
          id: `nic-current-${endpointInterface}`,
          name: endpointInterface,
          address: endpointInterface,
        },
      ]

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      <TextField
        label="Name"
        value={endpoint.name}
        onChange={(event) => onChange({ ...endpoint, name: event.target.value })}
      />
      <TextField
        label="Host"
        value={endpoint.host}
        onChange={(event) => onChange({ ...endpoint, host: event.target.value })}
      />
      <TextField
        label="Port"
        type="number"
        value={endpoint.port}
        onChange={(event) => onChange({ ...endpoint, port: Number(event.target.value) })}
      />
      <TextField
        select
        label="Mode"
        value={endpoint.mode}
        onChange={(event) =>
          onChange({ ...endpoint, mode: event.target.value as GatewayInput['mode'] })
        }
      >
        <MenuItem value="multicast">Multicast</MenuItem>
        <MenuItem value="unicast">Unicast</MenuItem>
      </TextField>
      {showInterface && (
        <TextField
          select
          label="Interface"
          value={endpointInterface}
          onChange={(event) =>
            onChange({ ...endpoint, interface: event.target.value } as GatewayInput | GatewayOutput)
          }
        >
          {dropdownInterfaceOptions.map((option) => (
            <MenuItem key={option.id} value={option.address}>
              {option.name} ({option.address})
            </MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        label="Description"
        multiline
        minRows={3}
        value={endpoint.description}
        onChange={(event) => onChange({ ...endpoint, description: event.target.value })}
      />
      <Stack direction="row" spacing={1}>
        <Button onClick={onSave}>Save</Button>
        <Button color="inherit" onClick={onDelete}>
          Delete
        </Button>
      </Stack>
    </Stack>
  )
}
