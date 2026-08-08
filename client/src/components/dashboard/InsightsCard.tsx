import { Lightbulb } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function InsightsCard({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-amber-500 mt-0.5">💡</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}