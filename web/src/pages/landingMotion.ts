import { gsap } from 'gsap'

type MotionOptions = { mobile: boolean; intro: boolean }

/** Called inside the journey's GSAP context: pause, media changes and unmount revert all styles. */
export function createLandingMotion(root: HTMLElement, { mobile, intro }: MotionOptions) {
  const timelines: { element: Element; animation: gsap.core.Timeline }[] = []
  const select = (selector: string) => root.querySelector<HTMLElement>(selector)!
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector))
  const distance = mobile ? 10 : 20

  function sequence(element: Element, end = 'top 64%') {
    const animation = gsap.timeline({
      defaults: { duration: 1, ease: 'none' },
      scrollTrigger: { trigger: element, start: 'top 96%', end, scrub: 0.25, invalidateOnRefresh: true },
    })
    timelines.push({ element, animation })
    return animation
  }

  // Word masks keep line wrapping native, including after font load or a resize.
  for (const heading of all('.landing-section h2, .closing h2')) {
    const words = heading.querySelectorAll('.motion-word-text')
    const animation = sequence(heading, 'top 72%')
    if (words.length) {
      animation.fromTo(words, { yPercent: 75, opacity: 0.3 }, {
        yPercent: 0, opacity: 1, stagger: 0.075,
      })
    } else {
      animation.fromTo(heading, { y: distance * 0.6, opacity: 0.4, clipPath: 'inset(0 0 22% 0)' }, {
        y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)',
      })
    }
  }

  const hero = gsap.timeline({ defaults: { ease: 'power3.out' } })
  if (intro) {
    hero.fromTo(select('.hero h1').querySelectorAll('.motion-word-text'),
      { yPercent: 100, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.045 }, 0)
      .fromTo(select('.hero-copy .lead'), { y: 14, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.65, clearProps: 'transform,opacity' }, 0.2)
      .fromTo(select('.hero-copy .primary'), { y: 10, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.5, clearProps: 'transform,opacity' }, 0.35)
      .fromTo(select('.hero-copy .hint'), { opacity: 0.3 }, { opacity: 1, duration: 0.5, clearProps: 'opacity' }, 0.45)
      .fromTo(select('.hero-player'), { y: 18, scale: 0.97, opacity: 0.4 }, { y: 0, scale: 1, opacity: 1, duration: 0.75, clearProps: 'transform,opacity' }, 0.3)
    timelines.push({ element: select('.hero'), animation: hero })
  }

  // The product preview comes into focus; its caption leads the larger visual.
  sequence(select('.film-intro .hint')).fromTo(select('.film-intro .hint'), { opacity: 0.35, y: 8 }, { opacity: 1, y: 0 })
  const film = select('.film-frame')
  sequence(film, 'top 58%').fromTo(film, {
    scale: mobile ? 0.975 : 0.94, opacity: 0.55, filter: mobile ? 'none' : 'blur(3px)',
  }, { scale: 1, opacity: 1, filter: mobile ? 'none' : 'blur(0px)' })
  sequence(select('.section-index')).fromTo(select('.section-index'), { opacity: 0.4, x: distance }, { opacity: 1, x: 0 })

  // Give each card its own range. Long mobile stacks must not finish offscreen.
  all('.made-for li').forEach((card, index) => {
    sequence(card, 'top 60%').fromTo(card, {
      y: distance * (1 + (index % 3) * 0.3), opacity: 0.5,
      clipPath: `inset(${mobile ? 3 : 7}% 0 0 0 round 12px)`,
    }, { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0 round 12px)' })
    const body = card.querySelector('.made-for-body')!
    sequence(body, 'top 70%')
      .fromTo(body.querySelector('h3'), { y: 14, opacity: 0.45 }, { y: 0, opacity: 1 }, 0)
      .fromTo(body.querySelector('p'), { y: 10, opacity: 0.45 }, { y: 0, opacity: 1 }, 0.12)
      .fromTo(body.querySelector('button'), { y: 6, opacity: 0.6 }, { y: 0, opacity: 1 }, 0.24)
  })

  all('.scene-grid .tile').forEach((card, index) => {
    sequence(card, 'top 65%')
      .fromTo(card.querySelector('.tile-art'), { scale: 0.95, y: distance + (index % 3) * 4, opacity: 0.45 }, { scale: 1, y: 0, opacity: 1 }, 0)
      .fromTo(card.querySelector('.tile-button'), { x: mobile ? 0 : 8, opacity: 0.4 }, { x: 0, opacity: 1 }, 0.12)
      .fromTo(card.querySelector('.tile-description'), { opacity: 0.35 }, { opacity: 1 }, 0.22)
  })
  sequence(select('.scene-section > .hint')).fromTo(select('.scene-section > .hint'), { opacity: 0.4 }, { opacity: 1 })

  // The numbered process opens horizontally beside the unfolding sound waves.
  all('.steps li').forEach((step) => {
    sequence(step, 'top 66%')
      .fromTo(step.querySelector('h3'), { x: mobile ? 8 : 20, opacity: 0.4 }, { x: 0, opacity: 1 }, 0)
      .fromTo(step.querySelector('p'), { x: mobile ? 5 : 12, opacity: 0.35 }, { x: 0, opacity: 1 }, 0.16)
  })

  // The gallery settles into place, with gentle image parallax after the entrance.
  all('.gallery li').forEach((card, index) => {
    sequence(card, 'top 65%')
      .fromTo(card, { y: distance, scale: 0.965, rotation: mobile ? 0 : (index % 2 ? 0.7 : -0.7), opacity: 0.5 }, { y: 0, scale: 1, rotation: 0, opacity: 1 }, 0)
      .fromTo(card.querySelector('span'), { y: 8, opacity: 0.5 }, { y: 0, opacity: 1 }, 0.15)
    gsap.fromTo(card.querySelector('.tile-art'), { yPercent: -2, scale: 1.07 }, {
      yPercent: 2, scale: 1.07, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  })

  all('.question-list details').forEach((detail) => {
    sequence(detail, 'top 76%').fromTo(detail, { x: mobile ? 6 : 14, opacity: 0.4 }, { x: 0, opacity: 1 })
  })
  all('.about-copy > *').forEach((element, index) => {
    sequence(element, 'top 73%').fromTo(element, { y: index === 2 ? 6 : distance * 0.6, opacity: 0.4 }, { y: 0, opacity: 1 })
  })
  const closing = select('.closing .primary')
  sequence(closing, 'top 72%').fromTo(closing, { y: 18, scale: 0.96, opacity: 0.4 }, { y: 0, scale: 1, opacity: 1 })

  // Keyboard users never have to wait for, or interact through, an unfinished reveal.
  const showFocusedContent = (event: FocusEvent) => {
    if (!(event.target instanceof Node)) return
    for (const { element, animation } of timelines) {
      if (!element.contains(event.target)) continue
      animation.scrollTrigger?.disable(false)
      animation.progress(1)
    }
  }
  root.addEventListener('focusin', showFocusedContent)
  return { hero, cleanup: () => root.removeEventListener('focusin', showFocusedContent) }
}
