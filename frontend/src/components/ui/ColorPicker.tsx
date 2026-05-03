import { useState } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const presetColors = [
  '#E8B4B8', // Primary pink
  '#A9BDAD', // Secondary green
  '#C5A059', // Accent gold
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F59E0B', // Amber
]

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="space-y-3">
      {/* Preset Colors */}
      <div className="flex flex-wrap gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
              value === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom Color Toggle */}
      <button
        type="button"
        onClick={() => setShowCustom(!showCustom)}
        className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        {showCustom ? '隐藏自定义颜色' : '使用自定义颜色'}
      </button>

      {/* Custom Color Input */}
      {showCustom && (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#FFFFFF"
            className="input flex-1"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      )}

      {/* Preview */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">预览：</span>
        <span
          className="px-3 py-1 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: value }}
        >
          示例标签
        </span>
      </div>
    </div>
  )
}
