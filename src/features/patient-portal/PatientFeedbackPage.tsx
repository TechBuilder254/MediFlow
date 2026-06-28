import { useState } from 'react'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ApprovalGate } from '@/features/patient-portal/components/ApprovalGate'

const CATEGORIES = ['Doctor', 'Nurse', 'Hospital', 'Laboratory', 'Reception']

export function PatientFeedbackPage() {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  return (
    <ApprovalGate>
      <PageHeader title="Feedback" description="Rate your experience and help us improve" />
      {submitted ? (
        <Card className="text-center py-12">
          <Star className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="font-semibold text-navy-900">Thank you for your feedback!</p>
        </Card>
      ) : (
        <Card className="max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-navy-700">Category</label>
              <select className="w-full mt-1.5 rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-700">Rating</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} className="p-1">
                    <Star className={`h-7 w-7 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-navy-200'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-navy-700">Comments</label>
              <textarea rows={4} className="w-full mt-1.5 rounded-xl border border-navy-200 px-4 py-2.5 text-sm" placeholder="Share your experience..." />
            </div>
            <Button onClick={() => setSubmitted(true)}>Submit Feedback</Button>
          </div>
        </Card>
      )}
    </ApprovalGate>
  )
}
