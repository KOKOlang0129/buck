import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScenarioEditor } from '@/components/editor/ScenarioEditor'
import { mockDataService } from '@/services/mockDataService'

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [initialContent, setInitialContent] = useState('')
  const scenarioId = searchParams.get('id')

  useEffect(() => {
    if (scenarioId) {
      const scenario = mockDataService.getScenario(scenarioId)
      if (scenario) {
        setInitialContent(scenario.content)
      }
    }
  }, [scenarioId])

  const handleSave = (scenario: any) => {
    console.log('Saving scenario:', scenario)
  }

  return (
    <div className="min-h-screen">
      <ScenarioEditor
        initialContent={initialContent}
        onSave={handleSave}
      />
    </div>
  )
}

export default EditorPage
