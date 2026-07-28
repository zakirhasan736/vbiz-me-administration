import { AlertCircle } from 'lucide-react'

const FormErrorMessage = ({ message }: { message: string }) => {
  if (!message || message.trim() === '') {
    return null
  }
  return (
    <div className="flex items-center gap-1 text-xs font-medium text-red-500">
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  )
}

export default FormErrorMessage
