import { notFound } from 'next/navigation'
import { ColorPickerHarness } from './harness'

export default function ColorPickerHarnessPage() {
  if (process.env.NEXT_PUBLIC_COLOR_PICKER_HARNESS !== '1') notFound()
  return <ColorPickerHarness />
}
