import {Icon, type IconSymbol} from '@sanity/icons'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card, Grid, Text, Tooltip} from '@sanity/ui'
import copy from 'copy-to-clipboard'
import {useEffect, useState} from 'react'

import {getImportCode} from './icon-code'

const COPY_FEEDBACK_DURATION = 1500

const GRID_STYLE = {gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))'}

// `Card`'s `border` prop has no effect when `as="button"` (its button-reset
// CSS sets `border: 0`), so the border is drawn via inline style instead.
// Centering is done here (rather than a nested `<Flex height="fill">`)
// because in WebKit a percentage-height flex child of an aspect-ratio box
// resolves against the border box, overflowing past the bottom padding and
// pushing its content down.
const TILE_STYLE = {
  aspectRatio: '1',
  border: '1px solid var(--card-border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// `lineHeight: 0` collapses the icon's inline line box so its baseline
// whitespace doesn't push it off-center. Sized to match the icon in list view.
const ICON_STYLE = {fontSize: '33px', lineHeight: 0}

type CopyState = 'idle' | 'copied' | 'error'

export function GridView({iconKeys}: {iconKeys: string[]}) {
  return (
    <Grid gap={2} style={GRID_STYLE}>
      {iconKeys.map((key) => (
        <GridIconTile key={key} icon={key} />
      ))}
    </Grid>
  )
}

function GridIconTile({icon}: {icon: string}) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return undefined

    const timeout = setTimeout(() => setState('idle'), COPY_FEEDBACK_DURATION)
    return () => clearTimeout(timeout)
  }, [state])

  function handleCopy() {
    copy(getImportCode(icon)).then(
      (ok) => setState(ok ? 'copied' : 'error'),
      () => setState('error'),
    )
  }

  const tone = state === 'copied' ? 'positive' : state === 'error' ? 'critical' : 'default'
  const iconElement =
    state === 'copied' ? (
      <CheckmarkIcon />
    ) : state === 'error' ? (
      <ErrorOutlineIcon />
    ) : (
      <Icon symbol={icon as IconSymbol} />
    )

  return (
    <Tooltip content={<TooltipLabel>{icon}</TooltipLabel>} placement="top" portal>
      <Card
        __unstable_focusRing
        aria-label={`Copy import for ${icon}`}
        as="button"
        onClick={handleCopy}
        padding={1}
        radius={2}
        style={TILE_STYLE}
        tone={tone}
      >
        <span style={ICON_STYLE}>{iconElement}</span>
      </Card>
    </Tooltip>
  )
}

function TooltipLabel({children}: {children: React.ReactNode}) {
  return (
    <Card padding={2} radius={2} tone="default">
      <Text size={1}>{children}</Text>
    </Card>
  )
}
