import { Fragment } from 'react'

/** Keep natural word wrapping and accessible text while masking each moving word. */
export function MotionText({ children }: { children: string }) {
  return <>{children.split(' ').map((word, index) => (
    <Fragment key={`${index}-${word}`}>
      {index > 0 && ' '}
      <span className="motion-word"><span className="motion-word-text">{word}</span></span>
    </Fragment>
  ))}</>
}
