import { useState } from 'react'

interface AddAgentModalProps {
  onClose: () => void
}

export default function AddAgentModal({ onClose }: AddAgentModalProps) {
  const [name, setName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !webhookUrl.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, webhookUrl }),
      })
      onClose()
    } catch (err) {
      console.error('Failed to add agent:', err)
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Add Agent</h2>
        <input
          data-testid="agent-name-input"
          type="text"
          placeholder="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          data-testid="agent-webhook-input"
          type="text"
          placeholder="Webhook URL"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modal-btn-add"
            data-testid="add-agent-submit"
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !webhookUrl.trim()}
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
