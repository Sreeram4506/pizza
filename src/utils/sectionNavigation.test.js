/** @jest-environment jsdom */

import { describe, expect, it, beforeEach, jest } from '@jest/globals'

describe('section navigation helper', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('scrolls to the target section with the fixed-header offset applied', async () => {
    const scrollToSpy = jest.fn()
    document.body.innerHTML = '<header style="height:72px"></header><section id="atelier"></section>'

    const section = document.querySelector('#atelier')
    const scrollIntoViewSpy = jest.fn()
    section.scrollIntoView = scrollIntoViewSpy

    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '#atelier') return section
      return null
    })

    const { scrollToSection } = await import('./sectionNavigation')
    scrollToSection('#atelier')

    expect(scrollIntoViewSpy).toHaveBeenCalledWith(expect.objectContaining({
      behavior: 'smooth',
      block: 'start'
    }))
  })
})
