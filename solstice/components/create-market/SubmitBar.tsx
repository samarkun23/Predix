import Button from '@/components/ui/Button'

interface SubmitBarProps {
  isValid: boolean
  onDiscard: () => void
  onSubmit: () => void
}

export default function SubmitBar({ isValid, onDiscard, onSubmit }: SubmitBarProps) {
  return (
    <div className="safe-bottom sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onDiscard}>
          DISCARD
        </Button>
        <Button type="button" variant="primary" disabled={!isValid} onClick={onSubmit}>
          DEPLOY_MARKET
        </Button>
      </div>
    </div>
  )
}
