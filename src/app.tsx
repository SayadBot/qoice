import {
  BetterScrollAreaContent,
  BetterScrollAreaProvider,
} from './components/ui/better-scroll-area'
import { HistoryPage } from './features/history/history-page'
import { SettingsPage } from './features/settings/settings-page'

export function App() {
  return (
    <BetterScrollAreaProvider>
      <BetterScrollAreaContent>
        <div className="space-y-6 p-6">
          <SettingsPage />
          <HistoryPage />
        </div>
      </BetterScrollAreaContent>
    </BetterScrollAreaProvider>
  )
}
