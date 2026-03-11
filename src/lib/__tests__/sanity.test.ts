import { describe, it, expect } from 'vitest'
import { cn } from '~/lib/utils'

describe('sanity', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('cn() merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('cn() handles conditional classes', () => {
    const isHidden = false
    expect(cn('base', isHidden && 'hidden', 'extra')).toBe('base extra')
  })
})
