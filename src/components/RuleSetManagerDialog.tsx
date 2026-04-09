import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import type {
  BuilderCondition,
  BuilderReplacement,
  EntityStateReplacementRule,
  MatchGroup,
  MatchNode,
  RuleSetDefinition,
} from '../../shared/models/gateway.ts'
import {
  buildRulePreview,
  createDefaultCondition,
  createDefaultEntityStateRule,
  createDefaultMatchGroup,
  createDefaultReplacement,
  entityStateFieldOptions,
} from '../../shared/models/gateway.ts'

type RuleSetManagerDialogProps = {
  open: boolean
  workspaceRuleSets: RuleSetDefinition[]
  selectedRuleSetId: string | null
  onClose: () => void
  onSelectRuleSet: (id: string) => void
  onCreateRuleSet: () => void
  onDeleteRuleSet: (id: string) => void
  onSaveRuleSet: (ruleSet: RuleSetDefinition) => void
}

export function RuleSetManagerDialog({
  open,
  workspaceRuleSets,
  selectedRuleSetId,
  onClose,
  onSelectRuleSet,
  onCreateRuleSet,
  onDeleteRuleSet,
  onSaveRuleSet,
}: RuleSetManagerDialogProps) {
  const selectedRuleSet =
    workspaceRuleSets.find((ruleSet) => ruleSet.id === selectedRuleSetId) ?? workspaceRuleSets[0] ?? null
  const [draft, setDraft] = useState<RuleSetDefinition | null>(selectedRuleSet)

  useEffect(() => {
    setDraft(selectedRuleSet)
  }, [selectedRuleSet])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { className: 'ruleset-dialog' } }}
    >
      <DialogTitle>Rule Set Builder</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 3 }}>
          <Stack spacing={1.25}>
            <Button startIcon={<AddIcon />} onClick={onCreateRuleSet}>
              New Replacement Rule Set
            </Button>
            {workspaceRuleSets.map((ruleSet) => (
              <Paper
                key={ruleSet.id}
                variant={ruleSet.id === draft?.id ? 'elevation' : 'outlined'}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  backgroundColor: ruleSet.id === draft?.id ? '#35333b' : '#2d2f34',
                  borderColor: ruleSet.id === draft?.id ? 'rgba(110, 74, 134, 0.45)' : 'rgba(255, 255, 255, 0.06)',
                  boxShadow: 'none',
                }}
                onClick={() => onSelectRuleSet(ruleSet.id)}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{ruleSet.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ruleSet.category}
                    </Typography>
                  </Box>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDeleteRuleSet(ruleSet.id)
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>

          {draft ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Rule set name"
                  fullWidth
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
                <TextField
                  label="Description"
                  fullWidth
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </Stack>

              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Entity State conditional replacements
              </Typography>

              <Stack spacing={2}>
                {(draft.builder?.rules ?? []).map((rule, ruleIndex) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    index={ruleIndex}
                    onChange={(nextRule) => setDraft(updateRuleSetRule(draft, rule.id, nextRule))}
                    onDelete={() => setDraft(removeRuleSetRule(draft, rule.id))}
                    onAddCondition={() =>
                      setDraft(
                        updateRuleSetRule(draft, rule.id, {
                          ...rule,
                          match: appendMatchNode(
                            rule.match ?? createDefaultMatchGroup('AND', []),
                            createDefaultCondition(),
                          ),
                        }),
                      )
                    }
                    onAddReplacement={() =>
                      setDraft(
                        updateRuleSetRule(draft, rule.id, {
                          ...rule,
                          replacements: [...rule.replacements, createDefaultReplacement()],
                        }),
                      )
                    }
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const nextRule = createDefaultEntityStateRule()
                    const nextBuilder = {
                      mode: 'entity-state-replacements' as const,
                      rules: [...(draft.builder?.rules ?? []), nextRule],
                    }
                    setDraft({
                      ...draft,
                      builder: nextBuilder,
                      draftRules: buildRulePreview(nextBuilder),
                    })
                  }}
                >
                  Add Rule
                </Button>
                <Button
                  color="secondary"
                  onClick={() => {
                    const next = normalizeDraftRuleSet(draft)
                    setDraft(next)
                    onSaveRuleSet(next)
                  }}
                >
                  Save Rule Set
                </Button>
              </Stack>

              <TextField
                label="Generated preview"
                multiline
                minRows={12}
                value={buildRulePreview(draft.builder)}
                slotProps={{ htmlInput: { readOnly: true } }}
              />
            </Stack>
          ) : (
            <Typography color="text.secondary">Create or select a rule set to begin.</Typography>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

type RuleCardProps = {
  rule: EntityStateReplacementRule
  index: number
  onChange: (rule: EntityStateReplacementRule) => void
  onDelete: () => void
  onAddCondition: () => void
  onAddReplacement: () => void
}

function RuleCard({
  rule,
  index,
  onChange,
  onDelete,
  onAddCondition,
  onAddReplacement,
}: RuleCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: '#2f3136',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        boxShadow: 'none',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Rule {index + 1}</Typography>
          <Button color="inherit" size="small" onClick={onDelete}>
            Remove Rule
          </Button>
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Rule name"
            fullWidth
            value={rule.name}
            onChange={(event) => onChange({ ...rule, name: event.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={rule.enabled}
                onChange={(event) => onChange({ ...rule, enabled: event.target.checked })}
              />
            }
            label="Enabled"
          />
        </Stack>

        <Typography variant="subtitle2">Match expression</Typography>
        {rule.match ? (
          <MatchGroupEditor
            group={rule.match}
            depth={0}
            isRoot
            onChange={(nextMatch) => onChange({ ...rule, match: nextMatch })}
            onDelete={() => onChange({ ...rule, match: null })}
          />
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderColor: 'rgba(255, 255, 255, 0.06)',
              backgroundColor: '#303238',
              boxShadow: 'none',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No match conditions. This rule will always apply its replacements.
            </Typography>
          </Paper>
        )}
        {!rule.match && (
          <Stack direction="row" spacing={1}>
            <Button color="inherit" size="small" onClick={onAddCondition}>
              Add Condition Group
            </Button>
          </Stack>
        )}

        <Typography variant="subtitle2">Apply these replacements</Typography>
        <Stack spacing={1}>
          {rule.replacements.map((replacement) => (
            <ReplacementRow
              key={replacement.id}
              replacement={replacement}
              onChange={(next) =>
                onChange({
                  ...rule,
                  replacements: rule.replacements.map((item) => (item.id === replacement.id ? next : item)),
                })
              }
              onDelete={() =>
                onChange({
                  ...rule,
                  replacements: rule.replacements.filter((item) => item.id !== replacement.id),
                })
              }
            />
          ))}
        </Stack>
        <Button color="inherit" size="small" onClick={onAddReplacement}>
          Add Replacement
        </Button>
      </Stack>
    </Paper>
  )
}

function MatchGroupEditor({
  group,
  depth,
  isRoot = false,
  onChange,
  onDelete,
}: {
  group: MatchGroup
  depth: number
  isRoot?: boolean
  onChange: (group: MatchGroup) => void
  onDelete?: () => void
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderColor: depth === 0 ? 'rgba(110, 74, 134, 0.3)' : 'rgba(255, 255, 255, 0.06)',
        backgroundColor: depth === 0 ? '#34323a' : '#303238',
        boxShadow: 'none',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip size="small" label={isRoot ? 'Root Group' : 'Group'} />
            <TextField
              select
              label="Operator"
              value={group.operator}
              sx={{ minWidth: 120 }}
              onChange={(event) =>
                onChange({ ...group, operator: event.target.value as MatchGroup['operator'] })
              }
            >
              <MenuItem value="AND">AND</MenuItem>
              <MenuItem value="OR">OR</MenuItem>
            </TextField>
          </Stack>
          {onDelete && (
            <Button color="inherit" size="small" onClick={onDelete}>
              Delete Group
            </Button>
          )}
        </Stack>

        <Stack spacing={1}>
          {group.children.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No conditions in this group yet.
            </Typography>
          ) : (
            group.children.map((child) =>
              child.type === 'condition' ? (
                <ConditionRow
                  key={child.id}
                  condition={child}
                  onChange={(next) => onChange(replaceMatchNode(group, child.id, next))}
                  onDelete={() => onChange(removeMatchNode(group, child.id))}
                />
              ) : (
                <MatchGroupEditor
                  key={child.id}
                  group={child}
                  depth={depth + 1}
                  onChange={(nextGroup) => onChange(replaceMatchNode(group, child.id, nextGroup))}
                  onDelete={() => onChange(removeMatchNode(group, child.id))}
                />
              ),
            )
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            size="small"
            onClick={() => onChange(appendMatchNode(group, createDefaultCondition()))}
          >
            Add Condition
          </Button>
          <Button
            color="inherit"
            size="small"
            onClick={() => onChange(appendMatchNode(group, createDefaultMatchGroup('AND')))}
          >
            Add Group
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

function ConditionRow({
  condition,
  onChange,
  onDelete,
}: {
  condition: BuilderCondition
  onChange: (condition: BuilderCondition) => void
  onDelete: () => void
}) {
  return (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        label="Field"
        value={condition.field}
        sx={{ minWidth: 220 }}
        onChange={(event) =>
          onChange({ ...condition, field: event.target.value as BuilderCondition['field'] })
        }
      >
        {entityStateFieldOptions.map((field) => (
          <MenuItem key={field} value={field}>
            {field}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Equals"
        type="number"
        value={condition.equals}
        onChange={(event) => onChange({ ...condition, equals: Number(event.target.value) })}
      />
      <Button color="inherit" onClick={onDelete}>
        Remove
      </Button>
    </Stack>
  )
}

function ReplacementRow({
  replacement,
  onChange,
  onDelete,
}: {
  replacement: BuilderReplacement
  onChange: (replacement: BuilderReplacement) => void
  onDelete: () => void
}) {
  return (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        label="Field"
        value={replacement.field}
        sx={{ minWidth: 220 }}
        onChange={(event) =>
          onChange({ ...replacement, field: event.target.value as BuilderReplacement['field'] })
        }
      >
        {entityStateFieldOptions.map((field) => (
          <MenuItem key={field} value={field}>
            {field}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label="Value"
        type="number"
        value={replacement.value}
        onChange={(event) => onChange({ ...replacement, value: Number(event.target.value) })}
      />
      <Button color="inherit" onClick={onDelete}>
        Remove
      </Button>
    </Stack>
  )
}

function normalizeDraftRuleSet(ruleSet: RuleSetDefinition): RuleSetDefinition {
  const builder = ruleSet.builder ?? { mode: 'entity-state-replacements', rules: [] }
  return {
    ...ruleSet,
    category: 'replacement',
    builder,
    draftRules: buildRulePreview(builder),
  }
}

function updateRuleSetRule(
  ruleSet: RuleSetDefinition,
  ruleId: string,
  nextRule: EntityStateReplacementRule,
): RuleSetDefinition {
  const rules = (ruleSet.builder?.rules ?? []).map((rule) => (rule.id === ruleId ? nextRule : rule))
  return normalizeDraftRuleSet({
    ...ruleSet,
    builder: {
      mode: 'entity-state-replacements',
      rules,
    },
  })
}

function removeRuleSetRule(ruleSet: RuleSetDefinition, ruleId: string): RuleSetDefinition {
  const rules = (ruleSet.builder?.rules ?? []).filter((rule) => rule.id !== ruleId)
  return normalizeDraftRuleSet({
    ...ruleSet,
    builder: {
      mode: 'entity-state-replacements',
      rules,
    },
  })
}

function appendMatchNode(group: MatchGroup, node: MatchNode): MatchGroup {
  return {
    ...group,
    children: [...group.children, node],
  }
}

function replaceMatchNode(group: MatchGroup, nodeId: string, nextNode: MatchNode): MatchGroup {
  return {
    ...group,
    children: group.children.map((child) =>
      child.id === nodeId ? nextNode : child.type === 'group' ? replaceMatchNode(child, nodeId, nextNode) : child,
    ),
  }
}

function removeMatchNode(group: MatchGroup, nodeId: string): MatchGroup {
  const nextChildren = group.children
    .filter((child) => child.id !== nodeId)
    .map((child) => (child.type === 'group' ? removeMatchNode(child, nodeId) : child))

  return {
    ...group,
    children: nextChildren,
  }
}
