import {Icon, type IconSymbol} from '@sanity/icons'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card, Flex, Grid, Text, Tooltip} from '@sanity/ui'
import copy from 'copy-to-clipboard'
import {useEffect, useState} from 'react'

import {getImportCode} from './icon-code'

const COPY_FEEDBACK_DURATION = 1500

const GRID_STYLE = {gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))'}

// `Card`'s `border` prop has no effect when `as="button"` (its button-reset
// CSS sets `border: 0`), so the border is drawn via inline style instead.
const TILE_STYLE = {aspectRatio: '1', border: '1px solid var(--card-border-color)'}

// `lineHeight: 0` collapses the icon's inline line box so its baseline
// whitespace doesn't push it off-center within the flex-centered tile.
const ICON_STYLE = {fontSize: '20px', lineHeight: 0}

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
        padding={2}
        radius={2}
        style={TILE_STYLE}
        tone={tone}
      >
        <Flex align="center" height="fill" justify="center" style={ICON_STYLE}>
          {iconElement}
        </Flex>
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
