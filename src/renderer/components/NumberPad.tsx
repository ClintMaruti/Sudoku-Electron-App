interface NumberPadProps {
  onDigit: (digit: number) => void
  onClear: () => void
  disabled?: boolean
}

export function NumberPad({ onDigit, onClear, disabled }: NumberPadProps) {
  return (
    <div className="number-pad" role="group" aria-label="Number pad">
      {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((digit) => (
        <button
          key={digit}
          type="button"
          className="number-pad-btn"
          disabled={disabled}
          onClick={() => onDigit(digit)}
          aria-label={`Enter ${digit}`}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="number-pad-btn number-pad-clear"
        disabled={disabled}
        onClick={onClear}
        aria-label="Clear cell"
      >
        ⌫
      </button>
    </div>
  )
}
