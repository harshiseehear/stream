import FilterPanel from '../Filter/FilterPanel'
import DraggablePanel from '../DraggablePanel'
import { bgPage } from '../../theme/colors'

export default function GraphFilterPanel({ records, filterRules, onFilterChange, conjunctions, onConjunctionsChange }) {
  const filterPanel = FilterPanel({
    records,
    rules: filterRules,
    conjunctions,
    onConjunctionsChange,
    onChange: onFilterChange,
  })

  return (
    <div style={{ pointerEvents: 'auto' }}>
      <DraggablePanel
        title="Views"
        defaultWidth={220}
        defaultHeight={200}
        defaultX={window.innerWidth - 220 - 16}
        defaultY={240}
        action={filterPanel.addButton}
        footer={filterPanel.chatInput}
        background={bgPage}
      >
        {filterPanel.body}
      </DraggablePanel>
    </div>
  )
}
