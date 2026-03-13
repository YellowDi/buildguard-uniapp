import fs from 'node:fs'
import path from 'node:path'

const rootArg = process.argv[2]

if (!rootArg) {
  console.error('Usage: node scripts/patch-mp-weixin-json.mjs <mp-root>')
  process.exit(1)
}

const root = path.resolve(rootArg)

const placeholderMap = {
  'pages/login/index.json': {
    'app-icon': 'view',
  },
  'pages/inspection/index.json': {
    'app-icon': 'view',
    'base-sheet': 'view',
    'page-state-card': 'view',
    'user-card-menu': 'view',
  },
  'pages/task-detail/index.json': {
    'app-icon': 'view',
    'base-sheet': 'view',
    'page-state-card': 'view',
    'inspection-editor-sheet': 'view',
    'task-report-sheet': 'view',
  },
  'pages/maintenance/index.json': {
    'app-icon': 'view',
    'base-sheet': 'view',
    'page-state-card': 'view',
    'user-card-menu': 'view',
  },
  'pages/maintenance-detail/index.json': {
    'app-icon': 'view',
    'page-state-card': 'view',
    'maintenance-execution-sheet': 'view',
    'maintenance-result-sheet': 'view',
  },
  'components/common/BaseSheet.json': {
    'app-icon': 'view',
  },
  'components/common/UserCardMenu.json': {
    'app-icon': 'view',
  },
  'components/common/page-state-card.json': {
    'app-icon': 'view',
  },
  'components/common/media-grid-field.json': {
    'app-icon': 'view',
  },
  'components/inspection/InspectionEditorSheet.json': {
    'base-sheet': 'view',
    'media-grid-field': 'view',
    'app-icon': 'view',
  },
  'components/inspection/TaskReportSheet.json': {
    'base-sheet': 'view',
    'app-icon': 'view',
  },
  'components/maintenance/MaintenanceExecutionSheet.json': {
    'base-sheet': 'view',
    'media-grid-field': 'view',
  },
  'components/maintenance/MaintenanceResultSheet.json': {
    'base-sheet': 'view',
    'media-grid-field': 'view',
  },
}

for (const [relativeFile, placeholders] of Object.entries(placeholderMap)) {
  const target = path.join(root, relativeFile)
  if (!fs.existsSync(target)) continue

  const json = JSON.parse(fs.readFileSync(target, 'utf8'))
  json.componentPlaceholder = {
    ...(json.componentPlaceholder || {}),
    ...placeholders,
  }

  fs.writeFileSync(target, `${JSON.stringify(json, null, 2)}\n`)
}

console.log(`Patched componentPlaceholder in ${root}`)
