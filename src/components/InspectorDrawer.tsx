import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import type {
  GatewayInput,
  NetworkInterfaceOption,
  GatewayOutput,
  GatewayRoute,
  GatewayWorkspace,
} from '../../shared/models/gateway.ts'
import { EndpointEditor } from './EndpointEditor.tsx'

type InspectorDrawerProps = {
  open: boolean
  inputDraft: GatewayInput | null
  outputDraft: GatewayOutput | null
  routeDraft: GatewayRoute | null
  interfaceOptions: NetworkInterfaceOption[]
  workspace: GatewayWorkspace | null
  onClose: () => void
  onInputChange: (next: GatewayInput) => void
  onOutputChange: (next: GatewayOutput) => void
  onRouteChange: (next: GatewayRoute) => void
  onSaveInput: () => void
  onSaveOutput: () => void
  onSaveRoute: () => void
  onDeleteInput: () => void
  onDeleteOutput: () => void
  onDeleteRoute: () => void
  onOpenRuleBuilder: () => void
}

export function InspectorDrawer({
  open,
  inputDraft,
  outputDraft,
  routeDraft,
  interfaceOptions,
  workspace,
  onClose,
  onInputChange,
  onOutputChange,
  onRouteChange,
  onSaveInput,
  onSaveOutput,
  onSaveRoute,
  onDeleteInput,
  onDeleteOutput,
  onDeleteRoute,
  onOpenRuleBuilder,
}: InspectorDrawerProps) {
  const routePairExists =
    routeDraft != null &&
    workspace?.routes.some(
      (route) =>
        route.id !== routeDraft.id &&
        route.sourceInputId === routeDraft.sourceInputId &&
        route.targetOutputId === routeDraft.targetOutputId,
    ) === true

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { className: 'inspector-drawer' } }}
    >
      <Box className="inspector-drawer__content">
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5">Inspector</Typography>
            <Typography variant="body2" color="text.secondary">
              Edit the selected input, output, or route.
            </Typography>
          </Box>
          <Button color="inherit" onClick={onClose}>
            Close
          </Button>
        </Stack>

        {inputDraft && (
          <EndpointEditor
            title="Input Definition"
            endpoint={inputDraft}
            interfaceOptions={interfaceOptions}
            showInterface
            onChange={(next) => onInputChange(next as GatewayInput)}
            onSave={onSaveInput}
            onDelete={onDeleteInput}
          />
        )}

        {outputDraft && (
          <EndpointEditor
            title="Output Definition"
            endpoint={outputDraft}
            interfaceOptions={interfaceOptions}
            showInterface
            onChange={(next) => onOutputChange(next as GatewayOutput)}
            onSave={onSaveOutput}
            onDelete={onDeleteOutput}
          />
        )}

        {routeDraft && workspace && (
          <Stack spacing={2}>
            {routePairExists && (
              <Alert severity="warning">
                This input/output pair already has a route. Save is blocked until you pick a different pair.
              </Alert>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Route Definition
            </Typography>
            <TextField
              label="Route name"
              value={routeDraft.name}
              onChange={(event) => onRouteChange({ ...routeDraft, name: event.target.value })}
            />
            <TextField
              select
              label="Source input"
              value={routeDraft.sourceInputId}
              onChange={(event) =>
                onRouteChange({ ...routeDraft, sourceInputId: event.target.value })
              }
            >
              {workspace.inputs.map((input) => (
                <MenuItem key={input.id} value={input.id}>
                  {input.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Target output"
              value={routeDraft.targetOutputId}
              onChange={(event) =>
                onRouteChange({ ...routeDraft, targetOutputId: event.target.value })
              }
            >
              {workspace.outputs.map((output) => (
                <MenuItem key={output.id} value={output.id}>
                  {output.name}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={routeDraft.enabled}
                  onChange={(event) => onRouteChange({ ...routeDraft, enabled: event.target.checked })}
                />
              }
              label="Route enabled"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={routeDraft.passthroughUnknown}
                  onChange={(event) =>
                    onRouteChange({ ...routeDraft, passthroughUnknown: event.target.checked })
                  }
                />
              }
              label="Passthrough unsupported PDUs"
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Stats interval (sec)"
                type="number"
                value={routeDraft.statsIntervalSec}
                onChange={(event) =>
                  onRouteChange({ ...routeDraft, statsIntervalSec: Number(event.target.value) })
                }
              />
              <TextField
                select
                label="Log level"
                value={routeDraft.logLevel}
                onChange={(event) =>
                  onRouteChange({
                    ...routeDraft,
                    logLevel: event.target.value as GatewayRoute['logLevel'],
                  })
                }
              >
                <MenuItem value="info">info</MenuItem>
                <MenuItem value="debug">debug</MenuItem>
              </TextField>
            </Stack>
            <Autocomplete
              multiple
              options={workspace.ruleSets}
              getOptionLabel={(option) => option.name}
              value={workspace.ruleSets.filter((ruleSet) => routeDraft.filterRuleSetIds.includes(ruleSet.id))}
              onChange={(_, value) =>
                onRouteChange({ ...routeDraft, filterRuleSetIds: value.map((ruleSet) => ruleSet.id) })
              }
              renderInput={(params) => <TextField {...params} label="Filter rule sets" />}
            />
            <Autocomplete
              multiple
              options={workspace.ruleSets}
              getOptionLabel={(option) => option.name}
              value={workspace.ruleSets.filter((ruleSet) =>
                routeDraft.replacementRuleSetIds.includes(ruleSet.id),
              )}
              onChange={(_, value) =>
                onRouteChange({
                  ...routeDraft,
                  replacementRuleSetIds: value.map((ruleSet) => ruleSet.id),
                })
              }
              renderInput={(params) => <TextField {...params} label="Replacement rule sets" />}
            />
            <TextField
              label="Notes"
              multiline
              minRows={4}
              value={routeDraft.notes}
              onChange={(event) => onRouteChange({ ...routeDraft, notes: event.target.value })}
            />
            <Stack direction="row" spacing={1}>
              <Button color="inherit" onClick={onOpenRuleBuilder}>
                Open Rule Builder
              </Button>
              <Button disabled={routePairExists} onClick={onSaveRoute}>
                Save Route
              </Button>
              <Button color="inherit" onClick={onDeleteRoute}>
                Delete
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </Drawer>
  )
}
