import { Radar } from 'lucide-react'

/** CSS-only NEXORA brand mark used by the application shell. */
export function BrandMark() {
  return (
    <div className="brand-mark" aria-label="AquaSentinel by NEXORA">
      <div className="brand-row">
        <span className="brand-glyph" aria-hidden="true">
          <Radar size={16} strokeWidth={2.2} />
        </span>
        <div className="brand-id">
          <span className="brand-name">
            NEX<span className="accent">ORA</span>
          </span>
          <span className="brand-product">
            Aqua<span className="accent">Sentinel</span>
          </span>
        </div>
      </div>
    </div>
  )
}